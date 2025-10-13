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

clay.tester(native.xbuf);

let bytes = native.memory.buffer.slice(native.xbuf, native.xbuf + 8);
console.log(bytes);

let view = new DataView(bytes);

let a = view.getUint32(0, true);

console.log({ a });
