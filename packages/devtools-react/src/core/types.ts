/**
 * DevTools Core Types
 * Defines all types used across the DevTools system
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Unique identifier for tracked instances
 */
export type InstanceId = string;

/**
 * Timestamp in milliseconds
 */
export type Timestamp = number;

/**
 * Serializable metadata type for DevTools.
 * Similar to PlainObject but excludes bigint and symbol which are not JSON-serializable
 * and cannot be rendered as ReactNode.
 */
export type SerializableMetadata =
  | string
  | number
  | boolean
  | null
  | SerializableMetadata[]
  | { [key: string]: SerializableMetadata };

/**
 * Types of instances that can be tracked
 */
export enum InstanceType {
  // Reactive types
  REACTIVE_VALUE = "reactive_value",
  REACTIVE_OBJECT = "reactive_object",
  REACTIVE_ARRAY = "reactive_array",
  REACTIVE_SET = "reactive_set",
  REACTIVE_MAP = "reactive_map",
  COMPUTED_VALUE = "computed_value",

  // Bus types
  EVENT_BUS = "event_bus",
  COMMAND_BUS = "command_bus",
  QUERY_BUS = "query_bus",

  // Pattern types
  MEMENTO_BASE_ORIGINATOR = "memento_base_originator",
  MEMENTO_DIFF_ORIGINATOR = "memento_diff_originator",
  FSM_CONTEXT_MANAGER = "fsm_context_manager",
}

/**
 * Tracked instance metadata
 */
export interface TrackedInstance {
  id: InstanceId;
  type: InstanceType;
  name: string;
  instance: any;
  createdAt: Timestamp;
  metadata?: SerializableMetadata;
}

/**
 * Event types emitted by DevTools
 */
export enum DevToolsEventType {
  // Instance lifecycle
  INSTANCE_CREATED = "instance_created",
  INSTANCE_DESTROYED = "instance_destroyed",

  // ReactiveValue events
  REACTIVE_VALUE_CHANGE = "reactive_value_change",
  REACTIVE_VALUE_SUBSCRIBE = "reactive_value_subscribe",
  REACTIVE_VALUE_UNSUBSCRIBE = "reactive_value_unsubscribe",

  // ReactiveObject events
  REACTIVE_OBJECT_UPDATE = "reactive_object_update",
  REACTIVE_OBJECT_PROPERTY_CHANGE = "reactive_object_property_change",

  // ComputedValue events
  COMPUTED_VALUE_RECOMPUTE = "computed_value_recompute",
  COMPUTED_VALUE_MEMO_HIT = "computed_value_memo_hit",
  COMPUTED_VALUE_MEMO_MISS = "computed_value_memo_miss",

  // Batching events (legacy)
  BATCH_START = "batch_start",
  BATCH_END = "batch_end",

  // Event Bus events
  EVENT_PUBLISHED = "event_published",
  EVENT_HANDLED = "event_handled",
  EVENT_HANDLER_ERROR = "event_handler_error",

  // Command Bus events
  COMMAND_DISPATCHED = "command_dispatched",
  COMMAND_HANDLED = "command_handled",
  COMMAND_ERROR = "command_error",

  // Query Bus events
  QUERY_DISPATCHED = "query_dispatched",
  QUERY_HANDLED = "query_handled",
  QUERY_ERROR = "query_error",

  // Memento events
  MEMENTO_SAVE = "memento_save",
  MEMENTO_RESTORE = "memento_restore",
  MEMENTO_UNDO = "memento_undo",
  MEMENTO_REDO = "memento_redo",

  // FSM events
  FSM_TRANSITION = "fsm_transition",
  FSM_STATE_ENTER = "fsm_state_enter",
}

/**
 * Base event structure
 */
export interface DevToolsEvent<T = any> {
  type: DevToolsEventType;
  instanceId: InstanceId;
  timestamp: Timestamp;
  data: T;
}

/**
 * ReactiveValue change event
 */
export interface ReactiveValueChangeEvent {
  newValue: any;
  prevValue: any;
  snapshot?: any;
  batchId?: string;
}

/**
 * ReactiveValue subscribe/unsubscribe event
 */
export interface ReactiveValueSubscriptionEvent {
  subscriberCount?: number;
  isDevToolsSubscription?: boolean;
}

/**
 * ReactiveObject update event
 */
export interface ReactiveObjectUpdateEvent {
  changedKeys?: string[];
  snapshot?: any;
}

/**
 * ComputedValue recompute event
 */
export interface ComputedValueRecomputeEvent {
  dependencies: string[];
  memoHit: boolean;
  duration?: number;
}

/**
 * Legacy Batch event data
 */
export interface BatchEvent {
  batchId: string;
  notificationCount?: number;
}

/**
 * Event bus event data
 */
export interface EventBusEventData {
  eventName: string;
  eventData: any;
  handlerCount?: number;
  error?: any;
}

/**
 * Command bus event data
 */
export interface CommandBusEventData {
  commandName: string;
  commandData: any;
  result?: any;
  error?: any;
}

/**
 * Query bus event data
 */
export interface QueryBusEventData {
  queryName: string;
  queryData: any;
  result?: any;
  error?: any;
}

/**
 * Memento event data
 */
export interface MementoEventData {
  mementoId?: string;
  snapshotSize?: number;
  historyLength?: number;
}

/**
 * FSM event data
 */
export interface FSMEventData {
  fromState?: string;
  toState: string;
  trigger?: string;
}

/**
 * Dependency relationship
 */
export interface Dependency {
  sourceInstanceId: InstanceId;
  sourceKey?: string; // Key in scope, or property name
  targetInstanceId: InstanceId;
  targetKey?: string; // Key in scope, or property name
  dependencyType: "computed";
}

/**
 * Timeline entry for the timeline view
 */
export interface TimelineEntry {
  id: string;
  timestamp: Timestamp;
  instanceId: InstanceId;
  instanceName: string;
  eventType: DevToolsEventType;
  description: string;
  data: any;
}

/**
 * DevTools configuration
 */
export interface DevToolsConfig {
  enabled: boolean;
  maxTimelineEntries: number;
  maxHistoryPerInstance: number;
  captureSnapshots: boolean;
  logToConsole: boolean;
}

/**
 * DevTools store state
 */
export interface DevToolsState {
  instances: Map<InstanceId, TrackedInstance>;
  timeline: TimelineEntry[];
  dependencies: Dependency[];
  config: DevToolsConfig;
}
