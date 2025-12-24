# @xndrjs/adapter-solid

Solid adapter for reactive types from `@xndrjs/core`.

## API

- `useReactiveValue(port)`: returns a Solid accessor that follows `StatePort`/`ComputedValue`.

## Example

```ts
import { ReactiveValue, createComputed } from "@xndrjs/core";
import { useReactiveValue } from "@xndrjs/adapter-solid";

const count = new ReactiveValue(1);
const doubled = createComputed(count)
  .as((v) => v * 2)
  .for({ [Symbol.dispose]() {} });

const value = useReactiveValue(doubled);
console.log(value()); // 2
```

## Script

- `pnpm format` / `pnpm lint` / `pnpm test` / `pnpm build` / `pnpm prepublish`
