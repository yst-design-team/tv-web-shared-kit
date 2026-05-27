import CJS_COMPAT_NODE_URL_nrduh48mq7g from 'node:url';
import CJS_COMPAT_NODE_PATH_nrduh48mq7g from 'node:path';
import CJS_COMPAT_NODE_MODULE_nrduh48mq7g from "node:module";

var __filename = CJS_COMPAT_NODE_URL_nrduh48mq7g.fileURLToPath(import.meta.url);
var __dirname = CJS_COMPAT_NODE_PATH_nrduh48mq7g.dirname(__filename);
var require = CJS_COMPAT_NODE_MODULE_nrduh48mq7g.createRequire(import.meta.url);

// ------------------------------------------------------------
// end of CJS compatibility banner, injected by Storybook's esbuild configuration
// ------------------------------------------------------------
import {
  compile
} from "./_node-chunks/chunk-2IOS7C4O.js";
import "./_node-chunks/chunk-7PPKGCT5.js";
import "./_node-chunks/chunk-O5R2T3HQ.js";
import "./_node-chunks/chunk-EZMDZOIB.js";

// src/mdx-loader.ts
var DEFAULT_RENDERER = `
import React from 'react';
`;
async function loader(content) {
  let callback = this.async(), options = { ...this.getOptions(), filepath: this.resourcePath };
  try {
    let result = await compile(content, options), code = `${DEFAULT_RENDERER}
${result}`;
    return callback(null, code);
  } catch (err) {
    return console.error("Error loading:", this.resourcePath), callback(err);
  }
}
var mdx_loader_default = loader;
export {
  mdx_loader_default as default
};
