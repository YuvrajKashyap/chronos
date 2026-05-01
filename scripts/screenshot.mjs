import { mkdir, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { setMaxListeners } from "node:events";

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const baseUrl = process.env.CHRONOS_URL ?? "http://localhost:3000";
const outDir = new URL("../artifacts/screenshots/", import.meta.url);

const shots = [
  ["chronos-dark-desktop.png", "dark", 1440, 1080, false],
  ["chronos-light-desktop.png", "light", 1440, 1080, false],
  ["chronos-dark-mobile.png", "dark", 390, 844, true],
  ["chronos-light-mobile.png", "light", 390, 844, true],
  ["qa-1365-dark.png", "dark", 1365, 1080, false],
  ["qa-1024-light.png", "light", 1024, 900, false],
];

let messageId = 0;
setMaxListeners(40);

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function requestJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed ${response.status}: ${url}`);
  }
  return response.json();
}

async function waitForEndpoint(port) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      return await requestJson(`http://127.0.0.1:${port}/json/version`);
    } catch {
      await delay(250);
    }
  }

  throw new Error("Timed out waiting for Chrome DevTools endpoint.");
}

function send(socket, method, params = {}) {
  const id = ++messageId;
  socket.send(JSON.stringify({ id, method, params }));
  return id;
}

function waitForMessage(socket, predicate) {
  return new Promise((resolve, reject) => {
    const onMessage = (event) => {
      const message = JSON.parse(event.data.toString());
      if (predicate(message)) {
        socket.removeEventListener("message", onMessage);
        resolve(message);
      }
    };

    socket.addEventListener("message", onMessage);
    socket.addEventListener("error", reject, { once: true });
  });
}

async function command(socket, method, params = {}) {
  const id = send(socket, method, params);
  const message = await waitForMessage(socket, (candidate) => candidate.id === id);
  if (message.error) {
    throw new Error(`${method} failed: ${message.error.message}`);
  }
  return message.result;
}

async function capture(socket, [filename, theme, width, height, mobile]) {
  await command(socket, "Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 1,
    mobile,
  });
  await command(socket, "Page.navigate", { url: `${baseUrl}/?theme=${theme}` });
  await waitForMessage(socket, (message) => message.method === "Page.loadEventFired");
  await delay(450);
  const result = await command(socket, "Page.captureScreenshot", {
    format: "png",
    fromSurface: true,
    captureBeyondViewport: false,
  });
  await writeFile(new URL(filename, outDir), Buffer.from(result.data, "base64"));
}

async function main() {
  await mkdir(outDir, { recursive: true });
  const port = 9222 + Math.floor(Math.random() * 1000);
  const chrome = spawn(chromePath, [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    "--no-first-run",
    "--no-default-browser-check",
    `--remote-debugging-port=${port}`,
    "about:blank",
  ], { stdio: "ignore" });

  try {
    await waitForEndpoint(port);
    const pages = await requestJson(`http://127.0.0.1:${port}/json/list`);
    const page = pages.find((candidate) => candidate.type === "page");
    if (!page) {
      throw new Error("Chrome did not expose a page target.");
    }
    const socket = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      socket.addEventListener("open", resolve, { once: true });
      socket.addEventListener("error", reject, { once: true });
    });

    await command(socket, "Page.enable");
    for (const shot of shots) {
      await capture(socket, shot);
    }
    socket.close();
  } finally {
    chrome.kill();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
