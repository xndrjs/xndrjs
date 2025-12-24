import { EventBus, CommandBus, QueryBus } from "@xndrjs/cqrs";

/**
 * Global messaging infrastructure instances shared across all components.
 * Instantiated outside React components to ensure they're singletons.
 */

export const eventBus = new EventBus();
export const commandBus = new CommandBus();
export const queryBus = new QueryBus();
