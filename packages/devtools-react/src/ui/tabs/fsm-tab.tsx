"use client";

/**
 * FSM Tab
 * Shows state machine transitions
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, useEffect } from "react";
import { getDevToolsHook, InstanceType } from "../../core";
import {
  getFSMHistory,
  getCurrentState,
  getFSMStats,
  type FSMTransition,
} from "../../monitors";
import {
  colors,
  spacing,
  typography,
  borderRadius,
  transitions,
  dimensions,
} from "../theme";
import { formatTimestamp } from "../utils";

export function FSMTab() {
  const [fsmInstances, setFsmInstances] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [history, setHistory] = useState<FSMTransition[]>([]);

  useEffect(() => {
    const update = () => {
      const instances = getDevToolsHook().getInstancesByType(
        InstanceType.FSM_CONTEXT_MANAGER,
      );
      setFsmInstances(instances);

      if (selectedId) {
        setHistory([...getFSMHistory(selectedId)].reverse());
      }
    };

    update();

    // Subscribe to store changes for real-time updates
    const hook = getDevToolsHook();
    const unsubscribe = hook.on("fsm_transition" as any, () => {
      update();
    });

    // Also update periodically to catch state changes
    const interval = setInterval(update, 500);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [selectedId]);

  const selectedInstance = fsmInstances.find((inst) => inst.id === selectedId);
  const currentState = selectedId ? getCurrentState(selectedId) : null;
  const stats = selectedId ? getFSMStats(selectedId) : null;
  const styles = getStyles();

  return (
    <div style={styles.container}>
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          FSM Instances ({fsmInstances.length})
        </div>
        <div style={styles.instanceList}>
          {fsmInstances.map((inst) => (
            <div
              key={inst.id}
              style={{
                ...styles.instanceItem,
                ...(selectedId === inst.id ? styles.instanceItemSelected : {}),
              }}
              onClick={() => setSelectedId(inst.id)}
            >
              {inst.name}
            </div>
          ))}
        </div>
      </div>

      <div style={styles.content}>
        {selectedInstance ? (
          <>
            <div style={styles.header}>
              <h4 style={styles.title}>{selectedInstance.name}</h4>

              <div style={styles.badges}>
                {stats && (
                  <>
                    <div style={styles.badge}>
                      <strong>{stats.totalTransitions}</strong>&nbsp;
                      {`transition${stats.totalTransitions > 1 ? "s" : ""}`}
                    </div>
                    <div style={styles.badge}>
                      <strong>{stats.uniqueStates}</strong>&nbsp;
                      {`visited state${stats.uniqueStates > 1 ? "s" : ""}`}
                    </div>
                  </>
                )}

                {currentState && (
                  <div style={styles.currentStateBadge}>
                    Current: <strong>{currentState}</strong>
                  </div>
                )}
              </div>
            </div>

            <div style={styles.historySection}>
              <h5 style={styles.sectionTitle}>Transition History</h5>
              {history.length === 0 ? (
                <div style={styles.emptyState}>No transitions yet</div>
              ) : (
                <div style={styles.historyList}>
                  {history.map((transition, i) => (
                    <div key={i} style={styles.historyItem}>
                      <span style={styles.historyTime}>
                        {formatTimestamp(new Date(transition.timestamp))}
                      </span>
                      <span style={styles.historyFrom}>
                        {transition.fromState}
                      </span>
                      <span style={styles.historyArrow}>→</span>
                      <span style={styles.historyTo}>{transition.toState}</span>
                      {transition.trigger && (
                        <span style={styles.historyTrigger}>
                          ({transition.trigger})
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div style={styles.emptyState}>Select an FSM instance</div>
        )}
      </div>
    </div>
  );
}

/**
 * Get all styles for the FSM Tab
 */
function getStyles() {
  return {
    container: {
      display: "flex",
      gap: spacing.lg,
      height: "100%",
      padding: spacing.lg,
    } as React.CSSProperties,

    sidebar: {
      width: dimensions.sidebarWidthNarrow,
      borderRight: `${dimensions.borderWidth} solid ${colors.border}`,
      display: "flex",
      flexDirection: "column",
    } as React.CSSProperties,

    sidebarHeader: {
      padding: `${spacing.sm} ${spacing.md}`,
      backgroundColor: colors.bgSecondary,
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.semibold,
    } as React.CSSProperties,

    instanceList: {
      flex: 1,
      overflow: "auto",
    } as React.CSSProperties,

    instanceItem: {
      padding: `${spacing.sm} ${spacing.md}`,
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

    content: {
      flex: 1,
      overflow: "auto",
    } as React.CSSProperties,

    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: spacing.lg,
    } as React.CSSProperties,

    title: {
      margin: 0,
      fontSize: typography.fontSize.lg,
    } as React.CSSProperties,

    badges: {
      display: "flex",
      gap: spacing.md,
    } as React.CSSProperties,

    badge: {
      padding: `6px ${spacing.md}`,
      backgroundColor: colors.bgSecondary,
      color: colors.textPrimary,
      borderRadius: borderRadius.md,
      fontSize: typography.fontSize.base,
    } as React.CSSProperties,

    currentStateBadge: {
      padding: `6px ${spacing.md}`,
      backgroundColor: colors.success,
      color: colors.accentText,
      borderRadius: borderRadius.md,
      fontSize: typography.fontSize.base,
    } as React.CSSProperties,

    historySection: {} as React.CSSProperties,

    sectionTitle: {
      margin: `0 0 ${spacing.md} 0`,
      fontSize: typography.fontSize.md,
    } as React.CSSProperties,

    historyList: {
      display: "flex",
      flexDirection: "column",
      gap: spacing.gapSm,
    } as React.CSSProperties,

    historyItem: {
      padding: `${spacing.sm} ${spacing.md}`,
      backgroundColor: colors.bgSecondary,
      borderRadius: borderRadius.sm,
      fontSize: typography.fontSize.base,
      display: "flex",
      alignItems: "center",
      gap: spacing.md,
    } as React.CSSProperties,

    historyTime: {
      color: colors.textSecondary,
      fontSize: typography.fontSize.xs,
      fontFamily: typography.fontFamilyMono,
    } as React.CSSProperties,

    historyFrom: {
      color: colors.warning,
    } as React.CSSProperties,

    historyArrow: {
      color: colors.info,
    } as React.CSSProperties,

    historyTo: {
      color: colors.success,
    } as React.CSSProperties,

    historyTrigger: {
      color: colors.textSecondary,
      fontSize: typography.fontSize.sm,
    } as React.CSSProperties,

    emptyState: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      height: "100%",
      color: colors.textSecondary,
    } as React.CSSProperties,
  };
}
