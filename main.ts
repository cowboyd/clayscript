import {
  ClayDimensions,
  ClayErrorData,
  ClayRenderCommand,
  ClayRenderCommandArray,
  ClayString,
  ClayTextElementConfig,
} from "./data.ts";
import { initClayNative } from "./native.ts";
import { raw, read, TypeOf } from "./typedef.ts";

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

native.xfer((alloc) => {
  let dimensions = alloc(ClayDimensions, { width: 120, height: 60 });

  clay.Initialize(
    native.minMemorySize,
    native.arena,
    dimensions,
    errorHandler.id,
  );

  clay.BeginLayout();

  let bytes = new TextEncoder().encode("Hello World");
  let chars = alloc(raw(bytes.byteLength), bytes.buffer);
  let text = alloc(ClayString, {
    isStaticallyAllocated: false,
    chars,
    length: bytes.byteLength,
  });

  let config = alloc(ClayTextElementConfig, {
    fontId: 0,
    fontSize: 16,
    letterSpacing: 1,
    lineHeight: 1,
    textAlignment: "TEXT_ALIGN_LEFT",
    userData: 0,
    wrapMode: "TEXT_WRAP_WORDS",
    textColor: { r: 255, g: 255, b: 255, a: 1 },
  });

  clay.OpenTextElement(text, config);

  let result = alloc(ClayRenderCommandArray, {
    capacity: 0,
    length: 0,
    internalArray: 0,
  });

  clay.EndLayout(result);

  let commands = read(ClayRenderCommandArray, result, native.memory.buffer);

  console.log(commands);

  for (let i = 0; i < commands.length; i++) {
    let command = read(
      ClayRenderCommand,
      commands.internalArray,
      native.memory.buffer,
    );
    console.log({ command });
  }
});
