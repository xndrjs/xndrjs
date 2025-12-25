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
import { useReactiveValue, useViewModel } from '@xndrjs/adapter-react';
import { ReactiveValue, createComputed, ViewModel } from '@xndrjs/core';

class CounterVM extends ViewModel {
  count = new ReactiveValue(0);
  doubled = createComputed(this.count)
    .as((c) => c * 2)
    .for(this);
}

function Counter() {
  const vm = useViewModel(() => new CounterVM());
  const countValue = useReactiveValue(vm.count); // number
  const doubledValue = useReactiveValue(vm.doubled); // number
  
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
import { useStatePort, useViewModel } from '@xndrjs/adapter-react';
import { createComputed, ViewModel } from '@xndrjs/core';

class TodoAppVM extends ViewModel {
  todoCount: ComputedValue<number>;
  
  constructor(todosPort: StatePort<Todo[]>) {
    super();
    this.todoCount = createComputed(todosPort)
      .as((todos) => todos.length)
      .for(this);
  }
}

function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const todosPort = useStatePort(todos, setTodos);
  const vm = useViewModel(() => new TodoAppVM(todosPort));
  
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
import { useCreateStatePort, useReactiveValue, useViewModel } from '@xndrjs/adapter-react';
import { createComputed, ViewModel } from '@xndrjs/core';

class TodoAppVM extends ViewModel {
  todoCount: ComputedValue<number>;
  
  constructor(todosPort: StatePort<Todo[]>) {
    super();
    this.todoCount = createComputed(todosPort)
      .as((todos) => todos.length)
      .for(this);
  }
}

function TodoApp() {
  const todosPort = useCreateStatePort<Todo[]>([]);
  const todos = useReactiveValue(todosPort);
  const vm = useViewModel(() => new TodoAppVM(todosPort));
  
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

## Type Exports

All React adapter types are exported for TypeScript usage:

```typescript
// All hooks are exported with their types
export { useReactiveValue, useStatePort, useCreateStatePort, useFSM, useViewModel };
```

## Next Steps

- Learn about [Core concepts](../../core/overview.md)
- Explore [FSM pattern](../../patterns/fsm/overview.md)
- Check out [Getting Started](../../getting-started/concepts.md)

