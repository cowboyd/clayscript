import { describe, it } from "@std/testing/bdd";
import * as data from "../data.ts";
import * as sizeof from "./sizeof.wasm";
import { expect } from "@std/expect";

describe("sizeof", () => {
  for (
    let [name, typedef] of Object.entries(data) as [
      keyof typeof data,
      typeof data[keyof typeof data],
    ][]
  ) {
    it(name, () => {
      expect(sizeof[`sizeof${name}`]()).toEqual(typedef.byteLength);
    });
  }
});
