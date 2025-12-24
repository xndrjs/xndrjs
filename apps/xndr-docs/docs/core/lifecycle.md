# Lifecycle Management

xndr uses the `Disposable` pattern for automatic cleanup of resources and subscriptions.

## Disposable Interface

```typescript
interface Disposable {
  [Symbol.dispose](): void;
}
```

Any object implementing `[Symbol.dispose]()` is considered disposable and can be used with xndr lifecycle management.

## DisposableResource

`DisposableResource` is a base class that provides automatic cleanup for your classes.

### Class Definition

```typescript
abstract class DisposableResource implements Disposable {
  [Symbol.dispose](): void;
}
```

### Usage

Extend `DisposableResource` to get automatic cleanup:

```typescript
import { DisposableResource, ReactiveValue, createComputed } from '@xndrjs/core';

class MyManager extends DisposableResource {
  private count = new ReactiveValue(0);
  
  private doubled = createComputed(this.count)
    .as((c) => c * 2)
    .for(this); // 'this' is the owner
  
  increment() {
    this.count.set((prev) => prev + 1);
  }
}

// When disposed, all subscriptions are cleaned up
const manager = new MyManager();
// ... use manager
manager[Symbol.dispose](); // Cleanup happens automatically
```

### Automatic Cleanup

When a `DisposableResource` is disposed:

- All computed values created with `.for(this)` are cleaned up
- Subscriptions registered in `SubscriptionsRegistry` are unsubscribed
- The `[Symbol.dispose]()` method is called automatically

## makeDisposableObject

For plain objects, use `makeDisposableObject` to add automatic disposal:

### Function Signature

```typescript
function makeDisposableObject<T extends object>(
  obj: T,
  options?: MakeDisposableObjectOptions<T>
): T & Disposable;
```

**Type Parameters:**
- `T` - The type of the object (must extend `object`)

**Parameters:**
- `obj: T` - The plain object to make disposable
- `options?: MakeDisposableObjectOptions<T>` - Optional configuration

**Returns:** The same object with `[Symbol.dispose]()` method added

### Options

```typescript
interface MakeDisposableObjectOptions<T extends object = object> {
  /**
   * Array of property paths to exclude from auto-disposal.
   * Supports nested paths using dot notation (e.g., "meta.user").
   */
  exclude?: Array<PathOf<T>>;
}
```

### Auto-Detection

`makeDisposableObject` automatically detects properties that implement `Disposable` (have `Symbol.dispose`) and adds cleanup logic.

**Example:**

```typescript
import { makeDisposableObject, ReactiveValue, createComputed } from '@xndrjs/core';

function createCounterManager() {
  const count = new ReactiveValue(0);
  const doubled = createComputed(count)
    .as((c) => c * 2)
    .for({ [Symbol.dispose]() {} });
  
  return makeDisposableObject({
    count,
    doubled,
    increment() {
      count.set((prev) => prev + 1);
    },
  });
  // Automatically detects 'count' and 'doubled' as disposable
}

const manager = createCounterManager();
// ... use manager
manager[Symbol.dispose](); // Cleanup happens automatically
```

### Excluding Properties

Use the `exclude` option to exclude specific properties from auto-disposal:

```typescript
const manager = makeDisposableObject({
  count: new ReactiveValue(0),
  meta: {
    user: {
      [Symbol.dispose]: () => {} // Has Symbol.dispose but we don't want to auto-dispose it
    }
  }
}, { exclude: ['meta.user'] });
```

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

class MyManager extends DisposableResource {
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
    super[Symbol.dispose]();
  }
}
```

## Using with Framework

### React

In React, use the `useDisposable` hook (if available) or cleanup in `useEffect`:

```typescript
import { useEffect } from 'react';
import { DisposableResource } from '@xndrjs/core';

function useMyManager() {
  useEffect(() => {
    const manager = new MyManager();
    return () => {
      manager[Symbol.dispose]();
    };
  }, []);
}
```

### Solid

In Solid, use `onCleanup`:

```typescript
import { onCleanup } from 'solid-js';

function createMyManager() {
  const manager = new MyManager();
  onCleanup(() => {
    manager[Symbol.dispose]();
  });
  return manager;
}
```

### Svelte

In Svelte, use `onDestroy`:

```html
<script>
  import { onDestroy } from 'svelte';
  import { DisposableResource } from '@xndrjs/core';
  
  const manager = new MyManager();
  onDestroy(() => {
    manager[Symbol.dispose]();
  });
</script>
```

## Best Practices

1. **Always dispose resources** - Prevent memory leaks by disposing managers when done
2. **Use DisposableResource for classes** - Provides automatic cleanup
3. **Use makeDisposableObject for plain objects** - Adds disposal to plain objects
4. **Register subscriptions** - Use `SubscriptionsRegistry` or computed `.for()` for cleanup
5. **Don't dispose shared resources** - Only dispose resources you own

## Example: Complete Manager

```typescript
import {
  DisposableResource,
  ReactiveValue,
  createComputed,
  SubscriptionsRegistry,
} from '@xndrjs/core';

class TodoManager extends DisposableResource {
  private todos = new ReactiveValue<Todo[]>([]);
  private subscriptions = new SubscriptionsRegistry();
  
  public todoCount = createComputed(this.todos)
    .as((todos) => todos.length)
    .for(this);
  
  constructor(externalPort: StatePort<Todo[]>) {
    super();
    
    // Subscribe to external port
    const unsubscribe = externalPort.subscribe?.((todos) => {
      this.todos.set(todos);
    });
    if (unsubscribe) {
      this.subscriptions.add(unsubscribe);
    }
  }
  
  addTodo(todo: Todo) {
    this.todos.set((prev) => [...prev, todo]);
  }
  
  [Symbol.dispose](): void {
    this.subscriptions.clear();
    super[Symbol.dispose]();
  }
}

// Usage
const manager = new TodoManager(externalPort);
// ... use manager
manager[Symbol.dispose](); // All cleanup happens automatically
```

## Next Steps

- Learn about [ReactiveValue](./reactive-value.md) and [ComputedValue](./computed-value.md)
- Explore [Framework Adapters](../adapters/react/overview.md) for framework integration
- Check out [Pattern Packages](../patterns/cqrs/overview.md) for complex state management

