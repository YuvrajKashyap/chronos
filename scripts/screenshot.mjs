import { mkdir, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { setMaxListeners } from "node:events";

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const baseUrl = process.env.CHRONOS_URL ?? "http://localhost:3000";
const outDir = new URL("../artifacts/screenshots/", import.meta.url);

const shots = [
  ["chronos-dark-1920x1080.png", "dark", 1920, 1080, false],
  ["chronos-light-1920x1080.png", "light", 1920, 1080, false],
  ["chronos-dark-1600x900.png", "dark", 1600, 900, false],
  ["chronos-light-1600x900.png", "light", 1600, 900, false],
  ["chronos-dark-1366x768.png", "dark", 1366, 768, false],
  ["chronos-light-1366x768.png", "light", 1366, 768, false],
  ["chronos-dark-390x844.png", "dark", 390, 844, true],
  ["chronos-light-390x844.png", "light", 390, 844, true],
  ["qa-dark-1536x864.png", "dark", 1536, 864, false],
  ["qa-light-1440x900.png", "light", 1440, 900, false],
  ["qa-dark-1280x720.png", "dark", 1280, 720, false],
  ["qa-light-393x852.png", "light", 393, 852, true],
  ["qa-dark-375x812.png", "dark", 375, 812, true],
  ["qa-light-430x932.png", "light", 430, 932, true],
];

let messageId = 0;
setMaxListeners(100);

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

async function waitForApp() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(baseUrl);
      if (response.ok) {
        return;
      }
    } catch {
      await delay(250);
    }
  }

  throw new Error(`Timed out waiting for Chronos at ${baseUrl}. Start the dev server first.`);
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
  await waitForApp();
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
