"use client";

/**
 * Messaging Tab
 * Shows Event Bus, Command Bus, and Query Bus timeline
 */

import React, { useState, useEffect } from "react";
import {
  getDevToolsStore,
  DevToolsEventType,
  type TimelineEntry,
} from "../../core";
import {
  colors,
  spacing,
  typography,
  borderRadius,
  dimensions,
} from "../theme";
import { formatTimestamp } from "../utils";

const MESSAGING_EVENT_TYPES = [
  DevToolsEventType.EVENT_PUBLISHED,
  DevToolsEventType.EVENT_HANDLED,
  DevToolsEventType.EVENT_HANDLER_ERROR,
  DevToolsEventType.COMMAND_DISPATCHED,
  DevToolsEventType.COMMAND_HANDLED,
  DevToolsEventType.COMMAND_ERROR,
  DevToolsEventType.QUERY_DISPATCHED,
  DevToolsEventType.QUERY_HANDLED,
  DevToolsEventType.QUERY_ERROR,
];

export function MessagingTab() {
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [filter, setFilter] = useState("");
  const [isPaused, setIsPaused] = useState(false);
  const [selectedType, setSelectedType] = useState<string>("all");

  useEffect(() => {
    const updateTimeline = () => {
      if (!isPaused) {
        const allTimeline = getDevToolsStore().getTimeline();
        const messagingTimeline = allTimeline.filter((entry) =>
          MESSAGING_EVENT_TYPES.includes(entry.eventType),
        );
        setTimeline(messagingTimeline);
      }
    };

    updateTimeline();

    const unsubscribe = getDevToolsStore().subscribe(() => {
      updateTimeline();
    });

    return unsubscribe;
  }, [isPaused]);

  const filteredTimeline = timeline.filter((entry) => {
    // Filter by type
    if (selectedType !== "all") {
      const busType = getBusType(entry.eventType);
      if (busType !== selectedType) return false;
    }

    // Filter by search text
    if (filter) {
      return (
        entry.description.toLowerCase().includes(filter.toLowerCase()) ||
        entry.instanceName.toLowerCase().includes(filter.toLowerCase()) ||
        entry.eventType.toLowerCase().includes(filter.toLowerCase())
      );
    }

    return true;
  });

  const clearTimeline = () => {
    getDevToolsStore().clearTimeline();
  };

  const styles = getStyles();

  return (
    <div style={styles.container}>
      <div style={styles.toolbar}>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          style={styles.select}
        >
          <option value="all">All Buses</option>
          <option value="event">Event Bus</option>
          <option value="command">Command Bus</option>
          <option value="query">Query Bus</option>
        </select>
        <input
          type="text"
          placeholder="Filter messages..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={styles.filterInput}
        />
        <button onClick={() => setIsPaused(!isPaused)} style={styles.button}>
          {isPaused ? "▶️ Resume" : "⏸️ Pause"}
        </button>
        <button onClick={clearTimeline} style={styles.button}>
          🗑️ Clear
        </button>
        <span style={styles.count}>
          {filteredTimeline.length} / {timeline.length} messages
        </span>
      </div>

      <div style={styles.timelineList}>
        {filteredTimeline.length === 0 ? (
          <div style={styles.emptyState}>
            {timeline.length === 0
              ? "No messages yet"
              : "No messages match the filter"}
          </div>
        ) : (
          filteredTimeline.map((entry) => (
            <MessagingEntry key={entry.id} entry={entry} />
          ))
        )}
      </div>
    </div>
  );
}

function getBusType(eventType: DevToolsEventType): string {
  if (
    eventType === DevToolsEventType.EVENT_PUBLISHED ||
    eventType === DevToolsEventType.EVENT_HANDLED ||
    eventType === DevToolsEventType.EVENT_HANDLER_ERROR
  ) {
    return "event";
  }
  if (
    eventType === DevToolsEventType.COMMAND_DISPATCHED ||
    eventType === DevToolsEventType.COMMAND_HANDLED ||
    eventType === DevToolsEventType.COMMAND_ERROR
  ) {
    return "command";
  }
  if (
    eventType === DevToolsEventType.QUERY_DISPATCHED ||
    eventType === DevToolsEventType.QUERY_HANDLED ||
    eventType === DevToolsEventType.QUERY_ERROR
  ) {
    return "query";
  }
  return "unknown";
}

function getEventIcon(eventType: DevToolsEventType): string {
  switch (eventType) {
    case DevToolsEventType.EVENT_PUBLISHED:
      return "📢";
    case DevToolsEventType.EVENT_HANDLED:
      return "✅";
    case DevToolsEventType.EVENT_HANDLER_ERROR:
      return "❌";
    case DevToolsEventType.COMMAND_DISPATCHED:
      return "⚡";
    case DevToolsEventType.COMMAND_HANDLED:
      return "✅";
    case DevToolsEventType.COMMAND_ERROR:
      return "❌";
    case DevToolsEventType.QUERY_DISPATCHED:
      return "❓";
    case DevToolsEventType.QUERY_HANDLED:
      return "✅";
    case DevToolsEventType.QUERY_ERROR:
      return "❌";
    default:
      return "•";
  }
}

function getBusColor(eventType: DevToolsEventType): string {
  const busType = getBusType(eventType);
  switch (busType) {
    case "event":
      return colors.success;
    case "command":
      return colors.warning;
    case "query":
      return colors.info;
    default:
      return colors.textPrimary;
  }
}

function MessagingEntry({ entry }: { entry: TimelineEntry }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasData = entry.data && Object.keys(entry.data).length > 0;
  const busColor = getBusColor(entry.eventType);
  const icon = getEventIcon(entry.eventType);
  const busType = getBusType(entry.eventType).toUpperCase();
  const styles = getStyles();

  return (
    <div style={styles.entry}>
      <div
        style={styles.entryHeader}
        onClick={() => hasData && setIsExpanded(!isExpanded)}
      >
        <span style={styles.entryIcon}>{icon}</span>
        <span style={styles.entryTime}>
          {formatTimestamp(new Date(entry.timestamp))}
        </span>
        <span style={{ ...styles.entryBus, color: busColor }}>{busType}</span>
        <span style={styles.entryInstance}>{entry.instanceName}</span>
        <span style={styles.entryType}>{entry.eventType}</span>
        <span style={styles.entryDescription}>{entry.description}</span>
        {hasData && (
          <span style={styles.expandIcon}>{isExpanded ? "▼" : "▶"}</span>
        )}
      </div>
      {isExpanded && hasData && (
        <div style={styles.entryData}>
          <pre>{JSON.stringify(entry.data, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

/**
 * Get all styles for the Messaging Tab
 */
function getStyles() {
  return {
    container: {
      display: "flex",
      flexDirection: "column",
      height: "100%",
      gap: spacing.sm,
      padding: spacing.lg,
    } as React.CSSProperties,

    toolbar: {
      display: "flex",
      gap: spacing.sm,
      alignItems: "center",
      padding: spacing.sm,
      backgroundColor: colors.bgSecondary,
      borderRadius: borderRadius.md,
    } as React.CSSProperties,

    select: {
      padding: `6px ${spacing.md}`,
      backgroundColor: colors.bgPrimary,
      color: colors.textPrimary,
      border: `1px solid ${colors.border}`,
      borderRadius: borderRadius.sm,
      fontSize: typography.fontSize.base,
      cursor: "pointer",
    } as React.CSSProperties,

    filterInput: {
      flex: 1,
      padding: `6px ${spacing.md}`,
      backgroundColor: colors.bgPrimary,
      color: colors.textPrimary,
      border: `1px solid ${colors.border}`,
      borderRadius: borderRadius.sm,
      fontSize: typography.fontSize.base,
    } as React.CSSProperties,

    button: {
      padding: `6px ${spacing.md}`,
      backgroundColor: colors.bgPrimary,
      color: colors.textPrimary,
      border: `1px solid ${colors.border}`,
      borderRadius: borderRadius.sm,
      fontSize: typography.fontSize.base,
      cursor: "pointer",
      whiteSpace: "nowrap",
    } as React.CSSProperties,

    count: {
      fontSize: typography.fontSize.sm,
      color: colors.textSecondary,
      whiteSpace: "nowrap",
    } as React.CSSProperties,

    timelineList: {
      flex: 1,
      overflow: "auto",
      display: "flex",
      flexDirection: "column",
      gap: spacing.xs,
    } as React.CSSProperties,

    entry: {
      backgroundColor: colors.bgSecondary,
      borderRadius: borderRadius.sm,
    } as React.CSSProperties,

    entryHeader: {
      display: "flex",
      alignItems: "center",
      gap: spacing.sm,
      padding: `${spacing.sm} ${spacing.md}`,
      fontSize: typography.fontSize.base,
      cursor: "pointer",
    } as React.CSSProperties,

    entryIcon: {
      fontSize: typography.fontSize.lg,
    } as React.CSSProperties,

    entryTime: {
      color: colors.textSecondary,
      fontSize: typography.fontSize.xs,
      fontFamily: typography.fontFamilyMono,
      minWidth: dimensions.minWidthTime,
    } as React.CSSProperties,

    entryBus: {
      fontWeight: typography.fontWeight.semibold,
      fontSize: typography.fontSize.xs,
      minWidth: "70px",
    } as React.CSSProperties,

    entryInstance: {
      color: colors.info,
      fontSize: typography.fontSize.sm,
      minWidth: "100px",
    } as React.CSSProperties,

    entryType: {
      color: colors.textSecondary,
      fontSize: typography.fontSize.xs,
      minWidth: dimensions.minWidthEvent,
    } as React.CSSProperties,

    entryDescription: {
      flex: 1,
      color: colors.textPrimary,
    } as React.CSSProperties,

    expandIcon: {
      color: colors.textSecondary,
      fontSize: dimensions.iconSizeSmall,
    } as React.CSSProperties,

    entryData: {
      padding: `${spacing.sm} ${spacing.md}`,
      backgroundColor: colors.bgPrimary,
      borderTop: `${dimensions.borderWidth} solid ${colors.border}`,
      fontSize: typography.fontSize.sm,
      fontFamily: typography.fontFamilyMono,
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
