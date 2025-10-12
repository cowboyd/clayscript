import { describe, it } from "@std/testing/bdd";
import {
  deref,
  f32,
  i32,
  optional,
  ptr,
  read,
  struct,
  write,
} from "../struct.ts";
import { expect } from "@std/expect";

describe("linear data", () => {
  it("can write simple data", () => {
    let buffer = new ArrayBuffer(100);
    write(f32(), 0, buffer, 6.5);
    expect(view(buffer).getFloat32(0, true)).toEqual(6.5);

    write(i32(), 5, buffer, 670);

    expect(view(buffer).getInt32(5, true)).toEqual(670);
  });

  it("can read and write structs made out of simple data", () => {
    let Point = struct({
      x: f32(),
      y: f32(),
    });

    let buffer = new ArrayBuffer(50);

    write(Point, 5, buffer, { x: 4.5, y: 1.25 });

    expect(read(Point, 5, buffer)).toEqual({ x: 4.5, y: 1.25 });
  });

  it("reads and writes structs of structs", () => {
    let buffer = new ArrayBuffer(50);

    let Point = struct({
      x: f32(),
      y: f32(),
    });

    let Line = struct({
      a: Point,
      b: Point,
    });

    write(Line, 0, buffer, {
      a: { x: 1, y: 2 },
      b: { x: 6, y: 7 },
    });

    expect(read(Line, 0, buffer)).toEqual({
      a: { x: 1, y: 2 },
      b: { x: 6, y: 7 },
    });
  });

  it("zeros out optional fields", () => {
    let buffer = new ArrayBuffer(20);
    let Point = struct({
      x: f32(),
      y: f32(),
    });

    let Line = struct({
      a: optional(Point),
      b: optional(Point),
    });

    write(Line, 0, buffer, {
      a: { x: 1, y: 2 },
      b: { x: 6, y: 7 },
    });

    write(Line, 0, buffer, {
      a: undefined,
      b: { x: 3, y: 4 },
    });

    expect(read(Line, 0, buffer)).toEqual({
      a: { x: 0, y: 0 },
      b: { x: 3, y: 4 },
    });
  });

  it("has pointers that can reference layouts at other places in memory", () => {
    let buffer = new ArrayBuffer(100);

    const Point = struct({ x: f32(), y: f32() });

    const Point_ptr = ptr(Point);

    write(Point, 50, buffer, { x: 6, y: 7 });

    write(Point_ptr, 0, buffer, 50);

    expect(deref(Point_ptr, 0, buffer)).toEqual({ x: 6, y: 7 });
  });

  it.skip("can handle enums", () => {
  });
});

function view(buffer: ArrayBuffer): DataView {
  return new DataView(buffer);
}
