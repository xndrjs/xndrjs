import {
  type UntypedQueryType,
  type QueryHandlerInterface,
  type QueryBusInterface,
  type QueryResult,
  type QueryBusMonitoringPortInterface,
} from "./types";

export interface QueryBusConstructorProps {
  monitoringService?: QueryBusMonitoringPortInterface;
}

export class QueryBus implements QueryBusInterface {
  private handlers = new Map<string, QueryHandlerInterface<UntypedQueryType>>();
  private monitoringService: QueryBusMonitoringPortInterface | null;

  constructor(props: QueryBusConstructorProps = {}) {
    const { monitoringService } = props;
    this.monitoringService = monitoringService ?? null;
  }

  public registerHandler<T extends UntypedQueryType>(
    queryType: T["type"],
    handler: QueryHandlerInterface<T>,
  ): void {
    if (this.handlers.has(queryType)) {
      console.warn(
        `Handler for query type ${queryType} is already registered. Overwriting.`,
      );
    }
    this.handlers.set(
      queryType,
      handler as QueryHandlerInterface<UntypedQueryType>,
    );
  }

  public async dispatch<TQuery extends UntypedQueryType>(
    query: TQuery,
  ): Promise<QueryResult<TQuery>> {
    const handler = this.handlers.get(query.type);

    if (!handler) {
      const errorMessage = `No handler registered for query type: ${query.type}`;
      this.monitoringService?.trackInfrastructureError("HANDLER_NOT_FOUND", {
        queryType: query.type,
        queryId: query.id,
        message: errorMessage,
      });

      throw new Error(errorMessage);
    }

    try {
      const startTime = performance.now();
      const result = (await handler.handle(query)) as QueryResult<TQuery>;
      const durationMs = performance.now() - startTime;
      this.monitoringService?.trackMetric("QUERY_EXECUTION_TIME", durationMs, {
        queryType: query.type,
        queryId: query.id,
      });
      return result;
    } catch (error) {
      const errorMessage = `Query execution failed for ${query.type}`;
      const errorDetails = {
        queryType: query.type,
        queryId: query.id,
        error: error instanceof Error ? error.message : String(error),
      };
      this.monitoringService?.trackInfrastructureError(
        "QUERY_EXECUTION_FAILED",
        errorDetails,
      );
      type ErrorWithCause = Error & { cause?: unknown };
      const err: ErrorWithCause = new Error(errorMessage);
      err.cause = errorDetails;
      throw err;
    }
  }
}
