# Lifecycle Management

xndr uses the `Disposable` pattern for automatic cleanup of resources and subscriptions.

## Disposable Interface

```typescript
interface Disposable {
  [Symbol.dispose](): void;
}
```

Any object implementing `[Symbol.dispose]()` is considered disposable and can be used with xndr lifecycle management.

## ViewModel

`ViewModel` is a base class to be instantiated in the View layer, that provides automatic cleanup of resources and subscriptions. ViewModels are intended to be used with framework-specific hooks (e.g., `useViewModel` in React) for automatic lifecycle management.

### Class Definition

```typescript
abstract class ViewModel implements Disposable {
  readonly disposed: boolean;
  [Symbol.dispose](): void;
}
```

### Usage

Extend `ViewModel` to get automatic cleanup:

```typescript
import { ViewModel, ReactiveValue, createComputed } from '@xndrjs/core';

class CounterVM extends ViewModel {
  count = new ReactiveValue(0);
  
  doubled = createComputed(this.count)
    .as((c) => c * 2)
    .for(this); // 'this' is the owner
  
  increment() {
    this.count.set((prev) => prev + 1);
  }
}

// In a component, use with useViewModel hook for automatic cleanup
```

### Automatic Cleanup

When a `ViewModel` is disposed:

- All computed values created with `.for(this)` are cleaned up
- Subscriptions registered in `SubscriptionsRegistry` are unsubscribed
- The `[Symbol.dispose]()` method is called automatically
- The `disposed` flag is set to `true` (useful for React Strict Mode)

## SubscriptionsRegistry

`SubscriptionsRegistry` helps manage subscriptions that need cleanup:

### Class Definition

```typescript
class SubscriptionsRegistry {
  add(subscription: () => void): void;
  clear(): void;
}
```

### Usage

```typescript
import { SubscriptionsRegistry } from '@xndrjs/core';

class MyViewModel extends ViewModel {
  private subscriptions = new SubscriptionsRegistry();
  private port: StatePort<number>;
  
  constructor(port: StatePort<number>) {
    super();
    this.port = port;
    
    // Register subscription for cleanup
    const unsubscribe = this.port.subscribe?.(() => {
      // handle change
    });
    if (unsubscribe) {
      this.subscriptions.add(unsubscribe);
    }
  }
  
  [Symbol.dispose](): void {
    this.subscriptions.clear(); // Cleanup all subscriptions
    super._cleanup(); // Call base class cleanup
  }
}
```

## Using with Framework

### React

In React, use the `useViewModel` hook for automatic cleanup:

```typescript
import { useViewModel } from '@xndrjs/adapter-react';
import { ViewModel, ReactiveValue, createComputed } from '@xndrjs/core';
import { useReactiveValue } from '@xndrjs/adapter-react';

class CounterVM extends ViewModel {
  count = new ReactiveValue(0);
  doubled = createComputed(this.count)
    .as((c) => c * 2)
    .for(this);
  
  increment() {
    this.count.set((prev) => prev + 1);
  }
}

function Counter() {
  const vm = useViewModel(() => new CounterVM());
  const count = useReactiveValue(vm.count);
  const doubled = useReactiveValue(vm.doubled);
  
  return (
    <div>
      <div>Count: {count}</div>
      <div>Doubled: {doubled}</div>
      <button onClick={() => vm.increment()}>+</button>
    </div>
  );
}
```

**React Strict Mode**: The `useViewModel` hook automatically handles React Strict Mode (where cleanup runs twice in development) by checking the `disposed` flag and recreating the ViewModel if needed.

### Solid

In Solid, use `useViewModel` hook:

```typescript
import { useViewModel } from '@xndrjs/adapter-solid';
import { ViewModel, ReactiveValue, createComputed } from '@xndrjs/core';
import { useReactiveValue } from '@xndrjs/adapter-solid';

class CounterVM extends ViewModel {
  count = new ReactiveValue(0);
  doubled = createComputed(this.count)
    .as((c) => c * 2)
    .for(this);
  
  increment() {
    this.count.set((prev) => prev + 1);
  }
}

function Counter() {
  const vm = useViewModel(() => new CounterVM());
  const count = useReactiveValue(() => vm.count);
  const doubled = useReactiveValue(() => vm.doubled);
  
  return (
    <div>
      <div>Count: {count()}</div>
      <div>Doubled: {doubled()}</div>
      <button onClick={() => vm.increment()}>+</button>
    </div>
  );
}
```

### Svelte

In Svelte, use `useViewModel` hook:

```html
<script>
  import { useViewModel } from '@xndrjs/adapter-svelte';
  import { reactiveValue } from '@xndrjs/adapter-svelte';
  import { ViewModel, ReactiveValue, createComputed } from '@xndrjs/core';
  
  class CounterVM extends ViewModel {
    count = new ReactiveValue(0);
    doubled = createComputed(this.count)
      .as((c) => c * 2)
      .for(this);
    
    increment() {
      this.count.set((prev) => prev + 1);
    }
  }

  const vm = useViewModel(() => new CounterVM());
  const count = reactiveValue(() => vm.count);
  const doubled = reactiveValue(() => vm.doubled);
</script>

<div>Count: {$count}</div>
<div>Doubled: {$doubled}</div>
<button on:click={() => vm.increment()}>+</button>
```

## Best Practices

1. **Always dispose resources** - Prevent memory leaks by disposing ViewModels when done
2. **Instantiate ViewModel in the View layer** - ViewModels are intended to be instantiated in the View layer, use with `useViewModel` hook
3. **Use dependency injection for managers** - Managers should receive `Disposable` owner via constructor, not extend `ViewModel`
4. **Register subscriptions** - Use `SubscriptionsRegistry` or computed `.for()` for cleanup
5. **Don't dispose shared resources** - Only dispose resources you own

## Example: ViewModel with Manager Pattern

For simple cases, implement logic directly in ViewModel:

```typescript
import {
  ViewModel,
  ReactiveValue,
  createComputed,
} from '@xndrjs/core';

class TodoVM extends ViewModel {
  todos = new ReactiveValue<Todo[]>([]);
  todoCount = createComputed(this.todos)
    .as((todos) => todos.length)
    .for(this);
  
  addTodo(todo: Todo) {
    this.todos.set((prev) => [...prev, todo]);
  }
}

// Usage in component
function TodoApp() {
  const vm = useViewModel(() => new TodoVM());
  const todos = useReactiveValue(vm.todos);
  const count = useReactiveValue(vm.todoCount);
  // ... component code
}
```

For complex cases with reusable managers, use dependency injection:

```typescript
import {
  ViewModel,
  ReactiveValue,
  createComputed,
  SubscriptionsRegistry,
} from '@xndrjs/core';

// Manager receives owner via DI
class TodoManager {
  todos: ReactiveValue<Todo[]>;
  todoCount: ComputedValue<number>;
  
  constructor(protected owner: Disposable, externalPort: StatePort<Todo[]>) {
    this.todos = new ReactiveValue<Todo[]>([]);
    this.todoCount = createComputed(this.todos)
    .as((todos) => todos.length)
      .for(owner);
    
    // Subscribe to external port
    const unsubscribe = externalPort.subscribe?.((todos) => {
      this.todos.set(todos);
    });
    if (unsubscribe) {
      SubscriptionsRegistry.register(owner, unsubscribe);
    }
  }
  
  addTodo(todo: Todo) {
    this.todos.set((prev) => [...prev, todo]);
  }
}

// ViewModel uses the manager
class TodoVM extends ViewModel {
  private manager: TodoManager;
  
  constructor(externalPort: StatePort<Todo[]>) {
    super();
    this.manager = new TodoManager(this, externalPort);
  }
  
  get todos() { return this.manager.todos; }
  get todoCount() { return this.manager.todoCount; }
  addTodo(todo: Todo) { this.manager.addTodo(todo); }
}

// Usage in component
function TodoApp() {
  const vm = useViewModel(() => new TodoVM(externalPort));
  const todos = useReactiveValue(vm.todos);
  const count = useReactiveValue(vm.todoCount);
  // ... component code
}
```

## Next Steps

- Learn about [ReactiveValue](./reactive-value.md) and [ComputedValue](./computed-value.md)
- Explore [Framework Adapters](../adapters/react/overview.md) for framework integration
- Check out [Pattern Packages](../patterns/cqrs/overview.md) for complex state management

