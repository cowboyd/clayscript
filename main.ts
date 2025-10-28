import { createClay, paddingAll } from "./clay.ts";
import { ClayRectangleRenderData, ClayTextRenderData } from "./data.ts";
import { initClayNative } from "./native.ts";
import { read } from "./typedef.ts";

const native = await initClayNative({
  measureTextFunction(text) {
    return {
      height: text.length > 0 ? 1 : 0,
      width: text.length,
    };
  },
  handleErrorFunction(data) {
    let { errorText } = data;
    let bytes = native.memory.buffer.slice(
      errorText.chars,
      errorText.chars + errorText.length,
    );
    let text = new TextDecoder().decode(bytes);
    console.error(`${data.errorType}: ${text}`);
  },
});

let { rows: height, columns: width } = Deno.consoleSize();

let clay = createClay(native, { height, width });

clay.beginLayout();

clay.openElement("parent", { layout: { padding: paddingAll(8) } });

clay.text("Hello World", { fontSize: 16 });

clay.openElement("child", { backgroundColor: { r: 255, g: 0, b: 0, a: 1 } });

clay.text("Goodbye World", { fontSize: 16 });

clay.closeElement();

clay.closeElement();

let commands = clay.endLayout();

for (let command of commands) {
  switch (command.commandType) {
    case "RENDER_COMMAND_TYPE_TEXT": {
      let { id, boundingBox, zIndex } = command;
      let renderData = read(ClayTextRenderData, 0, command.renderData);
      console.log(command.commandType, {
        id,
        boundingBox,
        zIndex,
        renderData,
      });
      break;
    }
    case "RENDER_COMMAND_TYPE_RECTANGLE": {
      let { id, boundingBox, zIndex } = command;
      let renderData = read(ClayRectangleRenderData, 0, command.renderData);
      console.log(command.commandType, {
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
