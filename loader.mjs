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

  const wasmExports = [];
  const wasmImports = [];
  const dependenciesPromise = [];

  WebAssembly.Module.imports(module).forEach((i) => {
    dependenciesPromise.push(loadDependency(i.module, i.name));
    wasmImports.push([i.module, i.name]);
  });
  WebAssembly.Module.exports(module).forEach(({ name }) => {
    wasmExports.push(name);
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
      url: new URL(specifier, base).href,
      format: 'dynamic'
    };
  }

  internalDefaultResolver = defaultResolver;

  return defaultResolver(specifier, base);
}

