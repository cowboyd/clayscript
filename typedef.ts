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
  type: "i32" | "f32" | "f64" | "uint8";
  byteLength: number;
  T?: T;
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

export type Union<T> = {
  type: "union";
  byteLength: number;
  typedefs: TypeDef<T>[];
};

export type TypeDef<T> = Num<T> | Struct<T> | Optional<T> | Union<T> | Enum<T>;

export type TypeOf<Def extends TypeDef<unknown>> = Def extends TypeDef<infer T>
  ? T
  : never;

export const i32 = (): TypeDef<number> => ({ type: "i32", byteLength: 4 });
export const f32 = (): TypeDef<number> => ({ type: "f32", byteLength: 4 });
export const f64 = (): TypeDef<number> => ({ type: "f64", byteLength: 8 });
export const uint8 = (): TypeDef<number> => ({ type: "uint8", byteLength: 1 });
export const char = uint8;

export const bool = i32;
export const ptr = <T>(target: TypeDef<T>) =>
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
export function struct<T extends object>(
  attrs: Attrs<T>,
): TypeDef<T> {
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
  } as TypeDef<T>;
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

export function union<A, B>(
  ...typedefs: [TypeDef<A>, TypeDef<B>]
): TypeDef<[number, A | B]>;
export function union<A, B, C>(
  ...typedefs: [TypeDef<A>, TypeDef<B>, TypeDef<C>]
): TypeDef<[number, A | B | C]>;
export function union<A, B, C, D>(
  ...typedefs: [TypeDef<A>, TypeDef<B>, TypeDef<C>, TypeDef<D>]
): TypeDef<[number, A | B | C | D]>;
export function union<A, B, C, D, E>(
  ...typedefs: [TypeDef<A>, TypeDef<B>, TypeDef<C>, TypeDef<D>, TypeDef<E>]
): TypeDef<[number, A | B | C | D | E]>;
export function union<A, B, C, D, E, F>(
  ...typedefs: [
    TypeDef<A>,
    TypeDef<B>,
    TypeDef<C>,
    TypeDef<D>,
    TypeDef<E>,
    TypeDef<F>,
  ]
): TypeDef<[number, A | B | C | D | E | F]>;

// deno-lint-ignore no-explicit-any
export function union(...typedefs: TypeDef<any>[]): TypeDef<[number, any]> {
  return {
    type: "union",
    byteLength: Math.max(...typedefs.map((t) => t.byteLength)),
    typedefs,
  };
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
    case "optional":
      return read(typedef.typedef, offset, buffer);
    case "union":
      throw new Error(`reading a union is not curretly supported`);
    case "uint8":
      return view.getUint8(0) as T;
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
    case "optional": {
      if (value == null) {
        zero(typedef.typedef, offset, buffer);
      } else {
        write(typedef.typedef, offset, buffer, value);
      }
      break;
    }
    case "union": {
      throw new Error(`writing unions not yet supported`);
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
