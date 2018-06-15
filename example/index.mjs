// (module
//   (type (func (param i32) (param i32) (result i32)))
//   (func $addTwo (param i32) (param i32) (result i32)
//     (get_local 0)
//     (get_local 1)
//     (i32.add)
//   )
//   (export "addTwo" (func $addTwo))
// )
import {addTwo} from "./addTwo.wasm";


// (module
//   (type (func (result i32)))
//   (import "./env.mjs" "n" (global i32))
//   (func (result i32)
//     (get_global 0)
//   )
//   (export "get" (func 0))
// )
import {get} from "./get.wasm";

console.log("addTwo", addTwo(1, 2));

console.log("get", get());
