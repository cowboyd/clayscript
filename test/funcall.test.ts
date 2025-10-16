import { beforeAll, describe, it } from "@std/testing/bdd";

import * as wasm from "./funcall.wasm";
import { expect } from "@std/expect";
import { read, write } from "../typedef.ts";
import { ClayDimensions } from "../data.ts";
import { createAlloc } from "../alloc.ts";

let heap_base = wasm.__heap_base.valueOf();

describe("funcall", () => {
  beforeAll(() => {
    wasm.memory.grow(1);
  });
  it("returns numbers", () => {
    expect(wasm.returnsNumbers()).toEqual(6.5);
  });
  it("returns structs", () => {
    wasm.returnsStructs(wasm.__heap_base);
    expect(read(ClayDimensions, heap_base, wasm.memory.buffer)).toEqual({
      width: 1024,
      height: 768,
    });
  });

  it("return pointers to structs", () => {
    let ptr = wasm.returnsPointersToStructs(heap_base);
    expect(read(ClayDimensions, ptr, wasm.memory.buffer)).toEqual({
      width: 1024,
      height: 768,
    });
  });
  it("accepts struct arguments", () => {
    let ptr = heap_base;
    write(ClayDimensions, ptr, wasm.memory.buffer, {
      width: 1024,
      height: 768,
    });
    expect(wasm.acceptsStructArguments(ptr, 0)).toEqual(768);
    expect(wasm.acceptsStructArguments(ptr, 1)).toEqual(1024);
  });

  it("accepts pointer arguments", () => {
    let alloc = createAlloc(wasm.memory.buffer, heap_base);
    let dimensions = alloc(ClayDimensions, { height: 6, width: 7 });

    expect(wasm.acceptsPointerArguments(dimensions, 0)).toEqual(6);
    expect(wasm.acceptsPointerArguments(dimensions, 1)).toEqual(7);
  });

  // it("invokes callbacks with structs", () => {

  // });
});
