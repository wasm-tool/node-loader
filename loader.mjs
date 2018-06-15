import fs from "fs"
import path from "path"

import parser from "@webassemblyjs/wasm-parser";
import t from "@webassemblyjs/ast";

let internalDefaultResolver;

const decoderOpts = {
  ignoreCodeSection: true,
  ignoreDataSection: true,
  ignoreCustomNameSection: true
};

async function loadDependency(module, name) {
  const fqmodule = internalDefaultResolver(module).url;
  const dep = await import(fqmodule);

  return dep[name];
}

function readFile(path) {
  return fs.readFileSync(path, null);
}

export async function dynamicInstantiate(url) {
  const buffer = readFile(url);
  const module = new WebAssembly.Module(buffer);

  const wasmExports = [];
  const wasmImports = [];
  const dependenciesPromise = [];

  /**
   * wasm introspection
   */
  const ast = parser.decode(buffer, decoderOpts);

  t.traverse(ast, {
    ModuleExport({ node }) {
      wasmExports.push(node.name);
    },

    ModuleImport({ node }) {
      dependenciesPromise.push(
        loadDependency(node.module, node.name)
      );

      wasmImports.push([node.module, node.name]);
    }
  });

  /**
   * generate importObject
   */
  const importObject = {};

  const dependencies = await Promise.all(dependenciesPromise);

  wasmImports.forEach(([module, name], i) => {
    if (typeof importObject[module] === "undefined") {
      importObject[module] = {};
    }

    importObject[module][name] = dependencies[i];
  });

  /**
   * instantiation
   */
  const wasmInstance = new WebAssembly.Instance(module, importObject);

  return {
    exports: wasmExports,
    execute: exports => {

      wasmExports.forEach(name => {
        exports[name].set(wasmInstance.exports[name]);
      });
    }
  };
}

export function resolve(specifier, base, defaultResolver) {
  const ext = path.extname(specifier);

  if (ext === ".wasm") {
    return {
      url: specifier,
      format: 'dynamic'
    };
  }

  internalDefaultResolver = defaultResolver;

  return defaultResolver(specifier, base);
}

