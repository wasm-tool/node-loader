import fs from "fs"
import path from "path"

function readFile(path) {
  return fs.readFileSync(path, null);
}

export async function dynamicInstantiate(url) {
  const buffer = readFile(url);
  const module = new WebAssembly.Module(buffer);

  const wasmExports = WebAssembly.Module.exports(module);
  const wasmInstance = new WebAssembly.Instance(module);

  return {
    exports: wasmExports.map(({name}) => name),
    execute: exports => {

      wasmExports.forEach(({name}) => {
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

  return defaultResolver(specifier, base);
}

