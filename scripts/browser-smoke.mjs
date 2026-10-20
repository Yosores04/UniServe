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
  let rejectedWriteSession = null;
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.method === "Fetch.requestPaused" && message.sessionId === rejectedWriteSession) {
      void call("Fetch.fulfillRequest", { requestId: message.params.requestId, responseCode: 400, responseHeaders: [{ name: "Content-Type", value: "application/json" }], body: Buffer.from(JSON.stringify({ message: "Preview validation: please review your product." })).toString("base64") }, message.sessionId).catch((error) => browserErrors.push(error.message));
    }
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
    ["customer", "customer@uniserve.local", "Customer123!", ["marketplace", "orders"]],
    ["seller", "entrepreneur@uniserve.local", "Shop123!", ["orders", "products", "settings"]],
    ["courier", "rider@uniserve.local", "Rider123!", ["jobs", "deliveries", "history"]],
    ["admin", "admin@uniserve.local", "Admin123!", ["overview", "orders", "approvals", "reports", "people"]],
  ];
  const visible = "element => Boolean(element.getClientRects().length)";
  for (const [role, email, password, sections] of roles) {
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
    await until(sessionId, "Boolean(document.querySelector('.workspace-navigation')) && Boolean(document.querySelector('.live-workspace'))");
    for (const section of sections) {
      await evaluate(sessionId, `document.querySelector('[data-section=${section}]').click()`);
      await until(sessionId, `document.querySelector('[data-section=${section}]').getAttribute('aria-current') === 'page'`);
      for (const width of [320, 390, 1440]) {
        await call("Emulation.setDeviceMetricsOverride", { width, height: 1000, deviceScaleFactor: 1, mobile: width < 600 }, sessionId);
        const dimensions = await evaluate(sessionId, "({width:innerWidth,scroll:document.documentElement.scrollWidth})");
        if (dimensions.scroll > dimensions.width + 1) throw new Error(`${role}/${section}: horizontal overflow ${JSON.stringify(dimensions)}`);
        const smallInput = await evaluate(sessionId, `Array.from(document.querySelectorAll('input, select, textarea, button')).filter(${visible}).find(element => element.getBoundingClientRect().height < 43.9)?.outerHTML ?? null`);
        if (smallInput) throw new Error(`${role}/${section}: cramped control ${smallInput}`);
        if (width < 600) {
          const zoomingField = await evaluate(sessionId, `Array.from(document.querySelectorAll('input,select,textarea')).filter(${visible}).find(element => parseFloat(getComputedStyle(element).fontSize) < 16)?.outerHTML ?? null`);
          if (zoomingField) throw new Error(`${role}/${section}: phone field font can cause focus zoom ${zoomingField}`);
        }
        if (width === 1440) {
          const screenshot = await call("Page.captureScreenshot", { format: "png", captureBeyondViewport: false }, sessionId);
          await writeFile(join(directory, `${role}-${section}-desktop.png`), Buffer.from(screenshot.data, "base64"));
        }
      }
      console.log(`${role}/${section}: navigation, control sizing, and 320/390/1440px layouts passed.`);
    }
    // An edit draft must survive automatic refresh and a section round trip.
    if (role === "seller") {
      await evaluate(sessionId, `document.querySelector('[data-section=settings]').click()`);
      await until(sessionId, "document.querySelector('[data-section=settings]').getAttribute('aria-current') === 'page'");
      await evaluate(sessionId, `(() => { const field=Array.from(document.querySelectorAll('label')).find(e=>e.textContent.startsWith('Shop name')).querySelector('input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(field,'Unsaved demo draft');field.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('[data-section=orders]').click(); })()`);
      await delay(2200);
      await evaluate(sessionId, "document.querySelector('[data-section=settings]').click()");
      const retained = await evaluate(sessionId, "Array.from(document.querySelectorAll('label')).find(e=>e.textContent.startsWith('Shop name')).querySelector('input').value");
      if (retained !== "Unsaved demo draft") throw new Error("Shop settings draft was lost during refresh/navigation.");
      await evaluate(sessionId, "document.querySelector('[data-section=products]').click()");
      await until(sessionId, "Boolean(document.querySelector('[data-dialog-fallback]'))");
      await evaluate(sessionId, "document.querySelector('[data-dialog-fallback]').focus();document.querySelector('[data-dialog-fallback]').click()");
      await until(sessionId, "Boolean(document.querySelector('[role=dialog]'))");
      const initialFocus = await evaluate(sessionId, "document.activeElement === document.querySelector('[role=dialog] input')");
      if (!initialFocus) throw new Error(`Product dialog did not focus its first field: ${await evaluate(sessionId, "document.activeElement.outerHTML")}`);
      await evaluate(sessionId, `(() => {const input=document.querySelector('[role=dialog] input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'Unsaved product draft');input.dispatchEvent(new Event('input',{bubbles:true}));})()`);
      await delay(2200);
      if (await evaluate(sessionId, "document.querySelector('[role=dialog] input').value") !== "Unsaved product draft") throw new Error("Product draft was lost during refresh.");
      await call("Emulation.setDeviceMetricsOverride", { width: 320, height: 700, deviceScaleFactor: 1, mobile: true }, sessionId);
      const modalFits = await evaluate(sessionId, "(() => {const r=document.querySelector('[role=dialog]').getBoundingClientRect();return r.left>=0 && r.right<=innerWidth && r.bottom<=innerHeight;})()");
      if (!modalFits) throw new Error("Product dialog does not fit a small phone.");
      await evaluate(sessionId, "Array.from(document.querySelectorAll('[role=dialog] button')).at(-1).focus()");
      await call("Input.dispatchKeyEvent", { type: "keyDown", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 }, sessionId);
      await call("Input.dispatchKeyEvent", { type: "keyUp", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 }, sessionId);
      if (!await evaluate(sessionId, "document.activeElement === document.querySelector('[aria-label=\"Close dialog\"]')")) throw new Error("Tab did not wrap within the product dialog.");
      await call("Input.dispatchKeyEvent", { type: "keyDown", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9, modifiers: 8 }, sessionId);
      await call("Input.dispatchKeyEvent", { type: "keyUp", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9, modifiers: 8 }, sessionId);
      if (!await evaluate(sessionId, "document.activeElement === Array.from(document.querySelectorAll('[role=dialog] button')).at(-1)")) throw new Error("Shift+Tab did not wrap within the product dialog.");
      rejectedWriteSession = sessionId;
      await call("Fetch.enable", { patterns: [{ urlPattern: "*/api/shop/items", requestStage: "Request" }] }, sessionId);
      await evaluate(sessionId, `(() => {const field=document.querySelector('[role=dialog] input[type=number]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(field,'75');field.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('[role=dialog] form').requestSubmit();})()`);
      await until(sessionId, "Boolean(document.querySelector('[role=dialog] [role=alert]')) && !document.querySelector('[role=dialog] fieldset').disabled");
      if (!await evaluate(sessionId, "document.querySelector('[role=dialog] input').value === 'Unsaved product draft' && document.querySelector('[role=dialog] input[type=number]').value === '75'")) throw new Error("Failed product submission lost form input.");
      await call("Fetch.disable", {}, sessionId);
      rejectedWriteSession = null;
      await call("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 }, sessionId);
      await until(sessionId, "!document.querySelector('[role=dialog]')");
      if (!await evaluate(sessionId, "document.activeElement === document.querySelector('[data-dialog-fallback]')")) throw new Error("Focus was not restored after closing the product dialog.");
      console.log("seller: drafts, failed-save recovery, focus trap, Escape, focus restoration, and mobile modal checks passed.");
    }
    await evaluate(sessionId, `document.querySelector('[data-section=${role === "seller" ? "products" : sections[0]}]').click()`);
    await call("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true }, sessionId);
    const screenshot = await call("Page.captureScreenshot", { format: "png", captureBeyondViewport: false }, sessionId);
    const path = join(directory, `${role}.png`);
    await writeFile(path, Buffer.from(screenshot.data, "base64"));
    console.log(`${role}: screenshots saved to ${directory}`);
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
