---
title: patterns → memento → Usage
---

# Memento Usage

## MementoBaseCaretaker

### Class Definition

```typescript
class MementoBaseCaretaker<
  TMemento,
  Originator extends MementoBaseOriginator<TMemento>
> {
  constructor(
    originator: Originator,
    options?: MementoAbstractCaretakerProps<TMemento, Originator>
  );
  
  saveState(): void;
  undo(): void;
  redo(): void;
  
  get history(): ReactiveArray<TMemento>;
  get historyPointer(): ReactiveValue<number>;
  get canUndo(): ComputedValue<boolean>;
  get canRedo(): ComputedValue<boolean>;
}
```

## Usage Example

```typescript
import { MementoBaseCaretaker } from '@xndrjs/memento';
import { ReactiveValue } from '@xndrjs/core';

class TodoListOriginator implements MementoBaseOriginator<Todo[]> {
  private todos = new ReactiveValue<Todo[]>([]);
  
  getMemento(): Todo[] {
    return this.todos.get();
  }
  
  setMemento(memento: Todo[]): void {
    this.todos.set(memento);
  }
  
  get todosPort() {
    return this.todos;
  }
}

const originator = new TodoListOriginator();
const caretaker = new MementoBaseCaretaker(originator);

// Save initial state
caretaker.saveState();

// Make changes
originator.todosPort.set([...originator.todosPort.get(), { id: 1, text: 'Todo 1' }]);
caretaker.saveState();

// Undo
caretaker.undo(); // Restores previous state

// Redo
caretaker.redo(); // Restores next state

// Check if undo/redo is possible
const canUndo = caretaker.canUndo.get(); // boolean
const canRedo = caretaker.canRedo.get(); // boolean
```

