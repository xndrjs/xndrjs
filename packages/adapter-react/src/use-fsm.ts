import { useEffect } from "react";
import type { FSMContextManager } from "@xndrjs/fsm";

/**
 * Hook to automatically initialize an FSM context manager.
 * Calls `fsm.initialize()` when the component mounts.
 *
 * Since `initialize()` is idempotent, this hook can be safely used
 * with shared FSM instances across multiple components.
 *
 * @param fsm - The FSM context manager to initialize
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const fsm = useMemo(() => new MyFSM(currentStatePort), []);
 *
 *   // Automatically initialize the FSM
 *   useFSM(fsm);
 *
 *   // Component is reactive to machine state changes
 *   const currentState = useStatePort(fsm.currentState);
 *
 *   return <div>Current state: {currentState.name}</div>;
 * }
 * ```
 */
export function useFSM<TConfig extends Record<PropertyKey, unknown>>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fsm: FSMContextManager<TConfig, any> | null | undefined,
): void {
  useEffect(() => {
    if (!fsm) return;
    void fsm.initialize();
  }, [fsm]);
}
