"use client";

/**
 * Instances Tab
 * Shows all tracked instances with subscription information
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, useEffect } from "react";
import {
  getDevToolsHook,
  getDevToolsStore,
  type TrackedInstance,
  type Dependency,
  InstanceType,
} from "../../core";
import {
  detectCircularDependencies,
  getSubscriptionInfo,
} from "../../monitors";
import {
  colors,
  spacing,
  typography,
  borderRadius,
  transitions,
  dimensions,
} from "../theme";

export function InstancesTab() {
  const [instances, setInstances] = useState<TrackedInstance[]>([]);
  const [selectedInstance, setSelectedInstance] =
    useState<TrackedInstance | null>(null);

  useEffect(() => {
    const updateInstances = () => {
      setInstances(getDevToolsHook().getAllInstances());
    };

    updateInstances();

    const unsubscribe = getDevToolsStore().subscribe(() => {
      updateInstances();
    });

    // Subscribe to instance created/destroyed events for real-time updates
    const hook = getDevToolsHook();
    const unsubscribeCreated = hook.on("instance_created" as any, () => {
      updateInstances();
    });
    const unsubscribeDestroyed = hook.on("instance_destroyed" as any, () => {
      updateInstances();
    });

    return () => {
      unsubscribe();
      unsubscribeCreated();
      unsubscribeDestroyed();
    };
  }, []);

  const groupedInstances = instances.reduce(
    (acc, inst) => {
      if (!acc[inst.type]) {
        acc[inst.type] = [];
      }
      acc[inst.type]!.push(inst);
      return acc;
    },
    {} as Record<string, TrackedInstance[]>,
  );

  const styles = getStyles();

  return (
    <div style={styles.container}>
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <strong>Tracked Instances ({instances.length})</strong>
        </div>
        <div style={styles.instanceList}>
          {Object.entries(groupedInstances).map(([type, insts]) => (
            <div key={type} style={styles.instanceGroup}>
              <div style={styles.instanceGroupHeader}>
                {type} ({insts.length})
              </div>
              {insts.map((inst) => (
                <div
                  key={inst.id}
                  style={{
                    ...styles.instanceItem,
                    ...(selectedInstance?.id === inst.id
                      ? styles.instanceItemSelected
                      : {}),
                  }}
                  onClick={() => setSelectedInstance(inst)}
                >
                  {inst.name}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div style={styles.details}>
        {selectedInstance ? (
          <div>
            <h3 style={styles.detailsTitle}>{selectedInstance.name}</h3>
            <div style={styles.detailsContent}>
              <div style={styles.detailRow}>
                <strong>Type:</strong> {selectedInstance.type}
              </div>
              <div style={styles.detailRow}>
                <strong>ID:</strong>{" "}
                <code style={styles.code}>{selectedInstance.id}</code>
              </div>
              <div style={styles.detailRow}>
                <strong>Created:</strong>{" "}
                {new Date(selectedInstance.createdAt).toLocaleString()}
              </div>
              {selectedInstance.metadata && (
                <div style={styles.detailRow}>
                  <strong>Metadata:</strong>
                  <pre style={styles.pre}>
                    {JSON.stringify(selectedInstance.metadata, null, 2)}
                  </pre>
                </div>
              )}
              {renderSubscriptionInfo(selectedInstance, styles)}
              <div style={styles.detailRow}>
                <strong>Reactive Instance:</strong>
                <div style={styles.instancePreview}>
                  {renderReactiveInstancePreview(
                    selectedInstance.instance,
                    selectedInstance.type,
                    styles,
                  )}
                </div>
              </div>
              {renderDependencies(selectedInstance.id, styles)}
            </div>
          </div>
        ) : (
          <div style={styles.emptyState}>
            Select an instance to view details
          </div>
        )}
      </div>
    </div>
  );
}

function renderSubscriptionInfo(
  instance: TrackedInstance,
  styles: ReturnType<typeof getStyles>,
): React.ReactNode {
  // Check if instance is a ReactiveValue (or subclass)
  const value = instance.instance;
  if (
    value &&
    typeof value === "object" &&
    "_subscribers" in value &&
    value._subscribers instanceof Set
  ) {
    const subscriptionInfo = getSubscriptionInfo(value as any);

    return (
      <div style={styles.detailRow}>
        <div style={styles.subscriptionHeader}>
          <strong>Subscriptions</strong>
          {subscriptionInfo.hasDevToolsSubscription && (
            <span style={styles.devToolsBadge}>🔧 DevTools</span>
          )}
        </div>
        <div style={styles.subscriptionInfo}>
          <div style={styles.subscriptionItem}>
            <span>Total Subscribers: </span>
            <strong style={styles.subscriptionCount}>
              {subscriptionInfo.totalSubscribers}
            </strong>
          </div>
          {subscriptionInfo.hasDevToolsSubscription && (
            <div style={styles.subscriptionItem}>
              <span>DevTools Subscription:</span>
              <span style={styles.devToolsActive}>Active</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}

function renderReactiveInstancePreview(
  reactiveInstance: any,
  instanceType: InstanceType,
  styles: ReturnType<typeof getStyles>,
): React.ReactNode {
  try {
    const preview: Record<string, any> = {};

    // Handle FSM Context Manager
    if (instanceType === InstanceType.FSM_CONTEXT_MANAGER) {
      if (
        reactiveInstance &&
        typeof reactiveInstance === "object" &&
        "currentState" in reactiveInstance &&
        typeof reactiveInstance.currentState?.get === "function"
      ) {
        const currentState = reactiveInstance.currentState.get();
        preview.currentState =
          currentState?.constructor?.name || String(currentState);
      } else {
        preview.note = "FSM instance does not expose currentState";
      }
    }
    // Handle Memento Caretaker types (the instance is a caretaker, not an originator)
    else if (
      instanceType === InstanceType.MEMENTO_BASE_ORIGINATOR ||
      instanceType === InstanceType.MEMENTO_DIFF_ORIGINATOR
    ) {
      if (
        reactiveInstance &&
        typeof reactiveInstance === "object" &&
        "originator" in reactiveInstance &&
        "history" in reactiveInstance &&
        "historyPointer" in reactiveInstance
      ) {
        try {
          // The instance is a caretaker, access its properties
          const caretaker = reactiveInstance;

          // Get current memento from originator
          if (
            caretaker.originator &&
            typeof caretaker.originator.getMemento === "function"
          ) {
            preview.currentMemento = caretaker.originator.getMemento();
          }

          // Show history info
          if (typeof caretaker.history?.get === "function") {
            const history = caretaker.history.get();
            preview.historyLength = history?.length || 0;
            preview.currentHistory = history;
          }

          if (typeof caretaker.historyPointer?.get === "function") {
            preview.historyPointer = caretaker.historyPointer.get();
          }

          // Show canUndo/canRedo if available
          if (typeof caretaker.canUndo?.get === "function") {
            preview.canUndo = caretaker.canUndo.get();
          }

          if (typeof caretaker.canRedo?.get === "function") {
            preview.canRedo = caretaker.canRedo.get();
          }
        } catch (error) {
          preview.note = `Failed to get caretaker preview: ${String(error)}`;
        }
      } else {
        preview.note =
          "Memento caretaker instance does not expose expected properties";
      }
    }
    // Handle ReactiveValue and its subclasses (ReactiveObject, ComputedValue, ReactiveArray, etc.)
    else if (
      reactiveInstance &&
      typeof reactiveInstance === "object" &&
      typeof reactiveInstance.get === "function"
    ) {
      const value = reactiveInstance.get();

      // For ReactiveObject, show the object properties
      if (
        instanceType === InstanceType.REACTIVE_OBJECT &&
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
      ) {
        preview.value = value;
      }
      // For primitives, show directly
      else if (
        value === null ||
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean" ||
        typeof value === "undefined"
      ) {
        preview.value = value;
      }
      // For arrays, show the array
      else if (Array.isArray(value)) {
        preview.value = value;
        preview.length = value.length;
      }
      // For other objects, show type info
      else {
        preview.value = `[${value.constructor?.name || "Object"}]`;
        preview.valueType = typeof value;
      }

      // For ComputedValue, show dependencies if available
      if (
        instanceType === InstanceType.COMPUTED_VALUE &&
        "dependencies" in reactiveInstance &&
        Array.isArray(reactiveInstance.dependencies)
      ) {
        preview.dependencies = reactiveInstance.dependencies.map(
          (dep: any, i: number) => ({
            index: i,
            type: dep.constructor?.name || typeof dep,
          }),
        );
      }
    } else {
      // Fallback for other types
      preview.note = "Preview not available for this instance type";
    }

    return <pre style={styles.pre}>{JSON.stringify(preview, null, 2)}</pre>;
  } catch (error) {
    return (
      <div style={styles.error}>
        Failed to preview reactive instance: {String(error)}
      </div>
    );
  }
}

function renderDependencies(
  instanceId: string,
  styles: ReturnType<typeof getStyles>,
): React.ReactNode {
  const store = getDevToolsStore();
  const dependencies = store
    .getDependencies()
    .filter((dep) => dep.targetInstanceId === instanceId);

  if (dependencies.length === 0) {
    return null;
  }

  // Check for circular dependencies
  const cycles = detectCircularDependencies();
  const hasCircular =
    cycles.length > 0 &&
    cycles.some((cycle) =>
      cycle.some((dep) => dep.targetInstanceId === instanceId),
    );

  const hook = getDevToolsHook();

  return (
    <div style={styles.detailRow}>
      <div style={styles.dependenciesHeader}>
        <strong>Dependencies ({dependencies.length})</strong>

        {/* Circular dependency indicator */}
        {hasCircular ? (
          <div style={styles.circularBadgeWarning}>⚠️ Circular deps</div>
        ) : (
          <div style={styles.circularBadgeOk}>✅ No circular deps</div>
        )}
      </div>

      {/* Show cycle details if circular */}
      {hasCircular && (
        <div style={styles.circularDetails}>
          {cycles
            .filter((cycle) =>
              cycle.some((dep) => dep.targetInstanceId === instanceId),
            )
            .map((cycle, i) => {
              const sourceNames = cycle.map((dep) => {
                const inst = hook.getInstance(dep.sourceInstanceId);
                return inst?.name || dep.sourceInstanceId;
              });
              const targetNames = cycle.map((dep) => {
                const inst = hook.getInstance(dep.targetInstanceId);
                return inst?.name || dep.targetInstanceId;
              });
              return (
                <div key={i} style={styles.circularCycle}>
                  {sourceNames.join(" → ")} → {targetNames[0]}
                </div>
              );
            })}
        </div>
      )}

      <div style={styles.dependenciesList}>
        {dependencies.map((dep: Dependency, i) => {
          const sourceInstance = hook.getInstance(dep.sourceInstanceId);
          const targetInstance = hook.getInstance(dep.targetInstanceId);
          return (
            <div key={i} style={styles.dependencyItem}>
              <div style={styles.dependencySource}>
                <code style={styles.code}>
                  {sourceInstance?.name || dep.sourceInstanceId}
                  {dep.sourceKey ? `.${dep.sourceKey}` : ""}
                </code>
              </div>
              <span style={styles.arrow}>
                {dep.dependencyType === "computed"
                  ? "→ computes →"
                  : dep.dependencyType === "reference"
                    ? "→ references →"
                    : "→"}
              </span>
              <div style={styles.dependencyTarget}>
                <code style={styles.code}>
                  {targetInstance?.name || dep.targetInstanceId}
                  {dep.targetKey ? `.${dep.targetKey}` : ""}
                </code>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Get all styles for the Instances Tab
 * Organized by component section for clarity
 */
function getStyles() {
  return {
    // Layout
    container: {
      display: "flex",
      gap: spacing.lg,
      height: "100%",
      padding: spacing.lg,
    } as React.CSSProperties,

    // Sidebar
    sidebar: {
      width: dimensions.sidebarWidth,
      borderRight: `${dimensions.borderWidth} solid ${colors.border}`,
      display: "flex",
      flexDirection: "column",
    } as React.CSSProperties,

    sidebarHeader: {
      padding: `${spacing.sm} ${spacing.md}`,
      backgroundColor: colors.bgSecondary,
      borderBottom: `1px solid ${colors.border}`,
      fontSize: typography.fontSize.base,
    } as React.CSSProperties,

    instanceList: {
      flex: 1,
      overflow: "auto",
    } as React.CSSProperties,

    instanceGroup: {
      marginBottom: spacing.sm,
    } as React.CSSProperties,

    instanceGroupHeader: {
      padding: `${spacing.gapSm} ${spacing.md}`,
      backgroundColor: colors.bgSecondary,
      fontSize: typography.fontSize.xs,
      fontWeight: typography.fontWeight.semibold,
      textTransform: "uppercase",
      color: colors.textSecondary,
    } as React.CSSProperties,

    instanceItem: {
      padding: `${spacing.gapSm} ${spacing.md}`,
      cursor: "pointer",
      fontSize: typography.fontSize.base,
      borderLeftWidth: dimensions.borderWidthThick,
      borderLeftStyle: "solid",
      borderLeftColor: "transparent",
      transition: `all ${transitions.base}`,
    } as React.CSSProperties,

    instanceItemSelected: {
      backgroundColor: colors.bgActive,
      borderLeftColor: colors.accent,
    } as React.CSSProperties,

    // Details panel
    details: {
      flex: 1,
      overflow: "auto",
    } as React.CSSProperties,

    detailsTitle: {
      margin: `0 0 ${spacing.lg} 0`,
      fontSize: typography.fontSize.lg,
      fontWeight: typography.fontWeight.semibold,
    } as React.CSSProperties,

    detailsContent: {
      display: "flex",
      flexDirection: "column",
      gap: spacing.md,
    } as React.CSSProperties,

    detailRow: {
      fontSize: typography.fontSize.base,
    } as React.CSSProperties,

    // Code elements
    code: {
      backgroundColor: colors.bgSecondary,
      padding: `${spacing.gapXs} ${spacing.gapSm}`,
      borderRadius: borderRadius.sm,
      fontSize: typography.fontSize.sm,
      fontFamily: typography.fontFamilyMono,
    } as React.CSSProperties,

    pre: {
      backgroundColor: colors.bgSecondary,
      padding: spacing.sm,
      borderRadius: borderRadius.sm,
      fontSize: typography.fontSize.sm,
      fontFamily: typography.fontFamilyMono,
      overflow: "auto",
      margin: `${spacing.sm} 0 0 0`,
    } as React.CSSProperties,

    instancePreview: {
      marginTop: spacing.sm,
    } as React.CSSProperties,

    emptyState: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      height: "100%",
      color: colors.textSecondary,
      fontSize: typography.fontSize.md,
    } as React.CSSProperties,

    error: {
      color: colors.error,
      fontSize: typography.fontSize.base,
    } as React.CSSProperties,

    // Subscription info
    subscriptionHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: spacing.sm,
    } as React.CSSProperties,

    devToolsBadge: {
      padding: `4px ${spacing.sm}`,
      backgroundColor: colors.badgeSuccessBg,
      borderRadius: borderRadius.sm,
      fontSize: typography.fontSize.xs,
      color: colors.success,
      fontWeight: typography.fontWeight.semibold,
    } as React.CSSProperties,

    subscriptionInfo: {
      display: "flex",
      flexDirection: "column",
      gap: spacing.sm,
      padding: `${spacing.sm} ${spacing.md}`,
      backgroundColor: colors.bgSecondary,
      borderRadius: borderRadius.sm,
    } as React.CSSProperties,

    subscriptionItem: {
      display: "flex",
      justifyContent: "flex-start",
      alignItems: "center",
      gap: spacing.xs,
      fontSize: typography.fontSize.base,
    } as React.CSSProperties,

    subscriptionCount: {
      color: colors.success,
      fontSize: typography.fontSize.md,
    } as React.CSSProperties,

    devToolsActive: {
      color: colors.success,
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.semibold,
    } as React.CSSProperties,

    // Dependencies
    dependenciesHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: spacing.sm,
    } as React.CSSProperties,

    dependenciesList: {
      display: "flex",
      flexDirection: "column",
      gap: spacing.sm,
      marginTop: spacing.sm,
    } as React.CSSProperties,

    dependencyItem: {
      padding: `${spacing.sm} ${spacing.md}`,
      backgroundColor: colors.bgSecondary,
      borderRadius: borderRadius.sm,
      fontSize: typography.fontSize.base,
      display: "flex",
      alignItems: "center",
      gap: spacing.md,
    } as React.CSSProperties,

    dependencySource: {
      flex: 1,
    } as React.CSSProperties,

    dependencyTarget: {
      flex: 1,
    } as React.CSSProperties,

    arrow: {
      color: colors.textSecondary,
      fontSize: typography.fontSize.lg,
    } as React.CSSProperties,

    // Circular dependency badges
    circularBadgeWarning: {
      padding: `4px ${spacing.sm}`,
      backgroundColor: colors.badgeWarningBg,
      borderRadius: borderRadius.sm,
      fontSize: typography.fontSize.xs,
      color: colors.error,
      fontWeight: typography.fontWeight.semibold,
    } as React.CSSProperties,

    circularBadgeOk: {
      padding: `4px ${spacing.sm}`,
      backgroundColor: colors.badgeSuccessBg,
      borderRadius: borderRadius.sm,
      fontSize: typography.fontSize.xs,
      color: colors.success,
      fontWeight: typography.fontWeight.semibold,
    } as React.CSSProperties,

    circularDetails: {
      marginBottom: spacing.sm,
      padding: spacing.sm,
      backgroundColor: colors.badgeWarningBg,
      borderLeft: `3px solid ${colors.error}`,
      borderRadius: borderRadius.sm,
    } as React.CSSProperties,

    circularCycle: {
      fontFamily: typography.fontFamilyMono,
      fontSize: typography.fontSize.xs,
      color: colors.warning,
      marginTop: spacing.gapXs,
    } as React.CSSProperties,
  };
}
