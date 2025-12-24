export interface MonitoringPortInterface {
  trackInfrastructureError(source: string, error: unknown): void;
  trackDomainError(source: string, error: unknown): void;
}
