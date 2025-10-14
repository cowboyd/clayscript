# ClayScript

Script [Clay][clay] with JavaScript

This is an experiment in using clay as an ES module.

## development

This assumes a functioning WASM toolchain with `clang`

First, build `clay.wasm`

```shellsession
deno task build
```

Then run the experiment

```shellsession
deno main.ts
```
## test

Build tests

```shellsession
deno task build:tests
```

Run tests

```ts
deno test
```


[clay]: https://github.com/nicbarker/clay
