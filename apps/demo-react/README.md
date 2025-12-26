# xndr Demo - React

A deployable React demo application showcasing the StatePort pattern with Memento, FSM, and Event handling.

## Overview

This demo application demonstrates how framework-agnostic business logic can be used with React through the StatePort pattern. The same business logic classes can be reused with other frameworks (Solid, Svelte, Vue, Angular) by creating framework-specific adapters.

## Features

- **Todo List with Undo/Redo**: Demonstrates the Memento pattern using `MementoBaseCaretaker`
- **Stopwatch FSM**: Shows a Finite State Machine with states (idle, playing, paused) that auto-increments every second
- **Event Log**: Real-time event logging using EventBus and EventHandlerBuilder

## Patterns Demonstrated

1. **StatePort Pattern**: Framework-agnostic state abstraction
2. **Memento Pattern**: Undo/redo functionality for todo list
3. **FSM Pattern**: State machine for counter with transitions
4. **Event Handling**: Event bus with automatic subscription management

## Architecture

The application follows a connector/presentational component pattern:

- **Connector Components**: Manage state, create StatePort instances, instantiate framework-agnostic classes, and pass reactive props to UI components
  - `TodoListConnector`: Manages todo state and `TodoListService`
  - `StopwatchFSMConnector`: Manages stopwatch state and `StopwatchFSM`
  - `EventLogConnector`: Manages event log state, `EventBus`, and `TodoEventHandlers`

- **Presentational Components**: Pure UI components that receive reactive props
  - `TodoList`: UI for todo list with undo/redo
  - `StopwatchFSM`: UI for stopwatch FSM
  - `EventLog`: UI for event log

- **Framework-Agnostic Classes** (from `@xndrjs/demo-common`):
  - `TodoListService`: Memento pattern implementation
  - `StopwatchFSM`: FSM pattern implementation with auto-increment
  - `TodoEventHandlers`: Event handling with EventHandlerBuilder

## Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm --filter @xndrjs/demo-react dev

# Build for production
pnpm --filter @xndrjs/demo-react build

# Preview production build
pnpm --filter @xndrjs/demo-react preview
```

## Deployment

This app is ready to be deployed to:
- **Vercel**: Connect your repository and deploy
- **Netlify**: Connect your repository and deploy
- **Any static hosting**: Build and serve the `dist` folder

The build output is in the `dist` directory after running `pnpm build`.

## Framework Agnosticism

The business logic in `@xndrjs/demo-common` is completely framework-agnostic. To use the same classes with other frameworks:

- **Solid**: Create adapters using Solid's reactive primitives
- **Svelte**: Use Svelte stores and reactive statements
- **Vue**: Use Vue's reactivity system
- **Angular**: Use Angular's change detection and observables

All frameworks can subscribe to the same StatePort instances and react to changes.
