"use client";

import { useEffect } from "react";
import { monitor } from "../monitors/monitor";
import type { FSMContextManager } from "@xndrjs/fsm";
import type { MonitorFSMOptions } from "../monitors/fsm-monitor";

export function useMonitorFSM<TConfig extends Record<PropertyKey, unknown>>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fsm: FSMContextManager<TConfig, any> | null | undefined,
  options: MonitorFSMOptions,
) {
  const metadataKey = options.metadata
    ? JSON.stringify(options.metadata)
    : undefined;

  useEffect(() => {
    if (!fsm) return;

    monitor.fsm.track(fsm, options);
    return () => {
      monitor.fsm.untrack(fsm);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fsm, options.name, metadataKey]);
}
