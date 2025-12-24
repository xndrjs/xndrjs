import type { QueryConstructorOptions, QueryInterface } from "./types";
import { RESULT_TYPE } from "./types";

export abstract class Query<
  TType extends string,
  TPayload,
  TResult,
> implements QueryInterface<TType, TPayload, TResult> {
  id: string;
  timestamp: Date;
  payload: TPayload;
  abstract get type(): TType;
  /**
   * Symbol property for type inference only.
   * Used by type helpers to infer TResult.
   * Never actually used at runtime. Does not appear in autocomplete.
   */
  readonly [RESULT_TYPE]!: TResult;

  constructor(payload: TPayload, options?: QueryConstructorOptions) {
    this.id = options?.id ?? crypto.randomUUID();
    this.timestamp = options?.timestamp ?? new Date();
    this.payload = payload;
  }
}
