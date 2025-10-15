import { describe, it } from "@std/testing/bdd";
import {
  deref,
  enumOf,
  f32,
  i32,
  ptr,
  raw,
  read,
  struct,
  uint8,
  union,
  write,
} from "../typedef.ts";
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

  it("has pointers that can reference layouts at other places in memory", () => {
    let buffer = new ArrayBuffer(100);

    const Point = struct({ x: f32(), y: f32() });

    const Point_ptr = ptr(Point);

    write(Point, 50, buffer, { x: 6, y: 7 });

    write(Point_ptr, 0, buffer, 50);

    expect(deref(Point_ptr, 0, buffer)).toEqual({ x: 6, y: 7 });
  });

  it("can handle enums", () => {
    let buffer = new ArrayBuffer(100);
    let view = new DataView(buffer);

    let Letters = enumOf("X", "Y", "Z");
    let Holder = struct({
      a: Letters,
      b: Letters,
    });
    write(Holder, 0, buffer, {
      a: "Z",
      b: "Y",
    });

    expect(view.getUint8(0)).toEqual(2);
    expect(view.getUint8(1)).toEqual(1);

    expect(read(Holder, 0, buffer)).toEqual({
      a: "Z",
      b: "Y",
    });
  });

  it("can read and write raw values", () => {
    let buffer = new ArrayBuffer(100);
    let view = new DataView(buffer);

    let Point = struct({ x: f32(), y: f32() });

    let TenBytes = raw(10);

    let Type = struct({
      before: uint8(),
      raw: TenBytes,
      after: uint8(),
    });

    let point = TenBytes.alloc(Point, { x: 6.0, y: 7 });
    expect(point.byteLength).toEqual(10);

    write(Type, 0, buffer, {
      before: 123,
      raw: point,
      after: 255,
    });

    expect(view.getUint8(0)).toEqual(123);
    expect(read(Point, 1, buffer)).toEqual({ x: 6, y: 7 });

    let readback = read(Type, 0, buffer);
    expect(read(Point, 0, readback.raw)).toEqual({ x: 6, y: 7 });

    expect(view.getUint8(11)).toEqual(255);
  });

  it("has union types which can write raw segments of memory", () => {
    let buffer = new ArrayBuffer(100);
    //    let view = new DataView(buffer);
    let Point = struct({ x: f32(), y: f32() });

    let Union = union({
      point: Point,
      percent: f32(),
    });

    let Type = struct({
      location: Union,
      type: enumOf("POINT", "LOCATION"),
    });

    write(Type, 0, buffer, {
      location: Union.point({ x: 6, y: 7 }),
      type: "POINT",
    });

    let readback = read(Type, 0, buffer);
    expect(readback.type).toEqual("POINT");
    expect(read(Point, 0, readback.location)).toEqual({ x: 6, y: 7 });
  });
});

function view(buffer: ArrayBuffer): DataView {
  return new DataView(buffer);
}
