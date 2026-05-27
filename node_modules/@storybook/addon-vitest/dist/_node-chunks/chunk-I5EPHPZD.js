import CJS_COMPAT_NODE_URL_0v3tbvcitbvq from 'node:url';
import CJS_COMPAT_NODE_PATH_0v3tbvcitbvq from 'node:path';
import CJS_COMPAT_NODE_MODULE_0v3tbvcitbvq from "node:module";

var __filename = CJS_COMPAT_NODE_URL_0v3tbvcitbvq.fileURLToPath(import.meta.url);
var __dirname = CJS_COMPAT_NODE_PATH_0v3tbvcitbvq.dirname(__filename);
var require = CJS_COMPAT_NODE_MODULE_0v3tbvcitbvq.createRequire(import.meta.url);

// ------------------------------------------------------------
// end of CJS compatibility banner, injected by Storybook's esbuild configuration
// ------------------------------------------------------------
import {
  require_picocolors
} from "./chunk-ZNKUJWWV.js";
import {
  ADDON_ID2 as ADDON_ID
} from "./chunk-6TKZ3Y4C.js";
import {
  __toESM
} from "./chunk-2HRKPUDK.js";

// src/logger.ts
var import_picocolors = __toESM(require_picocolors(), 1);
import { logger } from "storybook/internal/node-logger";
var log = (message) => {
  logger.log(
    `${import_picocolors.default.magenta(ADDON_ID)}: ${message.toString().replaceAll(/(│\n|│  )/g, "").trim()}`
  );
};

// ../../../node_modules/es-toolkit/dist/function/noop.mjs
function noop() {
}

// src/utils.ts
function errorToErrorLike(error) {
  return {
    message: error.message,
    name: error.name,
    // avoid duplicating the error message in the stack trace
    stack: error.message + " " + error.stack?.replace(error.message, ""),
    cause: error.cause && error.cause instanceof Error ? errorToErrorLike(error.cause) : void 0
  };
}

export {
  noop,
  log,
  errorToErrorLike
};
