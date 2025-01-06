# jslay

[Clay][clay] bindings for JavaScript

This is an experiment in using clay as an ES module.

## development

This assumes a functioning WASM toolchain with `clang`

First, build `clay.wasm`

```shellsession
$ deno task build
```

Then run the experiment

```shellsession
$ deno main.ts
```

## Open Questions

- How do you pass in a complex struct like ClayDimensions as an argument to a function?

[clay]: https://github.com/nicbarker/clay

