"use client";

/**
 * Memento Tab
 * Shows memento history and undo/redo statistics
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, useEffect } from "react";
import { getDevToolsHook, InstanceType } from "../../core";
import { getMementoStats, type MementoStats } from "../../monitors";
import {
  colors,
  spacing,
  typography,
  borderRadius,
  transitions,
  dimensions,
} from "../theme";

export function MementoTab() {
  const [instances, setInstances] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [stats, setStats] = useState<MementoStats | null>(null);

  useEffect(() => {
    const update = () => {
      const hook = getDevToolsHook();
      const mementoInstances = [
        ...hook.getInstancesByType(InstanceType.MEMENTO_BASE_ORIGINATOR),
        ...hook.getInstancesByType(InstanceType.MEMENTO_DIFF_ORIGINATOR),
      ];
      setInstances(mementoInstances);

      if (selectedId) {
        setStats({ ...getMementoStats(selectedId) });
      }
    };

    update();

    // Subscribe to memento events for real-time updates
    const hook = getDevToolsHook();
    const unsubscribe = hook.on("memento_save" as any, () => {
      update();
    });

    // Also update periodically
    const interval = setInterval(update, 500);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [selectedId]);

  const selectedInstance = instances.find((inst) => inst.id === selectedId);
  const styles = getStyles();

  return (
    <div style={styles.container}>
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          Memento Instances ({instances.length})
        </div>
        <div style={styles.instanceList}>
          {instances.map((inst) => (
            <div
              key={inst.id}
              style={{
                ...styles.instanceItem,
                ...(selectedId === inst.id ? styles.instanceItemSelected : {}),
              }}
              onClick={() => setSelectedId(inst.id)}
            >
              <div>{inst.name}</div>
              <div style={styles.instanceType}>
                {inst.type === InstanceType.MEMENTO_DIFF_ORIGINATOR
                  ? "Diff"
                  : "Full"}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={styles.content}>
        {selectedInstance && stats ? (
          <>
            <h4 style={styles.title}>{selectedInstance.name}</h4>

            <div style={styles.metricsGrid}>
              <MetricCard label="Saves" value={stats.totalSaves} icon="💾" />
              <MetricCard
                label="Restores"
                value={stats.totalRestores}
                icon="↩️"
              />
              <MetricCard label="Undos" value={stats.totalUndos} icon="⬅️" />
              <MetricCard label="Redos" value={stats.totalRedos} icon="➡️" />
            </div>

            <div style={styles.section}>
              <h5 style={styles.sectionTitle}>Snapshot Performance</h5>
              <div style={styles.performanceCard}>
                <div style={styles.performanceItem}>
                  <span>Average Snapshot Size:</span>
                  <strong>{formatBytes(stats.averageSnapshotSize)}</strong>
                </div>
                <div style={styles.performanceItem}>
                  <span>Total Operations:</span>
                  <strong>
                    {stats.totalSaves +
                      stats.totalRestores +
                      stats.totalUndos +
                      stats.totalRedos}
                  </strong>
                </div>
              </div>
            </div>

            <div style={styles.info}>
              <h5 style={styles.sectionTitle}>About Memento Pattern</h5>
              <p style={styles.infoText}>
                The Memento pattern captures and restores object state without
                violating encapsulation. This instance uses{" "}
                <strong>
                  {selectedInstance.type ===
                  InstanceType.MEMENTO_DIFF_ORIGINATOR
                    ? "differential snapshots"
                    : "full snapshots"}
                </strong>
                .
              </p>
            </div>
          </>
        ) : (
          <div style={styles.emptyState}>Select a memento instance</div>
        )}
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: string;
}) {
  const styles = getStyles();
  return (
    <div style={styles.metricCard}>
      <div style={styles.metricIcon}>{icon}</div>
      <div style={styles.metricValue}>{value}</div>
      <div style={styles.metricLabel}>{label}</div>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * Get all styles for the Memento Tab
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

    instanceType: {
      fontSize: typography.fontSize.xs,
      color: colors.textSecondary,
      marginTop: spacing.gapXs,
    } as React.CSSProperties,

    content: {
      flex: 1,
      overflow: "auto",
      display: "flex",
      flexDirection: "column",
      gap: spacing.xl,
    } as React.CSSProperties,

    title: {
      margin: 0,
      fontSize: typography.fontSize.lg,
    } as React.CSSProperties,

    metricsGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
      gap: spacing.md,
    } as React.CSSProperties,

    metricCard: {
      padding: spacing.lg,
      backgroundColor: colors.bgSecondary,
      borderRadius: borderRadius.lg,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: spacing.gapSm,
    } as React.CSSProperties,

    metricIcon: {
      fontSize: dimensions.iconSizeLarge,
    } as React.CSSProperties,

    metricValue: {
      fontSize: dimensions.iconSizeMedium,
      fontWeight: typography.fontWeight.bold,
      color: colors.success,
    } as React.CSSProperties,

    metricLabel: {
      fontSize: typography.fontSize.xs,
      color: colors.textSecondary,
    } as React.CSSProperties,

    section: {} as React.CSSProperties,

    sectionTitle: {
      margin: `0 0 ${spacing.md} 0`,
      fontSize: typography.fontSize.md,
    } as React.CSSProperties,

    performanceCard: {
      padding: spacing.lg,
      backgroundColor: colors.bgSecondary,
      borderRadius: borderRadius.md,
      display: "flex",
      flexDirection: "column",
      gap: spacing.md,
    } as React.CSSProperties,

    performanceItem: {
      display: "flex",
      justifyContent: "space-between",
      fontSize: typography.fontSize.base,
    } as React.CSSProperties,

    info: {
      padding: spacing.lg,
      backgroundColor: colors.bgSecondary,
      borderRadius: borderRadius.md,
      borderLeft: `${dimensions.borderWidthThicker} solid ${colors.accent}`,
    } as React.CSSProperties,

    infoText: {
      margin: 0,
      fontSize: typography.fontSize.base,
      lineHeight: 1.5,
      color: colors.textPrimary,
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
