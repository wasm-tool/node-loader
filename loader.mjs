import fs from "fs"
import path from "path"

async function loadDependency(base, specifier, name) {
  const dep = await import(new URL(specifier, base));
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

  await Promise.all(WebAssembly.Module.imports(module).map(async ({ module: importURL, name }) => {
    if (typeof importObject[importURL] === "undefined") {
      importObject[importURL] = {};
    }

    importObject[importURL][name] = await loadDependency(url, importURL, name);
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

const baseURL = new URL('file://');
baseURL.pathname = `${process.cwd()}/`;

export function resolve(specifier, base, defaultResolver) {
  const ext = path.extname(specifier);

  if (ext === ".wasm") {
    return {
      url: new URL(specifier, base || baseURL).href,
      format: 'dynamic'
    };
  }

  return defaultResolver(specifier, base);
}
