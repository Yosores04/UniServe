// Optional Windows/Edge smoke check against an already running `npm run demo`.
// Creates isolated browser sessions, signs in, checks phone-sized rendering, and
// saves screenshots to a temporary directory. It does not place demo orders.
import { spawn } from "node:child_process";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve, dirname, basename } from "node:path";
import { setTimeout as delay } from "node:timers/promises";

const directory = await mkdtemp(join(tmpdir(), "uniserve-browser-"));
const browser = spawn("C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", [
  "--headless=new", "--disable-gpu", "--no-first-run", "--remote-debugging-port=9224",
  `--user-data-dir=${join(directory, "profile")}`, "about:blank",
], { stdio: "ignore", windowsHide: true });
let socket;
const origin = process.env.DEMO_URL ?? "http://127.0.0.1:5173";
try {
  let version;
  for (let attempt = 0; attempt < 50; attempt++) {
    try { version = await (await fetch("http://127.0.0.1:9224/json/version")).json(); break; } catch { await delay(100); }
  }
  if (!version) throw new Error("Could not start Edge debugging endpoint.");
  socket = new WebSocket(version.webSocketDebuggerUrl);
  await new Promise((yes, no) => { socket.addEventListener("open", yes, { once: true }); socket.addEventListener("error", no, { once: true }); });
  let nextId = 0;
  const pending = new Map();
  const browserErrors = [];
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.method === "Runtime.exceptionThrown") browserErrors.push(message.params.exceptionDetails.text);
    const request = pending.get(message.id);
    if (request) { pending.delete(message.id); clearTimeout(request.timer); message.error ? request.reject(new Error(message.error.message)) : request.resolve(message.result); }
  });
  const call = (method, params = {}, sessionId) => new Promise((resolvePromise, reject) => {
    const id = ++nextId;
    const timer = setTimeout(() => { pending.delete(id); reject(new Error(`Timed out: ${method}`)); }, 15000);
    pending.set(id, { resolve: resolvePromise, reject, timer });
    socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
  });
  const evaluate = async (session, expression) => {
    const result = await call("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true }, session);
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
    return result.result.value;
  };
  const until = async (session, expression) => {
    for (let attempt = 0; attempt < 80; attempt++) { if (await evaluate(session, expression)) return; await delay(100); }
    throw new Error(`Condition not met: ${expression}`);
  };
  const roles = [
    ["customer", "customer@uniserve.local", "Customer123!", "Campus marketplace"],
    ["seller", "entrepreneur@uniserve.local", "Shop123!", "Products & availability"],
    ["courier", "rider@uniserve.local", "Rider123!", "Campus job board"],
    ["admin", "admin@uniserve.local", "Admin123!", "Orders across campus"],
  ];
  for (const [role, email, password, title] of roles) {
    const { browserContextId } = await call("Target.createBrowserContext");
    const { targetId } = await call("Target.createTarget", { url: "about:blank", browserContextId });
    const { sessionId } = await call("Target.attachToTarget", { targetId, flatten: true });
    await call("Runtime.enable", {}, sessionId);
    await call("Page.enable", {}, sessionId);
    await call("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true }, sessionId);
    await call("Page.navigate", { url: origin }, sessionId);
    await until(sessionId, "Boolean(document.querySelector('input[type=email]'))");
    await evaluate(sessionId, `(() => {
      const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      for (const [selector,value] of [['input[type=email]',${JSON.stringify(email)}],['input[type=password]',${JSON.stringify(password)}]]) {
        const input = document.querySelector(selector); set.call(input,value); input.dispatchEvent(new Event('input',{bubbles:true}));
      }
      document.querySelector('button[type=submit]').click();
    })()`);
    await until(sessionId, `document.body.innerText.includes(${JSON.stringify(title)})`);
    for (const width of [320, 1440, 390]) {
      await call("Emulation.setDeviceMetricsOverride", { width, height: 844, deviceScaleFactor: 1, mobile: width < 600 }, sessionId);
      const dimensions = await evaluate(sessionId, "({width:innerWidth,scroll:document.documentElement.scrollWidth})");
      if (dimensions.scroll > dimensions.width + 1) throw new Error(`${role}: horizontal overflow ${JSON.stringify(dimensions)}`);
    }
    const screenshot = await call("Page.captureScreenshot", { format: "png", captureBeyondViewport: false }, sessionId);
    const path = join(directory, `${role}.png`);
    await writeFile(path, Buffer.from(screenshot.data, "base64"));
    console.log(`${role}: signed in and rendered at 320px, 390px, and 1440px without horizontal overflow. Screenshot: ${path}`);
    await call("Target.disposeBrowserContext", { browserContextId });
  }
  if (browserErrors.length) throw new Error(`Browser exceptions: ${browserErrors.join(", ")}`);
  await call("Browser.close");
  console.log("All four independent phone-sized role sessions passed.");
} finally {
  socket?.close();
  if (browser.exitCode === null) browser.kill();
  // Only clean our own browser profile; retain screenshots for review.
  if (dirname(resolve(directory)) !== resolve(tmpdir()) || !basename(directory).startsWith("uniserve-browser-")) throw new Error("Unsafe browser temporary directory");
  await delay(300);
  await rm(join(directory, "profile"), { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
}
