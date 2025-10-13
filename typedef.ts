// deno-lint-ignore-file no-explicit-any
export type Attrs<T> = {
  [K in keyof T]: TypeDef<T[K]>;
};

export type Struct<T> = {
  type: "struct";
  byteLength: number;
  attrs: Attrs<T>;
  entries: [keyof T, TypeDef<T[keyof T]>][];
};

export type Num<T> = {
  type: "i32" | "f32" | "f64" | "uint8" | "uint16" | "uint32" | "int16";
  byteLength: number;
  T?: T;
};

export type Bool<T> = {
  type: "bool";
  byteLength: 1;
  T?: T;
};

export type Raw<T> = {
  type: "raw";
  byteLength: number;
  T?: T;
  alloc<A>(typedef: TypeDef<A>, value: A): ArrayBuffer;
};

export type Optional<T> = {
  type: "optional";
  numeric: boolean;
  byteLength: number;
  typedef: TypeDef<T>;
};

export type Ptr<T> = TypeDef<number> & {
  type: "i32";
  byteLength: 4;
  typedef: TypeDef<T>;
};

export type Enum<T> = {
  type: "enum";
  byteLength: 1;
  constants: T extends string ? T[] : never;
};

export type TypeDef<T> =
  | Num<T>
  | Bool<T>
  | Struct<T>
  | Optional<T>
  | Enum<T>
  | Raw<T>;

export type TypeOf<Def extends TypeDef<unknown>> = Def extends TypeDef<infer T>
  ? T
  : never;

export const i32 = (): TypeDef<number> => ({ type: "i32", byteLength: 4 });
export const f32 = (): TypeDef<number> => ({ type: "f32", byteLength: 4 });
export const f64 = (): TypeDef<number> => ({ type: "f64", byteLength: 8 });
export const uint8 = (): TypeDef<number> => ({ type: "uint8", byteLength: 1 });
export const uint16 = (): TypeDef<number> => ({
  type: "uint16",
  byteLength: 2,
});
export const uint32 = (): TypeDef<number> => ({
  type: "uint32",
  byteLength: 4,
});
export const int16 = (): TypeDef<number> => ({ type: "int16", byteLength: 2 });

export function bool(): Bool<boolean> {
  return {
    type: "bool",
    byteLength: 1,
  };
}

export const float = f32;

export const char = uint8;

export const ptr = <T>(target: TypeDef<T> = char() as TypeDef<T>) =>
  ({
    type: "i32",
    byteLength: 4,
    typedef: target,
  }) as Ptr<T>;

export function enumOf<T extends string>(...constants: T[]): Enum<T> {
  return {
    type: "enum",
    byteLength: 1,
    constants,
  } as Enum<T>;
}

export function raw(byteLength: number): Raw<ArrayBuffer> {
  return {
    type: "raw",
    byteLength,
    alloc<T>(typedef: TypeDef<T>, value: T): ArrayBuffer {
      let buffer = new ArrayBuffer(byteLength);
      write(typedef, 0, buffer, value);
      return buffer;
    },
  };
}

export function struct<T extends object>(
  attrs: Attrs<T>,
): Struct<T> {
  let entries = Object.entries(attrs) as [
    keyof Attrs<T>,
    Attrs<T>[keyof Attrs<T>],
  ][];
  let byteLength = entries.map(([, typedef]) => typedef).reduce(
    (sum, def) => sum + def.byteLength,
    0,
  );

  return {
    type: "struct",
    attrs,
    entries,
    byteLength,
  };
}

export function optional<T>(typedef: TypeDef<T>): TypeDef<T | void> {
  return {
    type: "optional",
    typedef,
    numeric: typedef.type === "optional"
      ? typedef.numeric
      : ["i32", "f32", "i64", "f64"].includes(typedef.type),
    byteLength: typedef.byteLength,
  } as TypeDef<T | void>;
}

export type Union<A extends Attrs<any>> =
  & Raw<ArrayBuffer>
  & {
    [K in keyof A]: (value: TypeOf<A[K]>) => ArrayBuffer;
  };

export function union<T>(attrs: Attrs<T>): Union<Attrs<T>> {
  let entries = Object.entries(attrs) as [keyof T, Attrs<T>[keyof T]][];

  let byteLength = Math.max(
    ...entries.map(([, typedef]) => typedef.byteLength),
  );

  let opaque = raw(byteLength);

  let constructors = Object.fromEntries(
    entries.map((
      [key, typedef],
    ) => [key, (value: any) => opaque.alloc(typedef, value)]),
  );

  return Object.assign(raw(byteLength), constructors) as Union<Attrs<T>>;
}

export function read<T>(
  typedef: TypeDef<T>,
  offset: number,
  buffer: ArrayBufferLike,
): T {
  let view = new DataView(buffer, offset);
  switch (typedef.type) {
    case "struct":
      return typedef.entries.reduce((acc, [key, typedef]) => {
        return {
          struct: Object.assign(acc.struct, {
            [key]: read(typedef, acc.offset, buffer),
          }),
          offset: acc.offset + typedef.byteLength,
        };
      }, { struct: {}, offset }).struct as T;
    case "enum": {
      let index = view.getUint8(0);
      let { constants } = typedef;
      let constant = typedef.constants[index];
      if (constant == null) {
        throw new TypeError(
          `expected enum to be one of ${
            constants.join(",")
          }, but was index: ${index}`,
        );
      }
      return constant;
    }
    case "bool": {
      let value = view.getUint8(0);
      return (value !== 0 as unknown) as T;
    }
    case "raw":
      return buffer.slice(offset, typedef.byteLength) as T;
    case "optional":
      return read(typedef.typedef, offset, buffer);
    case "uint8":
      return view.getUint8(0) as T;
    case "uint16":
      return view.getUint16(0, true) as T;
    case "uint32":
      return view.getUint32(0, true) as T;
    case "int16":
      return view.getInt16(0, true) as T;
    case "i32":
      return view.getInt32(0, true) as T;
    case "f32":
      return view.getFloat32(0, true) as T;
    case "f64":
      return view.getFloat64(0, true) as T;
  }
}

export function write<T>(
  typedef: TypeDef<T>,
  offset: number,
  buffer: ArrayBufferLike,
  value: TypeDef<T>["type"] extends "struct" ? Partial<T> : T,
): void {
  let view = new DataView(buffer, offset);
  switch (typedef.type) {
    case "uint8":
      return view.setUint8(0, value as number);
    case "uint16":
      return view.setUint16(0, value as number, true);
    case "uint32":
      return view.setUint32(0, value as number, true);
    case "int16":
      return view.setInt16(0, value as number, true);
    case "i32":
      return view.setInt32(0, value as number, true);
    case "f32":
      return view.setFloat32(0, value as number, true);
    case "f64":
      return view.setFloat64(0, value as number, true);
    case "struct": {
      let base = offset;
      for (let [key, def] of typedef.entries) {
        let fvalue = value[key];
        write(def, base, buffer, fvalue);
        base += def.byteLength;
      }
      break;
    }
    case "enum": {
      let index = typedef.constants.findIndex((k) => k === value);
      if (index < 0) {
        throw new TypeError(
          `${value} not a valid enum value. Expected one of ${
            typedef.constants.join(",")
          }`,
        );
      }
      return view.setUint8(0, index);
    }
    case "bool": {
      view.setUint8(0, !value ? 0 : 1);
      break;
    }
    case "optional": {
      if (value == null) {
        zero(typedef.typedef, offset, buffer);
      } else {
        write(typedef.typedef, offset, buffer, value);
      }
      break;
    }
    case "raw": {
      let source = new Uint8Array(value as ArrayBufferLike);
      for (let i = 0; i < typedef.byteLength; i++) {
        view.setUint8(offset + i, source[offset + i]);
      }
      break;
    }
  }
}

export function deref<T>(
  ptr: Ptr<T>,
  offset: number,
  buffer: ArrayBufferLike,
): T {
  let address = read(ptr, offset, buffer);
  return read(ptr.typedef, address, buffer);
}

function zero<T>(
  typedef: TypeDef<T>,
  offset: number,
  buffer: ArrayBufferLike,
): void {
  let view = new Uint8Array(buffer, offset, typedef.byteLength);
  view.fill(0);
}

//ClaySizingType.minMax({ min: 7, max: 6 })
