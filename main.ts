import { ClayDimensions } from "./data.ts";
import { write } from "./struct.ts";

const initialSize = 10;

const memory = new WebAssembly.Memory({
  initial: initialSize,
});

const pageSize = 2 ** 16;

export function pagesOf(byteLength: number) {
  return Math.ceil(byteLength / pageSize);
}

export function pageByteOffset(pageOffset: number) {
  return pageOffset * pageSize;
}

console.log(pagesOf(memory.buffer.byteLength));

const callbacks = new Map<number, (...args: unknown[]) => unknown>();

interface Callback {
  id: number;
  release(): void;
}

let ids = 0;
function createCallback(fn: (...args: unknown[]) => unknown): Callback {
  let id = ids++;
  callbacks.set(id, fn);
  return {
    id,
    release: () => callbacks.delete(id),
  };
}

function invokeCallback(id: number, arg: number) {
  console.log("callback", { id, arg });
}

const location = new URL("./clay.wasm", import.meta.url);
const bytes = await Deno.readFile(location.pathname);

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

const { instance } = mod;
const { exports } = instance;

//console.log(instance.exports);

let min = instance.exports.Clay_MinMemorySize();
//memory.grow(10)

let {
  __stack_low,
  __stack_high,
  __data_end,
  __heap_base,
  __heap_end,
  __global_base,
  __memory_base,
  __table_base,
} = instance.exports;

const values = (obj: Record<string, object | number>) =>
  Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [key, value.valueOf()]),
  );

const heapByteLength = memory.buffer.byteLength - __heap_base.valueOf();

const byteDelta = heapByteLength - min;

const pageDelta = pagesOf(byteDelta);

const growBy = pageDelta > 0 ? 0 : Math.abs(pageDelta) + 1;
const xbuf = __heap_base.valueOf();
const arena = __heap_base.valueOf() + pageSize;

console.log(values({
  __stack_low,
  __stack_high,
  __data_end,
  __heap_base,
  __heap_end,
  __global_base,
  __memory_base,
  __table_base,
  heapByteLength,
  min,
  byteDelta,
  pageDelta,
  growBy,
  required: pagesOf(min),
  available: pagesOf(heapByteLength),
  xbuf,
  arena,
}));

memory.grow(growBy);

let errorHandler = createCallback((..._args) => {
  console.error("CLAY ERRROR");
});

write(ClayDimensions, xbuf, memory.buffer, {
  width: 100,
  height: 50,
});

instance.exports.clayjs_Initialize(min, arena, xbuf, errorHandler.id);

exports.clayjs_BeginLayout();

exports.clayjs_EndLayout();
