---
title: getting-started → Concepts
---

# Fundamental Concepts

Understanding the fundamental concepts of `xndr` will help you build effective framework-agnostic state management.

## StatePort Pattern

The `StatePort` interface is the foundation of `xndr`. It provides a framework-agnostic abstraction for reactive state.

### StatePort Interface

```typescript
interface StatePort<T> {
  get(): T;
  set(value: T | ((prev: T) => T)): void;
  subscribe(callback: (value: T) => void): () => void;
}
```

**Methods:**

- **`get()`**: returns the current value
- **`set(value)`**: updates the value (accepts a value or updater function)
- **`subscribe(callback)`**: subscribes to value changes, returns an unsubscribe function

### Why StatePort?

StatePort is an abstraction for reactive state, inspired by the "port" concept in hexagonal architecture. Just as ports define interfaces that allow your application to work with different adapters (databases, APIs, etc.), StatePort defines a common interface for reactive state. This abstraction enables you to work with `ReactiveValue` from the core package, but also inject reactive states from various frameworks (React, Solid, Svelte) when needed, making your business logic reactive to framework-specific state while remaining framework-agnostic.

The StatePort pattern allows you to write business logic that doesn't depend on any specific framework, so you can

1. swap frameworks without rewriting your business logic
2. test your logic without framework mocking
3. share code between different frontend projects

### Example

This example demonstrates how StatePort allows you to inject framework-specific state into framework-agnostic business logic:

**React Component:**

```tsx
import { useState } from 'react';
import { useStatePort, useViewModel } from '@xndrjs/adapter-react';
import { CounterManager } from './counter-manager';

function CounterComponent() {
  // React state
  const [count, setCount] = useState(0);
  
  // Convert React state to StatePort
  const countPort = useStatePort(count, setCount);
  
  // Create manager instance with stable reference
  const manager = useViewModel(() => 
    new CounterManager(countPort)
  );
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => manager.increment()}>Increment</button>
      <button onClick={() => manager.decrement()}>Decrement</button>
    </div>
  );
}
```

**Business Logic Class:**

```typescript
import type { StatePort } from '@xndrjs/core';
import { ReactiveValue } from '@xndrjs/core';

export class CounterManager {
  private count: StatePort<number>;
  
  constructor(countPort?: StatePort<number>) {
    // Accept optional StatePort, create ReactiveValue if not provided
    this.count = countPort ?? new ReactiveValue(0);
  }
  
  increment() {
    this.count.set((prev) => prev + 1);
  }
  
  decrement() {
    this.count.set((prev) => prev - 1);
  }
  
  getValue(): number {
    return this.count.get();
  }
}
```

**Note**: in this specific case, the manager class could simply accept a `number` parameter in its constructor and use it as a default value. However, this is just a toy example. The true value of the StatePort pattern, in a real case scenario, lies in its ability to integrate any framework-specific state management (e.g., `useState` in React, signals in Solid, Runes in Svelte) while keeping external classes focused solely on framework-agnostic business logic. This design also enables **progressive integration** of `xndr` into your codebase, allowing you to adopt it incrementally without requiring a full rewrite.

This pattern allows your business logic to work with:
- **Framework state**: when a StatePort is passed from React (or Solid, Svelte)
- **Standalone state**: when no StatePort is provided, it can instantiate ReactiveValue internally

The business logic remains completely framework-agnostic while being reactive to framework state when needed.

## Reactive Values

`ReactiveValue` is the simplest implementation of `StatePort`. It holds a single value and notifies subscribers when the value changes.

### Creating Reactive Values

```typescript
import { ReactiveValue } from '@xndrjs/core';

const count = new ReactiveValue(0);
const name = new ReactiveValue('Alice');
const isActive = new ReactiveValue(true);
```

### Updating Values

You can update values in two ways:

```typescript
// Direct value
count.set(10);

// Updater function (useful for immutable updates)
count.set((prev) => prev + 1);
```

## Computed Values

Computed values automatically update when their dependencies change. They're derived from other `StatePort` instances.

### Creating Computed Values

```typescript
import { ReactiveValue, createComputed, ViewModel } from '@xndrjs/core';

const a = new ReactiveValue(2);
const b = new ReactiveValue(3);

// Create a computed value that depends on a and b
// In tests or global contexts, use a ViewModel instance
class TestViewModel extends ViewModel {}
const testOwner = new TestViewModel();
const sum = createComputed(a, b)
  .as((x, y) => x + y)
  .for(testOwner); // Owner for cleanup

console.log(sum.get()); // 5

// When dependencies change, computed value updates automatically
a.set(5);
console.log(sum.get()); // 8 (5 + 3)
```

### Memoization

Computed values are memoized by default. The computation function only runs when dependencies actually change.

## Lifecycle Management

`xndr` uses the `Disposable` pattern for cleanup. Objects that need cleanup implement `Symbol.dispose`.

### ViewModel

In the View layer, instantiate `ViewModel` with framework hooks:

```typescript
import { ViewModel, ReactiveValue, createComputed } from '@xndrjs/core';
import { useViewModel } from '@xndrjs/adapter-react';

class CounterVM extends ViewModel {
  count = new ReactiveValue(0);
  
  doubled = createComputed(this.count)
    .as((c) => c * 2)
    .for(this); // 'this' is the owner - this requires cleanup
  
  increment() {
    this.count.set((prev) => prev + 1);
  }
}

// In a component, use with useViewModel for automatic cleanup
function Counter() {
  const vm = useViewModel(() => new CounterVM());
  // ... use vm
  // Cleanup happens automatically when component unmounts
}
```

## Framework Integration

`xndr` provides adapters to connect `StatePort` instances to framework reactivity systems.

**Business Logic Class:**

```typescript
import { ReactiveValue, createComputed, ViewModel } from '@xndrjs/core';

export class CounterManager extends ViewModel {
  public count = new ReactiveValue(0);
  
  public doubled = createComputed(this.count)
    .as((c) => c * 2)
    .for(this); // 'this' is the owner for automatic cleanup
  
  increment() {
    this.count.set((prev) => prev + 1);
  }
  
  decrement() {
    this.count.set((prev) => prev - 1);
  }
}
```

### React

```tsx
import { useReactiveValue, useViewModel } from '@xndrjs/adapter-react';
import { CounterManager } from './counter-manager';

function Counter() {
  const manager = useViewModel(() => new CounterManager());
  const count = useReactiveValue(manager.count);
  const doubled = useReactiveValue(manager.doubled);
  
  return (
    <div>
      <div>Count: {count}</div>
      <div>Doubled: {doubled}</div>
      <button onClick={() => manager.increment()}>+</button>
      <button onClick={() => manager.decrement()}>-</button>
    </div>
  );
}
```

### Solid

```tsx
import { useReactiveValue } from '@xndrjs/adapter-solid';
import { CounterManager } from './counter-manager';
import { createMemo } from 'solid-js';

function Counter() {
  const manager = createMemo(() => new CounterManager());
  const count = useReactiveValue(manager().count);
  const doubled = useReactiveValue(manager().doubled); // ComputedValue works the same way
  
  return (
    <div>
      <div>Count: {count()}</div>
      <div>Doubled: {doubled()}</div>
      <button onClick={() => manager().increment()}>+</button>
      <button onClick={() => manager().decrement()}>-</button>
    </div>
  );
}
```

### Svelte

```html
<script>
  import { reactiveValue } from '@xndrjs/adapter-svelte';
  import { CounterManager } from './counter-manager';
  
  const manager = new CounterManager();
  const countStore = reactiveValue(() => manager.count);
  const doubledStore = reactiveValue(() => manager.doubled); // ComputedValue works the same way
</script>

<div>
  <div>Count: {$countStore}</div>
  <div>Doubled: {$doubledStore}</div>
  <button on:click={() => manager.increment()}>+</button>
  <button on:click={() => manager.decrement()}>-</button>
</div>
```

## Patterns

`xndr` includes several design patterns:

- **CQRS**: Separate commands (mutations) from queries (reads)
- **FSM**: Finite State Machines for managing complex state transitions
- **Memento**: Undo/Redo functionality

See the [Patterns documentation](../patterns/cqrs/overview.md) for more details.

## Next Steps

- Learn about [ReactiveValue](../core/reactive-value.md) in detail
- Explore [Computed Values](../core/computed-value.md)
- Check out [Framework Adapters](../adapters/react/overview.md)

