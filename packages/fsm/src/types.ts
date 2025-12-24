export type FSMStateConfig<TName extends PropertyKey, TPayload> = Record<
  TName,
  TPayload
>;

/**
 * Symbol used for type inference of TConfig in FSMContextManager.
 * This symbol is used internally by type helpers and should not be accessed directly.
 * It does not appear in normal autocomplete, keeping the API clean.
 */
export const CONFIG_TYPE = Symbol("_configType");

/**
 * Extract the config type from a context manager type
 * by looking at the CONFIG_TYPE Symbol property.
 */
export type ExtractConfigFromContext<T> = T extends {
  [CONFIG_TYPE]?: infer TConfig;
}
  ? TConfig
  : never;

export type FSMState<
  TContext extends FSMContext<FSMStateConfig<PropertyKey, unknown>>,
  TName extends keyof ExtractConfigFromContext<TContext>,
> = {
  name: TName;
  isFinal: boolean;
  handleNext(
    context: TContext,
    payload: ExtractConfigFromContext<TContext>[TName],
  ): Promise<void>;
  onEnter?(context: TContext): Promise<void>;
};

export type FSMContextState<
  TContext extends FSMContext<FSMStateConfig<PropertyKey, unknown>>,
> = FSMState<TContext, keyof ExtractConfigFromContext<TContext>>;

export type FSMContext<TConfig extends FSMStateConfig<PropertyKey, unknown>> = {
  dispatch<T extends keyof TConfig>(payload: TConfig[T]): Promise<void>;
  transitionTo(state: FSMContextState<FSMContext<TConfig>>): Promise<void>;
};
