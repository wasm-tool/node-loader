# @wasm-tool/node

> WASM loader for Node

Requires the latest version of Node (Node v10).

## Installation

```sh
npm i @wasm-tool/node
```

## Usage

```sh
node --experimental-modules --loader @wasm-tool/node index.mjs
```

See [example](https://github.com/wasm-tool/node-loader/tree/master/example).

## Development

In order to test any changes you can clone this repository and run the example locally

```sh
npm install
cd example
node --experimental-modules --loader ../loader.mjs index.mjs
```
