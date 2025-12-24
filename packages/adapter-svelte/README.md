# @xndrjs/adapter-svelte

Svelte adapter for reactive types from `@xndrjs/core`.

## API

- `reactiveValue(getPort)`: returns a Svelte store that follows `StatePort`/`ComputedValue`.
  Requires a function that returns the port. This ensures reactive tracking of props
  and resolves the "state_referenced_locally" warning without needing `$derived`.

- `toStatePort(getState, setState)`: converts a Svelte reactive value (`$state`) to a `StatePort`.
  This allows using Svelte runes with APIs that expect `StatePort`.

## Example

```html
<script>
  import { reactiveValue } from "@xndrjs/adapter-svelte";
  import { ReactiveValue, createComputed } from "@xndrjs/core";

  // For static ports
  const count = new ReactiveValue(1);
  const countStore = reactiveValue(() => count);

  const doubled = createComputed(count)
    .as((v) => v * 2)
    .for({ [Symbol.dispose]() {} });
  const doubledStore = reactiveValue(() => doubled);

  // For reactive props (no $derived needed!)
  let { todoListManager } = $props();
  const todosStore = reactiveValue(() => todoListManager.todos);

  // Convert $state to StatePort to use with APIs that require StatePort
  import { toStatePort } from "@xndrjs/adapter-svelte";
  let text = $state("");
  const textPort = toStatePort(
    () => text,
    (v) => (text = v),
  );
</script>

<div>{$countStore}</div>
<div>{$doubledStore}</div>
<div>{$todosStore}</div>
<div>{text}</div>
```

## Script

- `pnpm format` / `pnpm lint` / `pnpm test` / `pnpm build` / `pnpm prepublish`
