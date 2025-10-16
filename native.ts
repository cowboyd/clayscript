import { Alloc, createAlloc } from "./alloc.ts";
import {
  ClayDimensions,
  ClayStringSlice,
  ClayTextElementConfig,
} from "./data.ts";
import { deref, ptr, read, TypeOf, uint32, write } from "./typedef.ts";

export interface ClayNative {
  /**
   * Linear memory of the clay.c WASM module
   */
  memory: WebAssembly.Memory;

  /**
   * Address of the transfer buffer
   */
  xbuf: number;
  /**
   * Memory address of the Clay arena
   */
  arena: number;

  /**
   * minimum memory size needed by Clay. Passed into `clay.Initialize`
   */
  minMemorySize: number;

  createCallback<TArgs extends unknown[]>(
    fn: (...args: TArgs) => void,
  ): Callback;

  xfer: <T>(fn: (alloc: Alloc) => T) => T;

  clay: {
    MinMemorySize(): number;
    Initialize(
      size: number,
      memory: number,
      dimensions: number,
      errorHandlerId: number,
    ): void;
    BeginLayout(): void;
    EndLayout(return_ptr: number): void;
    StoreTextElementConfig(config: number): number;
    OpenTextElement(text: number, config: number): void;
  };
}

export interface Callback {
  id: number;
  release(): void;
}

export interface InitClayNativeOptions {
  measureTextFunction(
    text: TypeOf<typeof ClayStringSlice>,
    config: TypeOf<typeof ClayTextElementConfig>,
    userdata: ArrayBufferLike,
  ): TypeOf<typeof ClayDimensions>;
}

export async function initClayNative(
  options: InitClayNativeOptions,
): Promise<ClayNative> {
  let memory = new WebAssembly.Memory({
    initial: 50,
  });
  const location = new URL("./clay.wasm", import.meta.url);
  const bytes = await Deno.readFile(location.pathname);

  let ids = 0;
  const callbacks = new Map<number, () => void>();

  function invokeCallback(id: number, arg: number) {
    console.log("callback", { id, arg });
  }

  const mod = await WebAssembly.instantiate(bytes, {
    clay: {
      measureTextFunction(
        textAdress: number,
        configPointerAddress: number,
        userDataAdress: number,
      ) {
        let text = read(ClayStringSlice, textAdress, memory.buffer);
        let configPointer = read(uint32(), configPointerAddress, memory.buffer);
        let config = deref(
          ptr(ClayTextElementConfig),
          configPointer,
          memory.buffer,
        );
        let userData = memory.buffer.slice(userDataAdress);
        let dimensions = options.measureTextFunction(text, config, userData);
        write(ClayDimensions, xbuf, memory.buffer, dimensions);
        return xbuf;
      },
      queryScrollOffsetFunction() {
        return 0;
      },
    },
    env: { memory, invokeCallback },
  });

  let clay = mod.instance.exports as ClayNative["clay"];

  let __heap_base = mod.instance.exports.__heap_base.valueOf();

  // total size of the current heap.
  let heapByteLength = memory.buffer.byteLength - __heap_base;

  let minMemorySize = clay.MinMemorySize();

  // bytes required to satisfy clay arena size
  let byteDelta = heapByteLength - minMemorySize;

  // pages required to satisfy clay arena size
  let pageDelta = pagesOf(byteDelta);

  // grow the memory to make sure we have enough for the min clay arean size
  // plus an extra page for the transfer buffer.
  let growBy = pageDelta > 0 ? 0 : Math.abs(pageDelta) + 1;
  memory.grow(growBy);

  // the transfer buffer starts at the bottom of the heap
  let xbuf = __heap_base;

  let arena = xbuf + pageSize;

  return {
    memory,
    xbuf,
    arena,
    minMemorySize,
    createCallback<TArgs extends unknown[]>(
      fn: (...args: TArgs) => unknown,
    ): Callback {
      let id = ids++;
      callbacks.set(id, fn);
      return {
        id,
        release: () => callbacks.delete(id),
      };
    },
    xfer: (fn) => fn(createAlloc(memory.buffer, xbuf)),
    clay: mod.instance.exports as ClayNative["clay"],
  };
}

const pageSize = 2 ** 16;

export function pagesOf(byteLength: number) {
  return Math.ceil(byteLength / pageSize);
}
