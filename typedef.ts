// deno-lint-ignore-file no-explicit-any

export type Attrs<T> = {
  [K in keyof T]: TypeDef<T[K]>;
};

export type Alignment = 1 | 2 | 4 | 8;

export type LayoutElement<T> = {
  type: "padding";
  byteLength: number;
} | {
  type: "field";
  name: string;
  offset: number;
  typedef: Attrs<T>[keyof Attrs<T>];
};

export type Struct<T> = {
  type: "struct";
  byteLength: number;
  byteAlign: Alignment;
  layout: LayoutElement<T>[];
};

export type Num<T> = {
  type: "i32" | "f32" | "f64" | "uint8" | "uint16" | "uint32" | "int16";
  byteAlign: Alignment;
  byteLength: number;
  T?: T;
};

export type Bool<T> = {
  type: "bool";
  byteLength: 1;
  byteAlign: 1;
  T?: T;
};

export type Raw<T> = {
  type: "raw";
  byteLength: number;
  byteAlign: Alignment;
  T?: T;
  alloc<A>(typedef: TypeDef<A>, value: A): ArrayBuffer;
};

export type Ptr<T> = TypeDef<number> & {
  type: "i32";
  byteLength: 4;
  byteAlign: 4;
  typedef: TypeDef<T>;
};

export type Enum<T> = {
  type: "enum";
  byteLength: 1;
  byteAlign: 1;
  constants: T extends string ? T[] : never;
};

export type TypeDef<T> =
  | Num<T>
  | Bool<T>
  | Struct<T>
  | Enum<T>
  | Raw<T>;

export type TypeOf<Def extends TypeDef<any>> = Def extends TypeDef<infer T> ? T
  : never;

export const i32 = (): TypeDef<number> => ({
  type: "i32",
  byteLength: 4,
  byteAlign: 4,
});
export const f32 = (): TypeDef<number> => ({
  type: "f32",
  byteLength: 4,
  byteAlign: 4,
});
export const f64 = (): TypeDef<number> => ({
  type: "f64",
  byteLength: 8,
  byteAlign: 8,
});
export const uint8 = (): TypeDef<number> => ({
  type: "uint8",
  byteLength: 1,
  byteAlign: 1,
});
export const uint16 = (): TypeDef<number> => ({
  type: "uint16",
  byteLength: 2,
  byteAlign: 2,
});
export const uint32 = (): TypeDef<number> => ({
  type: "uint32",
  byteAlign: 4,
  byteLength: 4,
});
export const int16 = (): TypeDef<number> => ({
  type: "int16",
  byteLength: 2,
  byteAlign: 2,
});

export function bool(): Bool<boolean> {
  return {
    type: "bool",
    byteLength: 1,
    byteAlign: 1,
  };
}

export const float = f32;

export const char = uint8;

export const ptr = <T>(target: TypeDef<T> = char() as TypeDef<T>) =>
  ({
    type: "i32",
    byteLength: 4,
    byteAlign: 4,
    typedef: target,
  }) as Ptr<T>;

export function enumOf<T extends string>(...constants: T[]): Enum<T> {
  return {
    type: "enum",
    byteLength: 1,
    byteAlign: 1,
    constants,
  } as Enum<T>;
}

export function raw(
  byteLength: number,
  byteAlign: Alignment = 1,
): Raw<ArrayBuffer> {
  return {
    type: "raw",
    byteLength,
    byteAlign,
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

  let acc = {
    layout: [] as Struct<T>["layout"],
    offset: 0,
  };

  let byteAlign = Math.max(
    ...entries.map(([, typedef]) => typedef.byteAlign),
  ) as 1 | 2 | 4;

  for (let [name, typedef] of entries) {
    if ((acc.offset % typedef.byteAlign) !== 0) {
      let padding = typedef.byteAlign - (acc.offset % typedef.byteAlign);
      acc.layout.push({ type: "padding", byteLength: padding });
      acc.offset += padding;
    }  
    
    acc.layout.push({
      type: "field",
      name: name as string,
      offset: acc.offset,
      typedef,
    });
    acc.offset += typedef.byteLength;
  }

  if ((acc.offset % byteAlign) !== 0) {
    let padding = byteAlign - (acc.offset % byteAlign);
    acc.layout.push({ type: "padding", byteLength: padding });
    acc.offset += padding;
  }  

  return {
    type: "struct",
    layout: acc.layout,
    byteLength: acc.offset,
    byteAlign,
  };
}

export type Union<A extends Attrs<any>> =
  & Raw<ArrayBuffer>
  & {
    [K in keyof A]: (value: TypeOf<A[K]>) => ArrayBuffer;
  };

export function union<T>(attrs: Attrs<T>): Union<Attrs<T>> {
  let entries = Object.entries(attrs) as [keyof T, Attrs<T>[keyof T]][];
  let typedefs = entries.map(([, typedef]) => typedef);

  let largest = typedefs.reduce((max, typedef) =>
    typedef.byteLength > max.byteLength ? typedef : max
  );

  let { byteLength, byteAlign } = largest;
  
  let opaque = raw(byteLength, byteAlign);

  let constructors = Object.fromEntries(
    entries.map((
      [key, typedef],
    ) => [key, (value: any) => opaque.alloc(typedef, value)]),
  );

  return Object.assign(raw(byteLength, byteAlign), constructors) as Union<Attrs<T>>;
}

export function read<T>(
  typedef: TypeDef<T>,
  offset: number,
  buffer: ArrayBufferLike,
): T {
  let view = new DataView(buffer, offset);
  switch (typedef.type) {
    case "struct":
      return typedef.layout.reduce((acc, element) => {
        return element.type === "padding" ? acc : Object.assign(acc, {
          [element.name]: read(element.typedef, offset + element.offset, buffer),
        });
      }, {}) as T;
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

export function write<const T>(
  typedef: TypeDef<T>,
  offset: number,
  buffer: ArrayBufferLike,
  value: T,
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
      for (let element of typedef.layout) {
        if (element.type === "field") {
          let fvalue = value[element.name as keyof T];
          write(element.typedef, offset + element.offset, buffer, fvalue);
        }
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

export function zero<T>(
  typedef: TypeDef<T>,
  offset: number,
  buffer: ArrayBufferLike,
): void {
  let view = new Uint8Array(buffer, offset, typedef.byteLength);
  view.fill(0);
}
