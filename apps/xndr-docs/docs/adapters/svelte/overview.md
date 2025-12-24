# Setup

The Svelte adapter provides functions to integrate xndr with Svelte components.

## Installation

```bash
npm install @xndrjs/adapter-svelte
# or
pnpm add @xndrjs/adapter-svelte
# or
yarn add @xndrjs/adapter-svelte
```

## Peer Dependencies

- `svelte` >= 5.0.0

## Overview

The Svelte adapter provides two main functions:
- **`reactiveValue`** - Convert a `StatePort` to a Svelte store
- **`toStatePort`** - Convert a Svelte `$state` rune to a `StatePort`

## Quick Start

```html
<script>
  import { reactiveValue, toStatePort } from '@xndrjs/adapter-svelte';
  import { ReactiveValue, createComputed } from '@xndrjs/core';

  // Use a StatePort with Svelte
  const count = new ReactiveValue(0);
  const countStore = reactiveValue(() => count);

  // Use with computed values
  const doubled = createComputed(count)
    .as((c) => c * 2)
    .for({ [Symbol.dispose]() {} });
  const doubledStore = reactiveValue(() => doubled);

  // Convert Svelte $state to StatePort
  let text = $state("");
  const textPort = toStatePort(() => text, (v) => text = v);
</script>

<div>{$countStore}</div>
<div>{$doubledStore}</div>
<input bind:value={text} />
```

## Next Steps

- Learn about the [API Reference](./api.md)
- Check out [Core documentation](../../core/overview.md)

