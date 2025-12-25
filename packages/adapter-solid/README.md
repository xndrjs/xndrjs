# @xndrjs/adapter-solid

Solid adapter for reactive types from `@xndrjs/core`.

## API

- `useReactiveValue(port)`: returns a Solid accessor that follows `StatePort`/`ComputedValue`.

## Example

```ts
import { ReactiveValue, createComputed, ViewModel } from "@xndrjs/core";
import { useReactiveValue, useViewModel } from "@xndrjs/adapter-solid";

class TestVM extends ViewModel {
  count = new ReactiveValue(1);
  doubled = createComputed(this.count)
    .as((v) => v * 2)
    .for(this);
}

const vm = useViewModel(() => new TestVM());
const value = useReactiveValue(() => vm.doubled);
console.log(value()); // 2
```

## Script

- `pnpm format` / `pnpm lint` / `pnpm test` / `pnpm build` / `pnpm prepublish`
