import {
  ClayDimensions,
  ClayErrorData,
  ClayRenderCommandArray,
} from "./data.ts";
import { initClayNative } from "./native.ts";
import { read, TypeOf, write } from "./typedef.ts";

const native = await initClayNative({
  measureTextFunction(text) {
    return {
      height: text.length > 0 ? 1 : 0,
      width: text.length,
    };
  },
});

let { clay } = native;

let errorHandler = native.createCallback(
  (data: TypeOf<typeof ClayErrorData>) => {
    let { errorText } = data;
    let bytes = native.memory.buffer.slice(errorText.chars, errorText.length);
    let text = new TextDecoder().decode(bytes);
    console.error(`${data.errorType}: ${text}`);
  },
);

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
