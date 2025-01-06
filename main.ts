import * as clay from "./clay.wasm";

const scratchSpaceAddress = clay.__heap_base.valueOf();
const heapSpaceAddress = clay.__heap_base.valueOf() + 1024;

const arenaAddress = scratchSpaceAddress;

const memorySize = clay.Clay_MinMemorySize();

clay.Clay_CreateArenaWithCapacityAndMemory(arenaAddress, memorySize, heapSpaceAddress);
