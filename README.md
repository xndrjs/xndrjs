# xndr

> Framework-agnostic state management libraries. Build reusable business logic with React, Solid, Svelte, and any framework.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-9.12.0-orange)](https://pnpm.io/)

## Overview

`xndr` is a collection of libraries that let you write framework-agnostic state management. This means you will be able to write your business logic once, and share it between different frameworks (React, Solid, Svelte - more incoming) or between client-side and server-side (i.e. in Next.js).

### Why xndr?

The name `xndr` (pronounced "xander") comes from **Alexander** the Great, who famously cut the Gordian knot: a symbol of cutting through complexity with a radical solution.

Just as Alexander cut through the knot, `xndr` helps you make a clean cut between UI-specific state (i.e. `isOpen` for a modal) and domain entity state management (which should be framework-agnostic and reusable), wherever needed. This separation ensures that your business logic remains independent of any frontend framework, making it truly reusable across different projects and teams.

## Features

- **Framework-agnostic state management** - Write business logic once, use it everywhere
- **Multi-framework support** - React, Solid, Svelte (more frameworks coming)
- **Proven patterns** - CQRS, FSM, Memento patterns out of the box
- **Type-safe** - Advanced TypeScript usage for maximum type safety
- **Clean architecture** - Clear separation between business logic and UI layer
- **Easy to test** - Test your business logic in isolation without framework mocking
- **Flexible** - Share logic between client-side and server-side

## Repo Architecture

The monorepo is organized into packages (libraries) and apps (applications):

```mermaid
graph TB
    subgraph packages[Packages - Published Libraries]
        core[@xndrjs/core]
        adapterReact[@xndrjs/adapter-react]
        adapterSolid[@xndrjs/adapter-solid]
        adapterSvelte[@xndrjs/adapter-svelte]
        cqrs[@xndrjs/cqrs]
        fsm[@xndrjs/fsm]
        memento[@xndrjs/memento]
        devtools[@xndrjs/devtools-react]
        configEslint[@xndrjs/config-eslint]
        configTs[@xndrjs/config-typescript]
    end
    
    subgraph apps[Apps - Applications]
        demoReact[demo-react]
        demoSolid[demo-solid]
        demoSvelte[demo-svelte]
        docs[xndr-docs]
    end
    
    core --> adapterReact
    core --> adapterSolid
    core --> adapterSvelte
    core --> cqrs
    core --> fsm
    core --> memento
    
    cqrs --> adapterReact
    fsm --> adapterReact
    memento --> adapterReact
    
    adapterReact --> demoReact
    adapterSolid --> demoSolid
    adapterSvelte --> demoSvelte
    
    devtools --> demoReact
```

## Packages

### Core Library
- **[@xndrjs/core](packages/core)** - StatePort pattern, reactive values, lifecycle management
  - `ReactiveValue`, `ReactiveObject`, `ReactiveArray`, `ReactiveSet`, `ReactiveMap`
  - `createComputed` for computed values
  - `DisposableResource` for automatic cleanup

### Framework Adapters
- **[@xndrjs/adapter-react](packages/adapter-react)** - React integration hooks
- **[@xndrjs/adapter-solid](packages/adapter-solid)** - Solid.js integration
- **[@xndrjs/adapter-svelte](packages/adapter-svelte)** - Svelte integration

### Patterns
- **[@xndrjs/cqrs](packages/cqrs)** - Command Query Responsibility Segregation
  - `CommandBus`, `QueryBus`, `EventBus`
- **[@xndrjs/fsm](packages/fsm)** - Finite State Machine implementation
- **[@xndrjs/memento](packages/memento)** - Undo/Redo pattern implementation

### Developer Tools
- **[@xndrjs/devtools-react](packages/devtools-react)** - DevTools for debugging and monitoring reactive applications

### Configuration
- **[@xndrjs/config-eslint](packages/config-eslint)** - Shared ESLint configuration
- **[@xndrjs/config-typescript](packages/config-typescript)** - Shared TypeScript configuration

## Installation

### Prerequisites

- Node.js >= 20
- pnpm 9.12.0


## Quick Start

Here's a complete example showing how to create framework-agnostic business logic and use it in React:

**Business Logic Class:**

```typescript
import { ReactiveValue, createComputed, DisposableResource } from '@xndrjs/core';

export class CounterManager extends DisposableResource {
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

**React Component:**

```tsx
import { useReactiveValue, useStableReference } from '@xndrjs/adapter-react';
import { CounterManager } from './counter-manager';

function Counter() {
  const manager = useStableReference(() => new CounterManager());
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

The same `CounterManager` class can be used with Solid or Svelte using their respective adapters - no changes to the business logic required!

## Project Structure

```
xndr/
├── packages/              # Published libraries
│   ├── core/             # Core library (StatePort, reactive primitives)
│   ├── adapter-react/    # React adapter
│   ├── adapter-solid/    # Solid.js adapter
│   ├── adapter-svelte/   # Svelte adapter
│   ├── cqrs/             # CQRS pattern implementation
│   ├── fsm/              # FSM pattern implementation
│   ├── memento/          # Memento pattern implementation
│   ├── devtools-react/   # React DevTools
│   ├── config-eslint/    # Shared ESLint config
│   └── config-typescript/ # Shared TypeScript config
├── apps/                 # Applications
│   ├── demo-react/       # React demo application
│   ├── demo-solid/       # Solid.js demo application
│   ├── demo-svelte/      # Svelte demo application
│   └── xndr-docs/        # Documentation site (Docusaurus)
└── scripts/              # Build and workspace scripts
```

## Development

### Commands

```bash
# Start all demo apps and docs in development mode
pnpm dev

# Build all packages and apps
pnpm build

# Run tests across all packages
pnpm test

# Lint all packages
pnpm lint

# Prepare packages for publishing
pnpm prepublish
```

### Workflow

This monorepo uses:
- **pnpm workspaces** for package management
- **Turbo** for build orchestration and caching
- **TypeScript** for type safety
- **Vitest** for testing
- **ESLint** for code quality

The build system automatically handles dependencies between packages and caches builds for faster development.

### Working on a Specific Package

```bash
# Navigate to a package
cd packages/core

# Run package-specific commands
pnpm test
pnpm build
pnpm lint
```

## Links

- **Documentation**: [Full documentation site](https://xndrjs.dev/)
- **Repository**: [GitHub](https://github.com/xndrjs/xndrjs)
- **NPM Packages**: [@xndrjs organization](https://www.npmjs.com/org/xndrjs)
- **Demo Applications**: 
  - React: `apps/demo-react`
  - Solid: `apps/demo-solid`
  - Svelte: `apps/demo-svelte`

## License

MIT License - see [LICENSE](LICENSE) file for details.

Copyright (c) 2025 xndrjs

