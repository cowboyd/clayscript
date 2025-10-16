import { pad, TypeDef, write } from "./typedef.ts";

export interface Alloc {
  <T>(typedef: TypeDef<T>, value: T): number;
}

export function createAlloc(buffer: ArrayBufferLike, offset: number): Alloc {
  let latest = offset;
  return (typedef, value) => {
    let address = latest;
    write(typedef, latest, buffer, value);
    latest = latest + typedef.byteLength;
    latest = latest + pad(latest, 8);
    return address;
  };
}
