# FSM Usage

## FSMContextManager

### Class Definition

```typescript
class FSMContextManager<
  TConfig extends FSMStateConfig<PropertyKey, unknown>,
  TContext extends FSMContext<TConfig>
> {
  constructor(
    config: TConfig,
    context: TContext,
    initialState: keyof TConfig
  );
  
  initialize(): Promise<void>;
  transition(to: keyof TConfig): Promise<void>;
  get currentState(): StatePort<FSMContextState<TConfig>>;
}
```

## Usage Example

```typescript
import { FSMContextManager } from '@xndrjs/fsm';

const config = {
  idle: {
    onEnter: () => console.log('Entered idle'),
    onExit: () => console.log('Exited idle'),
  },
  playing: {
    onEnter: () => console.log('Entered playing'),
    onExit: () => console.log('Exited playing'),
  },
};

const context = {
  // Context properties
};

const fsm = new FSMContextManager(config, context, 'idle');
await fsm.initialize();

// Get current state (StatePort)
const currentState = fsm.currentState;
console.log(currentState.get().name); // 'idle'

// Transition to new state
await fsm.transition('playing');
console.log(currentState.get().name); // 'playing'
```

