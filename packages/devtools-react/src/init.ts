/**
 * DevTools Initialization
 * Sets up the DevTools system
 */

import { installDevToolsHook } from "./core/hook";
import { getDevToolsStore } from "./core/store";
import { initFSMHistoryTracking } from "./monitors/fsm-monitor";
import { initMementoStatsTracking } from "./monitors/memento-monitor";
import { installConsoleAPI } from "./console/api";

/**
 * Options for initializing DevTools
 */
export interface InitDevToolsOptions {
  /**
   * Skip installing the browser console API (useful for server-side usage).
   * The console API requires `window` object and is only available in the browser.
   * Set to `false` when initializing DevTools in the browser (e.g., via DevToolsProvider).
   * @default true
   */
  skipBrowserConsoleAPI?: boolean;
}

/**
 * Initialize DevTools
 * This should be called once at application startup.
 *
 * **Client-side (browser):**
 * ```typescript
 * if (typeof window !== "undefined") {
 *   initDevTools();
 * }
 * ```
 *
 * **Server-side (Node.js, Next.js SSR):**
 * ```typescript
 * // Monitor functions work without initDevTools, but you can initialize for consistency
 * // skipBrowserConsoleAPI defaults to true, so no need to pass it explicitly
 * initDevTools();
 * ```
 *
 * **Note:** Monitor functions (`monitor.reactiveValue`, etc.) work even without calling `initDevTools()`
 * because they automatically create the hook singleton. However, calling `initDevTools()` ensures
 * the store and stat tracking are properly initialized.
 */
export function initDevTools(options?: InitDevToolsOptions): void {
  // Install the global hook (works even without window)
  installDevToolsHook();

  // Initialize the store (it will set up event listeners automatically)
  // Works in-memory, no window dependency
  getDevToolsStore();

  // Initialize stat tracking for FSM and Memento
  initFSMHistoryTracking();
  initMementoStatsTracking();

  // Default to skipping console API (safer for server-side)
  const skipConsoleAPI = options?.skipBrowserConsoleAPI ?? true;

  // Install browser console API only if window exists and not skipped
  if (!skipConsoleAPI && typeof window !== "undefined") {
    installConsoleAPI();
  }

  if (typeof window !== "undefined") {
    console.log("[DevTools] use-less-react DevTools initialized");
    if (!skipConsoleAPI) {
      console.log(
        '[DevTools] Type "devtools.help()" in the console for available commands',
      );
    }
  }
}
