# Setup

The Solid adapter provides hooks to integrate xndr with Solid.js components.

## Installation

```bash
npm install @xndrjs/adapter-solid
# or
pnpm add @xndrjs/adapter-solid
# or
yarn add @xndrjs/adapter-solid
```

## Peer Dependencies

- `solid-js` >= 1.8.0

## Overview

The Solid adapter provides `useReactiveValue` hook that connects `StatePort` instances to Solid's reactivity system.

## Quick Start

```tsx
import { useReactiveValue } from '@xndrjs/adapter-solid';
import { ReactiveValue, createComputed } from '@xndrjs/core';

function Counter() {
  const count = new ReactiveValue(0);
  const doubled = createComputed(count)
    .as((c) => c * 2)
    .for({ [Symbol.dispose]() {} });
  
  const countValue = useReactiveValue(count); // Solid accessor
  const doubledValue = useReactiveValue(doubled); // Solid accessor
  
  return (
    <div>
      <p>Count: {countValue()}</p>
      <p>Doubled: {doubledValue()}</p>
      <button onClick={() => count.set((prev) => prev + 1)}>
        Increment
      </button>
    </div>
  );
}
```

## Next Steps

- Learn about the [API Reference](./api.md)
- Check out [Core documentation](../../core/overview.md)

