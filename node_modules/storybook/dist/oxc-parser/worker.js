import CJS_COMPAT_NODE_URL_ret6ivvuly from 'node:url';
import CJS_COMPAT_NODE_PATH_ret6ivvuly from 'node:path';
import CJS_COMPAT_NODE_MODULE_ret6ivvuly from "node:module";

var __filename = CJS_COMPAT_NODE_URL_ret6ivvuly.fileURLToPath(import.meta.url);
var __dirname = CJS_COMPAT_NODE_PATH_ret6ivvuly.dirname(__filename);
var require = CJS_COMPAT_NODE_MODULE_ret6ivvuly.createRequire(import.meta.url);

// ------------------------------------------------------------
// end of CJS compatibility banner, injected by Storybook's esbuild configuration
// ------------------------------------------------------------
import {
  oxcParse
} from "../_node-chunks/chunk-FFFNDE22.js";
import "../_node-chunks/chunk-3LVSS6GN.js";
import "../_node-chunks/chunk-XSYEGQMM.js";
import "../_node-chunks/chunk-BV5YQP4B.js";
import "../_node-chunks/chunk-5IHDTMLC.js";

// src/oxc-parser/worker.ts
import { parentPort } from "node:worker_threads";
if (!parentPort)
  throw new Error("oxc-parser worker must be run as a worker thread");
var port = parentPort;
port.on("message", async (msg) => {
  try {
    let edges = await oxcParse(msg.filePath, msg.source), response = { id: msg.id, ok: !0, edges };
    port.postMessage(response);
  } catch (error) {
    let err = error, response = {
      id: msg.id,
      ok: !1,
      message: err?.message ?? String(error),
      name: err?.name ?? "Error"
    };
    port.postMessage(response);
  }
});
