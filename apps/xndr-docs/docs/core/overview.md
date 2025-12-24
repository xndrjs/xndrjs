# Core Package Overview

The `@xndrjs/core` package provides the foundation for framework-agnostic state management in xndr.

## Installation

```bash
npm install @xndrjs/core
# or
pnpm add @xndrjs/core
# or
yarn add @xndrjs/core
```

## Basic Concept

### StatePort

The `StatePort<T>` interface is the fundamental abstraction for reactive state:

```typescript
interface StatePort<T> {
  get(): T;
  set(value: T | ((prev: T) => T)): void;
  subscribe?(callback: (value: T) => void): () => void;
}
```

All reactive primitives in `@xndrjs/core` implement `StatePort`.

### Reactive Primitives

- **ReactiveValue** - For primitive values (string, number, boolean, null, undefined)
- **ReactiveObject** - For plain objects
- **ReactiveArray** - For arrays
- **ReactiveSet** - For Sets
- **ReactiveMap** - For Maps

### Computed Values

Computed values automatically update when dependencies change:

```typescript
import { ReactiveValue, createComputed } from '@xndrjs/core';

const a = new ReactiveValue(2);
const b = new ReactiveValue(3);

const sum = createComputed(a, b)
  .as((x, y) => x + y)
  .for(owner);
```

### Lifecycle Management

Use `DisposableResource` for automatic cleanup:

```typescript
import { DisposableResource, ReactiveValue, createComputed } from '@xndrjs/core';

class MyManager extends DisposableResource {
  private count = new ReactiveValue(0);
  
  private doubled = createComputed(this.count)
    .as((c) => c * 2)
    .for(this); // 'this' is the owner - this requires cleanup
  
  // Cleanup happens automatically when disposed
  // Note: ReactiveValue itself does NOT need cleanup
}
```

## Key Exports

```typescript
// StatePort pattern
export { StatePort } from './state-port';
export type { StatePort } from './state-port';

// Reactive primitives
export { ReactiveValue } from './reactive-value';
export { ReactiveObject } from './reactive-object';
export { ReactiveArray } from './reactive-array';
export { ReactiveSet } from './reactive-set';
export { ReactiveMap } from './reactive-map';

// Computed values
export { createComputed } from './create-computed';
export type { ComputedValue } from './computed-value';

// Lifecycle
export { DisposableResource } from './disposable-resource';
export type { Disposable } from './disposable';
export { makeDisposableObject } from './disposable';
export { SubscriptionsRegistry } from './subscriptions-registry';

// Utilities
export { batched } from './batched';
export { BatchContext } from './batch-context';
```

## Next Steps

- Learn about [StatePort](./state-port.md)
- Explore [ReactiveValue](./reactive-value.md)
- Understand [ComputedValue](./computed-value.md)
- Read about [Lifecycle Management](./lifecycle.md)

