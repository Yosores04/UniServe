import { networkInterfaces } from "node:os";
import { pathToFileURL } from "node:url";

export function printDemoUrls() {
  console.log("\nLaptop: http://localhost:5173/");
  const addresses = Object.entries(networkInterfaces()).flatMap(([name, entries]) =>
    (entries ?? []).filter((entry) => entry.family === "IPv4" && !entry.internal && !entry.address.startsWith("169.254.")).map((entry) => ({ name, address: entry.address })),
  );
  for (const { name, address } of addresses) console.log(`Phone (${name}): http://${address}:5173/`);
  if (!addresses.length) console.log("No network address found. Connect the laptop to Wi-Fi or a hotspot, then run npm run demo:urls.");
  console.log("Use the Wi-Fi/hotspot address shared with your phones. All devices must join the same network.\n");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) printDemoUrls();
