import {
  ClayDimensions,
  ClayErrorData,
  ClayRenderCommand,
  ClayRenderCommandArray,
  ClayString,
  ClayTextElementConfig,
  ClayTextRenderData,
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
  let { rows, columns } = Deno.consoleSize();
  let dimensions = alloc(ClayDimensions, { width: columns, height: rows });

  clay.Initialize(
    native.minMemorySize,
    native.arena,
    dimensions,
    errorHandler.id,
  );

  clay.BeginLayout();

  let bytes = new TextEncoder().encode("Hello World!");
  let chars = alloc(raw(bytes.byteLength), bytes.buffer);
  let text = alloc(ClayString, {
    isStaticallyAllocated: false,
    chars,
    length: bytes.byteLength,
  });

  let config = alloc(ClayTextElementConfig, {
    fontSize: 16,
  });

  clay.OpenTextElement(text, config);

  let result = alloc(ClayRenderCommandArray, {
    capacity: 0,
    length: 0,
    internalArray: 0,
  });

  clay.EndLayout(result);

  let commands = read(ClayRenderCommandArray, result, native.memory.buffer);

  console.log("COMMAND COUNT: ", commands.length);

  for (let i = 0; i < commands.length; i++) {
    let command = read(
      ClayRenderCommand,
      commands.internalArray,
      native.memory.buffer,
    );

    switch (command.commandType) {
      case "RENDER_COMMAND_TYPE_TEXT": {
        let { id, boundingBox, zIndex } = command;
        let renderData = read(ClayTextRenderData, 0, command.renderData);
        console.log("TEXT", {
          id,
          boundingBox,
          zIndex,
          renderData,
        });
        break;
      }
      default: {
        console.log({ command });
      }
    }
  }
});
