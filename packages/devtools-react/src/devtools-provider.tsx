"use client";

import { useEffect, type ReactNode } from "react";
import { initDevTools } from "./init";

/**
 * Provider component for initializing DevTools in React applications.
 * Use this in your app's root to automatically initialize DevTools.
 *
 * @example
 * ```tsx
 * // Next.js App Router (app/layout.tsx)
 * import { DevToolsProvider } from "@xndrjs/devtools-react";
 *
 * export default function RootLayout({ children }: { children: ReactNode }) {
 *   return (
 *     <html>
 *       <body>
 *         <DevToolsProvider disabled={process.env.NODE_ENV === "production"}>
 *           {children}
 *         </DevToolsProvider>
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Next.js Pages Router (pages/_app.tsx)
 * import { DevToolsProvider } from "@xndrjs/devtools-react";
 *
 * function MyApp({ Component, pageProps }) {
 *   return (
 *     <DevToolsProvider disabled={process.env.NODE_ENV === "production"}>
 *       <Component {...pageProps} />
 *     </DevToolsProvider>
 *   );
 * }
 * ```
 */
export function DevToolsProvider({
  children,
  disabled = false,
}: {
  children: ReactNode;
  disabled?: boolean;
}) {
  useEffect(() => {
    if (!disabled) {
      // Explicitly enable browser console API for client-side usage
      initDevTools({ skipBrowserConsoleAPI: false });
    }
  }, [disabled]);

  return <>{children}</>;
}
