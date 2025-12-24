import { CommandBus, EventBus, QueryBus } from "@xndrjs/cqrs";

// Global messaging infrastructure instances shared across all components.
export const eventBus = new EventBus();
export const commandBus = new CommandBus();
export const queryBus = new QueryBus();
