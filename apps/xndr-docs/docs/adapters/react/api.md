# API Reference

Complete API reference for `@xndrjs/adapter-react`.

## useReactiveValue

Subscribe to a `StatePort` and return its current value. The component re-renders when the value changes.

### Function Signature

```typescript
function useReactiveValue<T>(reactiveValue: StatePort<T>): T;
```

**Type Parameters:**
- `T` - The type of the value

**Parameters:**
- `reactiveValue: StatePort<T>` - The StatePort to subscribe to (can be `ReactiveValue`, `ComputedValue`, or any `StatePort`)

**Returns:** The current value of type `T`

**Behavior:**
- Automatically detects `ComputedValue` and uses shallow equality to prevent infinite loops
- Uses React's `useSyncExternalStore` for regular `StatePort` (efficient)
- Uses internal state management for `ComputedValue` to handle object equality correctly
- Re-renders component when the value changes

**Example:**

```tsx
import { useReactiveValue } from '@xndrjs/adapter-react';
import { ReactiveValue, createComputed } from '@xndrjs/core';

function Counter() {
  const count = new ReactiveValue(0);
  const doubled = createComputed(count)
    .as((c) => c * 2)
    .for({ [Symbol.dispose]() {} });
  
  const countValue = useReactiveValue(count); // number
  const doubledValue = useReactiveValue(doubled); // number
  
  return (
    <div>
      <p>Count: {countValue}</p>
      <p>Doubled: {doubledValue}</p>
    </div>
  );
}
```

## useStatePort

Convert React `useState` to a `StatePort`. Returns a stable `StatePort` object that doesn't change reference.

### Function Signature

```typescript
function useStatePort<T>(
  value: T,
  setValue: Dispatch<SetStateAction<T>>,
): StatePort<T>;
```

**Type Parameters:**
- `T` - The type of the value

**Parameters:**
- `value: T` - The current state value (from `useState`)
- `setValue: Dispatch<SetStateAction<T>>` - The state setter function (from `useState`)

**Returns:** A stable `StatePort<T>` object

**Behavior:**
- Returns a stable reference (doesn't change on re-renders)
- The port remains reactive: `subscribe()` notifies when value changes
- `get()` always returns the current value via internal ref
- Can be used in `useRef`/`useMemo` dependencies without causing re-renders

**Example:**

```tsx
import { useState } from 'react';
import { useStatePort } from '@xndrjs/adapter-react';
import { createComputed } from '@xndrjs/core';

function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const todosPort = useStatePort(todos, setTodos);
  
  // Use the port with computed values or other StatePort operations
  const todoCount = createComputed(todosPort)
    .as((todos) => todos.length)
    .for({ [Symbol.dispose]() {} });
  
  return <div>{/* ... */}</div>;
}
```

## useCreateStatePort

Create a `StatePort` managed by React state. Returns a stable `StatePort` object.

### Function Signature

```typescript
function useCreateStatePort<T>(initialValue: T): StatePort<T>;
```

**Type Parameters:**
- `T` - The type of the value

**Parameters:**
- `initialValue: T` - The initial value

**Returns:** A stable `StatePort<T>` object

**Behavior:**
- Returns a stable reference (doesn't change on re-renders)
- Uses React `useState` internally
- The port remains reactive: `subscribe()` notifies when value changes
- Can be used with computed values and other `StatePort` operations

**Example:**

```tsx
import { useCreateStatePort, useReactiveValue } from '@xndrjs/adapter-react';
import { createComputed } from '@xndrjs/core';

function TodoApp() {
  const todosPort = useCreateStatePort<Todo[]>([]);
  const todos = useReactiveValue(todosPort);
  
  const todoCount = createComputed(todosPort)
    .as((todos) => todos.length)
    .for({ [Symbol.dispose]() {} });
  
  const addTodo = (todo: Todo) => {
    todosPort.set((prev) => [...prev, todo]);
  };
  
  return (
    <div>
      <p>Total: {todos.length}</p>
      {/* ... */}
    </div>
  );
}
```

## useFSM

Automatically initialize an FSM context manager when the component mounts.

### Function Signature

```typescript
function useFSM<TConfig extends Record<PropertyKey, unknown>>(
  fsm: FSMContextManager<TConfig, any> | null | undefined,
): void;
```

**Type Parameters:**
- `TConfig` - The FSM configuration type

**Parameters:**
- `fsm: FSMContextManager<TConfig, any> | null | undefined` - The FSM context manager to initialize

**Returns:** `void`

**Behavior:**
- Calls `fsm.initialize()` when component mounts
- `initialize()` is idempotent, so this hook can be safely used with shared FSM instances
- No-op if `fsm` is `null` or `undefined`

**Example:**

```tsx
import { useFSM } from '@xndrjs/adapter-react';
import { FSMContextManager } from '@xndrjs/fsm';
import { useMemo } from 'react';

function Stopwatch() {
  const fsm = useMemo(() => new StopwatchFSM(currentStatePort), []);
  
  // Automatically initialize the FSM
  useFSM(fsm);
  
  // Component is reactive to machine state changes
  const currentState = useReactiveValue(fsm.currentState);
  
  return <div>Current state: {currentState.name}</div>;
}
```

## useStableReference

Get a stable reference to a value. Returns the same reference across re-renders if the value hasn't changed.

### Function Signature

```typescript
function useStableReference<T>(value: T): T;
```

**Type Parameters:**
- `T` - The type of the value

**Parameters:**
- `value: T` - The value to create a stable reference for

**Returns:** A stable reference to the value (same reference if value hasn't changed)

**Behavior:**
- Returns the same reference across re-renders if the value is equal (using `Object.is`)
- Useful for preventing unnecessary re-renders in child components
- Useful for `useMemo`/`useCallback` dependencies

**Example:**

```tsx
import { useStableReference } from '@xndrjs/adapter-react';

function Parent({ config }) {
  const stableConfig = useStableReference(config);
  
  // Child won't re-render if config object reference changed but values are the same
  return <Child config={stableConfig} />;
}
```

## Type Exports

All React adapter types are exported for TypeScript usage:

```typescript
// All hooks are exported with their types
export { useReactiveValue, useStatePort, useCreateStatePort, useFSM, useStableReference };
```

## Next Steps

- Learn about [Core concepts](../../core/overview.md)
- Explore [FSM pattern](../../patterns/fsm/overview.md)
- Check out [Getting Started](../../getting-started/concepts.md)

