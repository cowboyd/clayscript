import { TypeDef, write } from "./typedef.ts";

export interface Alloc {
  <T>(typedef: TypeDef<T>, value: T): number;
}

export function createAlloc(buffer: ArrayBufferLike, offset: number): Alloc {
  let current = offset;
  return (typedef, value) => {
    let address = current;
    write(typedef, current, buffer, value);
    current = current + typedef.byteLength;
    return address;
  };
}
