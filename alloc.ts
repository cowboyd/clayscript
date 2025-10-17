import { pad, Struct, TypeDef, write } from "./typedef.ts";

export interface Alloc {
  <const T>(struct: Struct<T>, value: Partial<T>): number;
  <const T>(typedef: TypeDef<T>, value: T): number;
}

export function createAlloc(buffer: ArrayBufferLike, offset: number): Alloc {
  let latest = offset;
  return <T>(typedef: TypeDef<T> | Struct<T>, value: T) => {
    let address = latest;
    write(typedef as TypeDef<T> | Struct<T>, latest, buffer, value);
    latest = latest + typedef.byteLength;
    latest = latest + pad(latest, 8);
    return address;
  };
}
