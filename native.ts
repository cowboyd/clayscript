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

  createCallback(fn: () => void): Callback;

  clay: {
    MinMemorySize(): number;
    Initialize(
      size: number,
      memory: number,
      dimensions: number,
      errorHandlerId: number,
    ): void;
    BeginLayout(): void;
    EndLayout(ret: number): void;
  };
}

export interface Callback {
  id: number;
  release(): void;
}

export async function initClayNative(): Promise<ClayNative> {
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
      measureTextFunction() {
        return 0;
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
    createCallback(fn: (...args: unknown[]) => unknown): Callback {
      let id = ids++;
      callbacks.set(id, fn);
      return {
        id,
        release: () => callbacks.delete(id),
      };
    },
    clay: mod.instance.exports as ClayNative["clay"],
  };
}

const pageSize = 2 ** 16;

export function pagesOf(byteLength: number) {
  return Math.ceil(byteLength / pageSize);
}
