/**
 * DevTools UI Types
 */

export interface DevToolsPanelProps {
  defaultTab?: "instances" | "timeline" | "messaging" | "fsm" | "memento";
  position?: "top" | "bottom" | "left" | "right";
  height?: number;
  collapsed?: boolean;
}
