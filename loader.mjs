import fs from "fs"
import path from "path"

let internalDefaultResolver;

async function loadDependency(module, name) {
  const fqmodule = internalDefaultResolver(module).url;
  const dep = await import(fqmodule);

  return dep[name];
}

function readFile(path) {
  return fs.readFileSync(path, null);
}

export async function dynamicInstantiate(url) {
  const buffer = readFile(new URL(url));
  const module = new WebAssembly.Module(buffer);

  /**
   * generate importObject
   */
  const importObject = {};

  await Promise.all(WebAssembly.Module.imports(module).map(async ({ module, name }) => {
    if (typeof importObject[module] === "undefined") {
      importObject[module] = {};
    }

    importObject[module][name] = await loadDependency(module, name);
  }));

  /**
   * instantiation
   */
  const wasmInstance = new WebAssembly.Instance(module, importObject);

  const wasmExports = WebAssembly.Module.exports(module).map(({ name }) => name);

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
      url: new URL(specifier, base).href,
      format: 'dynamic'
    };
  }

  internalDefaultResolver = defaultResolver;

  return defaultResolver(specifier, base);
}

