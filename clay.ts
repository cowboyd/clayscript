import { createAlloc } from "./alloc.ts";
import {
  ClayDimensions,
  ClayElementDeclaration,
  ClayElementId,
  ClayPadding,
  ClayRenderCommand,
  ClayRenderCommandArray,
  ClaySizingAxis,
  ClaySizingAxisSize,
  ClayString,
  ClayTextElementConfig,
} from "./data.ts";
import { ClayNative } from "./native.ts";
import { Props, raw, read, TypeOf } from "./typedef.ts";

export function grow(min = 0, max = min): TypeOf<typeof ClaySizingAxis> {
  return {
    size: ClaySizingAxisSize.minMax({ min, max }),
    type: "SIZING_TYPE_GROW",
  };
}

export function paddingAll(padding: number): TypeOf<typeof ClayPadding> {
  return {
    top: padding,
    bottom: padding,
    left: padding,
    right: padding,
  };
}

export function createClay(
  native: ClayNative,
  dimensions: Props<TypeOf<typeof ClayDimensions>> = {},
) {
  let alloc = createAlloc(native.memory.buffer, native.xbuf);

  let dimensionsPtr = alloc(ClayDimensions, dimensions);

  native.clay.Initialize(
    native.minMemorySize,
    native.arena,
    dimensionsPtr,
  );

  return {
    beginLayout() {
      alloc = createAlloc(native.memory.buffer, native.xbuf);
      native.clay.BeginLayout();
    },
    endLayout(): Iterable<TypeOf<typeof ClayRenderCommand>> {
      let returnAddr = alloc(ClayRenderCommandArray, {});

      native.clay.EndLayout(returnAddr);

      let array = read(
        ClayRenderCommandArray,
        returnAddr,
        native.memory.buffer,
      );

      return {
        *[Symbol.iterator]() {
          for (let i = 0; i < array.length; i++) {
            yield read(
              ClayRenderCommand,
              array.internalArray + (i * ClayRenderCommand.byteLength),
              native.memory.buffer,
            );
          }
        },
      };
    },
    openElement(
      id: string,
      decl: Props<TypeOf<typeof ClayElementDeclaration>>,
    ) {
      let idBytes = new TextEncoder().encode(id);
      let chars = alloc(raw(idBytes.byteLength), idBytes.buffer);
      let idString = alloc(ClayString, {
        isStaticallyAllocated: false,
        chars,
        length: idBytes.byteLength,
      });

      let idAddress = alloc(ClayElementId, {});

      native.clay.HashString(idAddress, idString, 0);
      native.clay.OpenElementWithId(idAddress);

      let declAddr = alloc(ClayElementDeclaration, decl);
      native.clay.ConfigureOpenElement(declAddr);
    },
    closeElement() {
      native.clay.CloseElement();
    },
    text(
      content: string,
      config: Partial<TypeOf<typeof ClayTextElementConfig>>,
    ): void {
      let bytes = new TextEncoder().encode(content);
      let chars = alloc(raw(bytes.byteLength), bytes.buffer);
      let text = alloc(ClayString, {
        isStaticallyAllocated: false,
        chars,
        length: bytes.byteLength,
      });

      let address = alloc(ClayTextElementConfig, config);

      native.clay.OpenTextElement(text, address);
    },
  };
}
