import { ClayDimensions, ClayRenderCommandArray } from "./data.ts";
import { initClayNative } from "./native.ts";
import { read, write } from "./struct.ts";

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
