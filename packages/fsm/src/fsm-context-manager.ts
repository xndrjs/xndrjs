import { type StatePort, DisposableResource } from "@xndrjs/core";
import type {
  ExtractConfigFromContext,
  FSMContext,
  FSMContextState,
  FSMStateConfig,
} from "./types";
import { CONFIG_TYPE } from "./types";

/**
 * Base implementation of a Finite State Machine context manager.
 * Uses StatePort for framework-agnostic state management of the current machine state.
 *
 * @template TConfig - The generic FSM config type
 * @template TSelf - The concrete context manager type (must be specified when extending)
 */
export class FSMContextManager<
  // The generic FSM config type
  TConfig extends FSMStateConfig<PropertyKey, unknown>,
  // The concrete context manager type (must be specified when extending)
  TSelf extends FSMContextManager<TConfig, TSelf> = FSMContextManager<
    TConfig,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    any
  >,
>
  extends DisposableResource
  implements FSMContext<TConfig>
{
  /**
   * Symbol property for type inference only.
   * Used by ExtractConfigFromContext type helper to infer TConfig.
   * Never actually used at runtime. Does not appear in autocomplete.
   */
  readonly [CONFIG_TYPE]!: TConfig;

  private _currentState: StatePort<FSMContextState<TSelf>>;
  private _hasCalledInitialize: boolean;

  /**
   * Get the current machine state as a StatePort.
   * Framework adapters can subscribe to this port to react to state changes.
   */
  get currentState(): StatePort<FSMContextState<TSelf>> {
    return this._currentState;
  }

  /**
   * Create a new FSM context manager.
   *
   * @param currentStatePort - StatePort for the current machine state
   */
  constructor(currentStatePort: StatePort<FSMContextState<TSelf>>) {
    super();
    this._currentState = currentStatePort;
    this._hasCalledInitialize = false;
  }

  /**
   * Initialize the FSM by calling onEnter on the initial machine state.
   * This method is idempotent and can be called multiple times safely.
   *
   * @returns The context manager instance (for chaining)
   */
  async initialize() {
    if (!this._hasCalledInitialize) {
      this._hasCalledInitialize = true;
      await this._currentState.get().onEnter?.(this as unknown as TSelf);
    }
    return this as unknown as TSelf;
  }

  /**
   * Ensure the FSM has been initialized.
   * Throws an error if initialize() has not been called.
   */
  protected ensureInitialized() {
    if (!this._hasCalledInitialize) {
      throw new Error("FSMContextManager must call initialize()");
    }
  }

  /**
   * Cleanup method that delegates to the parent class cleanup.
   * Classes extending FSMContextManager can call super._cleanup()
   * when overriding [Symbol.dispose]().
   */
  protected _cleanup(): void {
    super._cleanup();
  }

  /**
   * Dispatch a payload to the current machine state's handleNext method.
   *
   * @param payload - The payload to dispatch
   */
  async dispatch<T extends keyof TConfig>(payload: TConfig[T]): Promise<void> {
    this.ensureInitialized();
    await this._currentState
      .get()
      .handleNext(
        this as unknown as TSelf,
        payload as unknown as ExtractConfigFromContext<TSelf>[keyof ExtractConfigFromContext<TSelf>],
      );
  }

  /**
   * Transition to a new machine state.
   * Updates the current state port and calls onEnter on the new state.
   *
   * @param state - The new machine state to transition to
   */
  async transitionTo(state: FSMContextState<TSelf>) {
    this.ensureInitialized();
    this._currentState.set(state);
    await state.onEnter?.(this as unknown as TSelf);
  }
}
