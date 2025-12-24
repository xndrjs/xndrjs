"use client";

/**
 * Timeline Tab
 * Shows event timeline with support for new reactive events
 */

import React, { useState, useEffect } from "react";
import {
  getDevToolsStore,
  DevToolsEventType,
  type TimelineEntry,
  type ReactiveValueChangeEvent,
  type ReactiveValueSubscriptionEvent,
  type BatchEvent,
} from "../../core";
import {
  colors,
  spacing,
  typography,
  borderRadius,
  dimensions,
} from "../theme";
import { formatTimestamp } from "../utils";

export function TimelineTab() {
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [filter, setFilter] = useState("");
  const [isPaused, setIsPaused] = useState(false);
  const [showDevToolsSubscriptions, setShowDevToolsSubscriptions] =
    useState(false);

  useEffect(() => {
    const updateTimeline = () => {
      if (!isPaused) {
        setTimeline([...getDevToolsStore().getTimeline()]);
      }
    };

    updateTimeline();

    const unsubscribe = getDevToolsStore().subscribe(() => {
      updateTimeline();
    });

    return unsubscribe;
  }, [isPaused]);

  const filteredTimeline = timeline.filter((entry) => {
    // Filter by search text
    if (filter) {
      const matchesFilter =
        entry.description.toLowerCase().includes(filter.toLowerCase()) ||
        entry.instanceName.toLowerCase().includes(filter.toLowerCase()) ||
        entry.eventType.toLowerCase().includes(filter.toLowerCase());
      if (!matchesFilter) return false;
    }

    // Filter DevTools subscriptions if toggle is off
    if (!showDevToolsSubscriptions) {
      const isDevToolsSubscription =
        (entry.eventType === DevToolsEventType.REACTIVE_VALUE_SUBSCRIBE ||
          entry.eventType === DevToolsEventType.REACTIVE_VALUE_UNSUBSCRIBE) &&
        (entry.data as ReactiveValueSubscriptionEvent)?.isDevToolsSubscription;
      if (isDevToolsSubscription) return false;
    }

    return true;
  });

  // Group timeline entries by batch
  const groupedTimeline = groupByBatch(filteredTimeline);

  const clearTimeline = () => {
    getDevToolsStore().clearTimeline();
  };

  const styles = getStyles();

  return (
    <div style={styles.container}>
      <div style={styles.toolbar}>
        <input
          type="text"
          placeholder="Filter events..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={styles.filterInput}
        />
        <label style={styles.toggleLabel}>
          <input
            type="checkbox"
            checked={showDevToolsSubscriptions}
            onChange={(e) => setShowDevToolsSubscriptions(e.target.checked)}
            style={styles.checkbox}
          />
          <span style={styles.toggleText}>Show DevTools subscriptions</span>
        </label>
        <button onClick={() => setIsPaused(!isPaused)} style={styles.button}>
          {isPaused ? "▶️ Resume" : "⏸️ Pause"}
        </button>
        <button onClick={clearTimeline} style={styles.button}>
          🗑️ Clear
        </button>
        <span style={styles.count}>
          {filteredTimeline.length} / {timeline.length} events
        </span>
      </div>

      <div style={styles.timelineList}>
        {groupedTimeline.length === 0 ? (
          <div style={styles.emptyState}>
            {timeline.length === 0
              ? "No events yet"
              : "No events match the filter"}
          </div>
        ) : (
          groupedTimeline.map((item) =>
            item.type === "batch" ? (
              <BatchGroup key={item.batchId} batch={item} />
            ) : (
              <TimelineEntryItem key={item.entry.id} entry={item.entry} />
            ),
          )
        )}
      </div>
    </div>
  );
}

type TimelineItem =
  | { type: "entry"; entry: TimelineEntry }
  | { type: "batch"; batchId: string; entries: TimelineEntry[] };

function groupByBatch(timeline: TimelineEntry[]): TimelineItem[] {
  const result: TimelineItem[] = [];
  const batchMap = new Map<string, TimelineEntry[]>();

  // First pass: collect all entries by batchId
  for (const entry of timeline) {
    if (entry.eventType === DevToolsEventType.BATCH_START) {
      const batchData = entry.data as BatchEvent;
      const batch = batchMap.get(batchData.batchId);
      if (batch) {
        batch.unshift(entry);
      } else {
        batchMap.set(batchData.batchId, [entry]);
      }
    } else if (entry.eventType === DevToolsEventType.BATCH_END) {
      const batchData = entry.data as BatchEvent;
      const batch = batchMap.get(batchData.batchId);
      if (batch) {
        batch.push(entry);
      } else {
        batchMap.set(batchData.batchId, [entry]);
      }
    } else if (entry.eventType === DevToolsEventType.REACTIVE_VALUE_CHANGE) {
      const notifyData = entry.data as ReactiveValueChangeEvent;
      if (notifyData.batchId) {
        const batch = batchMap.get(notifyData.batchId);
        if (batch) {
          batch.push(entry);
        } else {
          batchMap.set(notifyData.batchId, [entry]);
        }
      } else {
        result.push({ type: "entry", entry });
      }
    } else {
      result.push({ type: "entry", entry });
    }
  }

  // Sort entries within each batch by timestamp
  for (const [, entries] of batchMap) {
    entries.sort((a, b) => a.timestamp - b.timestamp);
  }

  // Second pass: rebuild timeline with batches in correct order
  const processedBatches = new Set<string>();
  const finalResult: TimelineItem[] = [];

  for (const entry of timeline) {
    if (entry.eventType === DevToolsEventType.BATCH_START) {
      const batchData = entry.data as BatchEvent;
      if (!processedBatches.has(batchData.batchId)) {
        const batch = batchMap.get(batchData.batchId);
        if (batch && batch.length > 0) {
          finalResult.push({
            type: "batch",
            batchId: batchData.batchId,
            entries: batch,
          });
          processedBatches.add(batchData.batchId);
        }
      }
    } else if (entry.eventType === DevToolsEventType.REACTIVE_VALUE_CHANGE) {
      const notifyData = entry.data as ReactiveValueChangeEvent;
      if (notifyData.batchId) {
        if (!processedBatches.has(notifyData.batchId)) {
          const batch = batchMap.get(notifyData.batchId);
          if (batch && batch.length > 0) {
            finalResult.push({
              type: "batch",
              batchId: notifyData.batchId,
              entries: batch,
            });
            processedBatches.add(notifyData.batchId);
          }
        }
      } else {
        finalResult.push({ type: "entry", entry });
      }
    } else if (entry.eventType === DevToolsEventType.BATCH_END) {
      // Skip - already included in batch
    } else {
      finalResult.push({ type: "entry", entry });
    }
  }

  return finalResult;
}

function BatchGroup({
  batch,
}: {
  batch: { batchId: string; entries: TimelineEntry[] };
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const styles = getStyles();

  // Get batch start and end entries
  const batchStart = batch.entries.find(
    (e) => e.eventType === DevToolsEventType.BATCH_START,
  );
  const notifications = batch.entries.filter(
    (e) => e.eventType === DevToolsEventType.REACTIVE_VALUE_CHANGE,
  );

  if (!batchStart) return null;

  const time = new Date(batchStart.timestamp);
  const timeStr = formatTimestamp(time);
  const notificationCount = notifications.length;

  return (
    <div style={styles.batchGroup}>
      <div
        style={styles.batchHeader}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span style={styles.expandIcon}>{isExpanded ? "▼" : "▶"}</span>
        <span style={styles.timelineTime}>{timeStr}</span>
        <span style={styles.timelineInstance}>{batchStart.instanceName}</span>
        <span style={styles.batchIcon}>⚡</span>
        <span style={styles.batchLabel}>
          Batch ({notificationCount} notification
          {notificationCount !== 1 ? "s" : ""})
        </span>
      </div>

      {isExpanded && (
        <div style={styles.batchContent}>
          {notifications.map((entry) => (
            <TimelineEntryItem key={entry.id} entry={entry} nested />
          ))}
        </div>
      )}
    </div>
  );
}

function TimelineEntryItem({
  entry,
  nested = false,
}: {
  entry: TimelineEntry;
  nested?: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const styles = getStyles();

  const time = new Date(entry.timestamp);
  const timeStr = formatTimestamp(time);

  // Check if this is a DevTools subscription event
  const isDevToolsSubscription =
    (entry.eventType === DevToolsEventType.REACTIVE_VALUE_SUBSCRIBE ||
      entry.eventType === DevToolsEventType.REACTIVE_VALUE_UNSUBSCRIBE) &&
    (entry.data as ReactiveValueSubscriptionEvent)?.isDevToolsSubscription;

  return (
    <div
      style={{
        ...styles.timelineEntry,
        ...(nested ? styles.nestedEntry : {}),
        ...(isDevToolsSubscription ? styles.devToolsEntry : {}),
      }}
    >
      <div
        style={styles.timelineEntryHeader}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span style={styles.expandIcon}>{isExpanded ? "▼" : "▶"}</span>
        <span style={styles.timelineTime}>{timeStr}</span>
        <span style={styles.timelineInstance}>{entry.instanceName}</span>
        <span style={styles.timelineEvent}>{entry.eventType}</span>
        <span style={styles.timelineDescription}>{entry.description}</span>
        {isDevToolsSubscription && <span style={styles.devToolsLabel}>🔧</span>}
      </div>

      {isExpanded && (
        <div style={styles.timelineEntryDetails}>
          <pre style={styles.pre}>{JSON.stringify(entry.data, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

/**
 * Get all styles for the Timeline Tab
 * Organized by component section for clarity
 */
function getStyles() {
  return {
    // Layout
    container: {
      display: "flex",
      flexDirection: "column",
      height: "100%",
      gap: spacing.md,
      padding: spacing.lg,
    } as React.CSSProperties,

    // Toolbar
    toolbar: {
      display: "flex",
      gap: spacing.sm,
      alignItems: "center",
      padding: spacing.sm,
      backgroundColor: colors.bgSecondary,
      borderRadius: borderRadius.md,
    } as React.CSSProperties,

    filterInput: {
      flex: 1,
      padding: `6px ${spacing.md}`,
      backgroundColor: colors.bgPrimary,
      border: `1px solid ${colors.border}`,
      borderRadius: borderRadius.sm,
      color: colors.textPrimary,
      fontSize: typography.fontSize.base,
    } as React.CSSProperties,

    button: {
      padding: `6px ${spacing.md}`,
      backgroundColor: colors.buttonPrimary,
      border: "none",
      borderRadius: borderRadius.sm,
      color: colors.white,
      fontSize: typography.fontSize.base,
      cursor: "pointer",
    } as React.CSSProperties,

    count: {
      fontSize: typography.fontSize.sm,
      color: colors.textSecondary,
    } as React.CSSProperties,

    toggleLabel: {
      display: "flex",
      alignItems: "center",
      gap: spacing.gapSm,
      cursor: "pointer",
      fontSize: typography.fontSize.base,
      color: colors.textPrimary,
      whiteSpace: "nowrap",
    } as React.CSSProperties,

    checkbox: {
      cursor: "pointer",
      width: dimensions.checkboxSize,
      height: dimensions.checkboxSize,
    } as React.CSSProperties,

    toggleText: {
      userSelect: "none",
    } as React.CSSProperties,

    // Timeline list
    timelineList: {
      flex: 1,
      overflow: "auto",
      display: "flex",
      flexDirection: "column",
      gap: spacing.xs,
    } as React.CSSProperties,

    // Timeline entry
    timelineEntry: {
      backgroundColor: colors.bgSecondary,
      borderRadius: borderRadius.sm,
    } as React.CSSProperties,

    devToolsEntry: {
      borderLeft: `${dimensions.borderWidthThicker} solid ${colors.success}`,
    } as React.CSSProperties,

    nestedEntry: {
      backgroundColor: "transparent",
      marginBottom: spacing.xs,
    } as React.CSSProperties,

    timelineEntryHeader: {
      display: "flex",
      gap: spacing.md,
      padding: `${spacing.sm} ${spacing.md}`,
      cursor: "pointer",
      fontSize: typography.fontSize.base,
      alignItems: "center",
    } as React.CSSProperties,

    expandIcon: {
      fontSize: dimensions.iconSizeSmall,
      color: colors.textSecondary,
    } as React.CSSProperties,

    timelineTime: {
      color: colors.success,
      fontFamily: typography.fontFamilyMono,
      fontSize: typography.fontSize.sm,
      minWidth: dimensions.minWidthTime,
    } as React.CSSProperties,

    timelineInstance: {
      color: colors.timelineInstance,
      minWidth: dimensions.minWidthInstance,
    } as React.CSSProperties,

    timelineEvent: {
      color: colors.warning,
      fontSize: typography.fontSize.xs,
      textTransform: "uppercase",
      minWidth: dimensions.minWidthEvent,
    } as React.CSSProperties,

    timelineDescription: {
      flex: 1,
      color: colors.textPrimary,
    } as React.CSSProperties,

    devToolsLabel: {
      fontSize: typography.fontSize.md,
    } as React.CSSProperties,

    timelineEntryDetails: {
      padding: `0 ${spacing.md} ${spacing.md} ${spacing.md}`,
      borderTop: `1px solid ${colors.border}`,
    } as React.CSSProperties,

    pre: {
      backgroundColor: colors.bgPrimary,
      padding: spacing.sm,
      borderRadius: borderRadius.sm,
      fontSize: typography.fontSize.xs,
      fontFamily: typography.fontFamilyMono,
      overflow: "auto",
      margin: 0,
    } as React.CSSProperties,

    emptyState: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      height: "100%",
      color: colors.textSecondary,
      fontSize: typography.fontSize.md,
    } as React.CSSProperties,

    // Batch group
    batchGroup: {
      backgroundColor: colors.bgSecondary,
      borderRadius: borderRadius.sm,
      border: `1px solid ${colors.success}`,
    } as React.CSSProperties,

    batchHeader: {
      display: "flex",
      gap: spacing.md,
      padding: `${spacing.sm} ${spacing.md}`,
      cursor: "pointer",
      fontSize: typography.fontSize.base,
      alignItems: "center",
      backgroundColor: colors.badgeSuccessBgAlpha,
    } as React.CSSProperties,

    batchIcon: {
      fontSize: typography.fontSize.lg,
    } as React.CSSProperties,

    batchLabel: {
      flex: 1,
      color: colors.success,
      fontWeight: typography.fontWeight.semibold,
    } as React.CSSProperties,

    batchContent: {
      padding: `${spacing.xs} ${spacing.sm}`,
      borderTop: `${dimensions.borderWidth} solid ${colors.border}`,
    } as React.CSSProperties,
  };
}
