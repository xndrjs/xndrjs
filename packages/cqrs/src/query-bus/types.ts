import type { MonitoringPortInterface } from "../common";

/**
 * Symbol used for type inference of TResult in Query and QueryInterface.
 * This symbol is used internally by type helpers and should not be accessed directly.
 * It does not appear in normal autocomplete, keeping the API clean.
 */
export const RESULT_TYPE = Symbol("__resultType");

export interface QueryInterface<TType extends string, TPayload, TResult> {
  id: string;
  timestamp: Date;
  type: TType;
  payload: TPayload;
  /**
   * Symbol property for type inference only.
   * Used by type helpers to infer TResult.
   * Never actually used at runtime. Does not appear in autocomplete.
   */
  readonly [RESULT_TYPE]?: TResult;
}

export type UntypedQueryType = QueryInterface<string, unknown, unknown>;

export interface QueryHandlerInterface<TQuery extends UntypedQueryType> {
  handle(query: TQuery): Promise<QueryResult<TQuery>>;
}

export interface QueryBusInterface {
  registerHandler<T extends UntypedQueryType>(
    queryType: T["type"],
    handler: QueryHandlerInterface<T>,
  ): void;

  dispatch<TQuery extends UntypedQueryType>(
    query: TQuery,
  ): Promise<QueryResult<TQuery>>;
}

/**
 * Extract the result type from a Query type.
 * Uses the RESULT_TYPE Symbol property for type inference.
 */
export type QueryResult<TQuery> =
  TQuery extends QueryInterface<string, unknown, infer U> ? U : never;

export type QueryRegistration<T extends UntypedQueryType> = {
  handler: QueryHandlerInterface<T>;
  resultType?: QueryResult<T>;
};

export interface QueryBusMonitoringPortInterface extends MonitoringPortInterface {
  trackMetric(
    name: string,
    value: number,
    properties?: Record<string, unknown>,
  ): void;
}

export type QueryConstructorOptions = Partial<
  Pick<UntypedQueryType, "id" | "timestamp">
>;
