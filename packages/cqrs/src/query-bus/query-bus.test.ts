import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryBus } from "./query-bus";
import {
  type QueryBusMonitoringPortInterface,
  type QueryHandlerInterface,
  type QueryResult,
} from "./types";
import { Query } from "./query";

interface UserProfileReadModel {
  id: string;
  fullName: string;
  avatarUrl: string;
  email: string;
  phone: string;
  lastActivity: Date;
}

export class GetUserProfileQuery extends Query<
  "GetUserProfileQuery",
  { userId: string },
  UserProfileReadModel | null
> {
  get type(): "GetUserProfileQuery" {
    return "GetUserProfileQuery";
  }
}

class GetUserProfileQueryHandler implements QueryHandlerInterface<GetUserProfileQuery> {
  constructor(private shouldFail: boolean = false) {}

  async handle(
    query: GetUserProfileQuery,
  ): Promise<QueryResult<GetUserProfileQuery>> {
    if (this.shouldFail) {
      throw new Error("Simulated Database Connection Error");
    }

    return {
      id: query.payload.userId,
      fullName: "Mario Rossi",
      avatarUrl: "http://example.com/avatar.jpg",
      email: "mario@rossi.it",
      phone: "3331234567",
      lastActivity: new Date(2025, 0, 1),
    };
  }
}

const mockMonitoringService: QueryBusMonitoringPortInterface = {
  trackInfrastructureError: vi.fn(),
  trackDomainError: vi.fn(),
  trackMetric: vi.fn(),
};

describe("QueryBus (Typed Dispatch and Monitoring)", () => {
  let queryBus: QueryBus;

  beforeEach(() => {
    queryBus = new QueryBus({ monitoringService: mockMonitoringService });
    vi.clearAllMocks();
  });

  it("should successfully dispatch query, return the correct type, and track a metric", async () => {
    const userId = "user-123";
    const handler = new GetUserProfileQueryHandler(false);
    queryBus.registerHandler(new GetUserProfileQuery({ userId }).type, handler);

    const query = new GetUserProfileQuery({ userId });
    const result = await queryBus.dispatch(query);

    expect(result).not.toBeNull();
    expect(result!.id).toBe(userId);
    expect(result!.fullName).toBe("Mario Rossi");

    expect(
      mockMonitoringService.trackInfrastructureError,
    ).not.toHaveBeenCalled();
  });

  it("should throw an error and track the failure when handler execution fails", async () => {
    const userId = "user-fail";
    const failingHandler = new GetUserProfileQueryHandler(true);
    queryBus.registerHandler(
      new GetUserProfileQuery({ userId }).type,
      failingHandler,
    );

    const query = new GetUserProfileQuery({ userId });

    await expect(queryBus.dispatch(query)).rejects.toThrow(
      "Query execution failed for GetUserProfileQuery",
    );

    expect(
      mockMonitoringService.trackInfrastructureError,
    ).toHaveBeenCalledTimes(1);
    expect(mockMonitoringService.trackInfrastructureError).toHaveBeenCalledWith(
      "QUERY_EXECUTION_FAILED",
      expect.objectContaining({
        queryType: "GetUserProfileQuery",
        queryId: query.id,
        error: "Simulated Database Connection Error",
      }),
    );
  });

  it("should throw an error and track HANDLER_NOT_FOUND when no handler is registered", async () => {
    const query = new GetUserProfileQuery({ userId: "missing" });

    await expect(queryBus.dispatch(query)).rejects.toThrow(
      "No handler registered for query type: GetUserProfileQuery",
    );

    expect(
      mockMonitoringService.trackInfrastructureError,
    ).toHaveBeenCalledTimes(1);
    expect(mockMonitoringService.trackInfrastructureError).toHaveBeenCalledWith(
      "HANDLER_NOT_FOUND",
      expect.objectContaining({
        queryType: "GetUserProfileQuery",
        queryId: query.id,
      }),
    );
  });
});
