"use client";

/**
 * DevTools Panel Component
 * Main UI component for DevTools
 */

import React, { useState, useEffect, useRef } from "react";
import { InstancesTab } from "./tabs/instances-tab";
import { TimelineTab } from "./tabs/timeline-tab";
import { MessagingTab } from "./tabs/messaging-tab";
import { FSMTab } from "./tabs/fsm-tab";
import { MementoTab } from "./tabs/memento-tab";
import type { DevToolsPanelProps } from "./types";
import {
  colors,
  spacing,
  typography,
  borderRadius,
  transitions,
} from "./theme";

const TABS = [
  { id: "instances", label: "Instances", icon: "📦" },
  { id: "timeline", label: "Timeline", icon: "📋" },
  { id: "messaging", label: "Messaging", icon: "💬" },
  { id: "fsm", label: "State Machines", icon: "🔄" },
  { id: "memento", label: "Memento", icon: "💾" },
] as const;

export type TabId = (typeof TABS)[number]["id"];

const vhToPixels = (vh: number) => {
  if (typeof window === "undefined") {
    return (vh * 1080) / 100;
  }
  return (window.innerHeight * vh) / 100;
};

export function DevToolsPanel({
  defaultTab = "instances",
  position = "bottom",
  height = 400,
  collapsed = true,
}: DevToolsPanelProps = {}) {
  const [activeTab, setActiveTab] = useState<TabId>(defaultTab);
  const [isCollapsed, setIsCollapsed] = useState(collapsed);
  const [currentHeight, setCurrentHeight] = useState(height);
  const [isResizing, setIsResizing] = useState(false);
  const startY = useRef(0);
  const startHeight = useRef(0);

  // Min 20vh, Max 100vh
  const minHeight = vhToPixels(25);
  const maxHeight = vhToPixels(100);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      // Calculate new height based on mouse position
      let newHeight: number;
      if (position === "bottom") {
        // For bottom position, dragging up increases height
        const deltaY = startY.current - e.clientY;
        newHeight = startHeight.current + deltaY;
      } else if (position === "top") {
        // For top position, dragging down increases height
        const deltaY = e.clientY - startY.current;
        newHeight = startHeight.current + deltaY;
      } else {
        return; // Only support top/bottom for now
      }

      // Apply constraints
      newHeight = Math.max(minHeight, Math.min(maxHeight, newHeight));
      setCurrentHeight(newHeight);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, position, minHeight, maxHeight]);

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    startY.current = e.clientY;
    startHeight.current = currentHeight;
  };

  const styles = getStyles(position, currentHeight, isCollapsed, isResizing);

  const renderTab = () => {
    switch (activeTab) {
      case "instances":
        return <InstancesTab />;
      case "timeline":
        return <TimelineTab />;
      case "messaging":
        return <MessagingTab />;
      case "fsm":
        return <FSMTab />;
      case "memento":
        return <MementoTab />;
      default:
        return null;
    }
  };

  return (
    <div style={styles.container}>
      {/* Resize handle for bottom/top positions */}
      {!isCollapsed && (position === "bottom" || position === "top") && (
        <div
          style={styles.resizeHandle}
          onMouseDown={handleResizeStart}
          title="Drag to resize"
        />
      )}

      <div style={styles.header} onClick={() => setIsCollapsed(!isCollapsed)}>
        <div style={styles.headerLeft}>
          <h3 style={styles.title}>
            <code>use-less-react DevTools</code>
          </h3>
        </div>
        <div style={styles.headerRight}>
          <button
            style={styles.collapseButton}
            title={isCollapsed ? "Expand" : "Collapse"}
          >
            {isCollapsed ? "▲" : "▼"}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <>
          <div style={styles.tabs}>
            {TABS.map((tab) => (
              <button
                key={tab.id}
                style={{
                  ...styles.tab,
                  ...(activeTab === tab.id ? styles.activeTab : {}),
                }}
                onClick={() => setActiveTab(tab.id)}
                onFocus={(e) => {
                  e.currentTarget.style.outline = `2px solid ${colors.accent}`;
                  e.currentTarget.style.outlineOffset = "-2px";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.outline = "none";
                }}
              >
                <span style={styles.tabIcon}>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <div style={styles.content}>{renderTab()}</div>
        </>
      )}
    </div>
  );
}

function getStyles(
  position: "top" | "bottom" | "left" | "right",
  height: number,
  isCollapsed: boolean,
  isResizing: boolean,
) {
  const baseContainer: React.CSSProperties = {
    fontFamily: typography.fontFamily,
    backgroundColor: colors.bgPrimary,
    color: colors.textPrimary,
    border: `1px solid ${colors.border}`,
    borderRadius: borderRadius.md,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    userSelect: isResizing ? "none" : "auto",
  };

  const positionStyles: Record<string, React.CSSProperties> = {
    bottom: {
      position: "fixed",
      bottom: 0,
      left: 0,
      right: 0,
      height: isCollapsed ? spacing.xxxl : `${height}px`,
      zIndex: 999999,
    },
    top: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      height: isCollapsed ? spacing.xxxl : `${height}px`,
      zIndex: 999999,
    },
    left: {
      position: "fixed",
      top: 0,
      left: 0,
      bottom: 0,
      width: isCollapsed ? spacing.xxxl : `${height}px`,
      zIndex: 999999,
    },
    right: {
      position: "fixed",
      top: 0,
      right: 0,
      bottom: 0,
      width: isCollapsed ? spacing.xxxl : `${height}px`,
      zIndex: 999999,
    },
  };

  const resizeHandleStyles: Record<string, React.CSSProperties> = {
    bottom: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: spacing.xs,
      cursor: "ns-resize",
      backgroundColor: "transparent",
      zIndex: 10,
      transition: isResizing ? "none" : `background-color ${transitions.base}`,
    },
    top: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      height: spacing.xs,
      cursor: "ns-resize",
      backgroundColor: "transparent",
      zIndex: 10,
      transition: isResizing ? "none" : `background-color ${transitions.base}`,
    },
    left: {
      position: "absolute",
      right: 0,
      top: 0,
      bottom: 0,
      width: spacing.xs,
      cursor: "ew-resize",
      backgroundColor: "transparent",
      zIndex: 10,
      transition: isResizing ? "none" : `background-color ${transitions.base}`,
    },
    right: {
      position: "absolute",
      left: 0,
      top: 0,
      bottom: 0,
      width: spacing.xs,
      cursor: "ew-resize",
      backgroundColor: "transparent",
      zIndex: 10,
      transition: isResizing ? "none" : `background-color ${transitions.base}`,
    },
  };

  return {
    container: {
      ...baseContainer,
      ...positionStyles[position],
    },
    resizeHandle: {
      ...resizeHandleStyles[position],
      backgroundColor: isResizing ? colors.accent : "transparent",
    } as React.CSSProperties,
    header: {
      cursor: "pointer",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: `${spacing.sm} ${spacing.lg}`,
      backgroundColor: colors.bgSecondary,
      borderBottom: `1px solid ${colors.border}`,
    } as React.CSSProperties,
    headerLeft: {
      display: "flex",
      alignItems: "center",
    } as React.CSSProperties,
    headerRight: {
      display: "flex",
      gap: spacing.sm,
    } as React.CSSProperties,
    title: {
      margin: 0,
      fontSize: typography.fontSize.md,
      fontWeight: typography.fontWeight.semibold,
    } as React.CSSProperties,
    collapseButton: {
      background: "transparent",
      border: "none",
      color: colors.textPrimary,
      fontSize: typography.fontSize.sm,
      padding: `${spacing.xs} ${spacing.sm}`,
      borderRadius: borderRadius.sm,
      cursor: "pointer",
    } as React.CSSProperties,
    tabs: {
      display: "flex",
      backgroundColor: colors.bgTertiary,
      borderBottom: `1px solid ${colors.border}`,
      overflowX: "auto",
    } as React.CSSProperties,
    tab: {
      background: "transparent",
      border: "none",
      color: colors.textSecondary,
      cursor: "pointer",
      padding: `${spacing.sm} ${spacing.lg}`,
      fontSize: typography.fontSize.base,
      display: "flex",
      alignItems: "center",
      gap: spacing.gapSm,
      borderBottom: "2px solid transparent",
      transition: `all ${transitions.base}`,
      whiteSpace: "nowrap",
      outline: "none",
    } as React.CSSProperties,
    activeTab: {
      color: colors.textPrimary,
      borderBottom: `2px solid ${colors.accent}`,
    } as React.CSSProperties,
    tabFocus: {
      outline: `2px solid ${colors.accent}`,
      outlineOffset: "-2px",
      borderBottom: `2px solid ${colors.accent}`,
    } as React.CSSProperties,
    tabIcon: {
      fontSize: typography.fontSize.lg,
    } as React.CSSProperties,
    content: {
      flex: 1,
      overflow: "auto",
      padding: 0,
    } as React.CSSProperties,
  };
}
