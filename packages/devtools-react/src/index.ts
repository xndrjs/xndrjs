/**
 * @xndrjs/devtools-react DevTools
 *
 * DevTools for debugging and monitoring reactive applications
 * Updated for new reactive system (ReactiveValue, etc.)
 *
 * **Server-side usage:**
 * ```ts
 * import { initDevTools, monitor } from '@xndrjs/devtools-react';
 *
 * // Works in Node.js, Next.js SSR, API routes, etc.
 * initDevTools();
 * monitor.reactiveValue.track(count, { name: "Count" });
 * ```
 *
 * **Client-side usage:**
 * ```ts
 * import { DevToolsProvider, DevToolsPanel } from '@xndrjs/devtools-react';
 *
 * // React components (requires "use client")
 * <DevToolsProvider>
 *   <DevToolsPanel />
 * </DevToolsProvider>
 * ```
 */

// Core (works server-side and client-side)
export * from "./core";

// Monitors (works server-side and client-side)
export * from "./monitors";

// Console API (works server-side and client-side, but console API only in browser)
export { devtools, installConsoleAPI } from "./console";

// Initialization (works server-side and client-side)
export { initDevTools } from "./init";

// UI Components (client-side only - these files have "use client")
export * from "./ui";

// React Provider (client-side only - this file has "use client")
export { DevToolsProvider } from "./devtools-provider";

// React Hooks (client-side only - these files have "use client")
export * from "./hooks";
