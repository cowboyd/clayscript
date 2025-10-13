import { ClayDimensions, ClayRenderCommandArray } from "./data.ts";
import { initClayNative } from "./native.ts";
import { read, write } from "./typedef.ts";

const native = await initClayNative();

let { clay } = native;

let errorHandler = native.createCallback(() => {
  console.error("CLAY ERRROR");
});

write(ClayDimensions, native.xbuf, native.memory.buffer, {
  width: 120,
  height: 60,
});

clay.Initialize(
  native.minMemorySize,
  native.arena,
  native.xbuf,
  errorHandler.id,
);

clay.BeginLayout();

clay.EndLayout(native.xbuf);

let commands = read(ClayRenderCommandArray, native.xbuf, native.memory.buffer);

console.log({ commands });

// clay.tester(native.xbuf);

// let bytes = new DataView(native.memory.buffer);

// let a = bytes.getUint8(native.xbuf);
// let b = bytes.getUint8(native.xbuf + 1);

// console.log({ a, b });
