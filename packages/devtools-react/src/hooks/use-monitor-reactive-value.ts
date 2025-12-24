"use client";

import { useEffect } from "react";
import { monitor } from "../monitors/monitor";
import type { ReactiveValue } from "@xndrjs/core";
import type { MonitorReactiveValueOptions } from "../monitors/reactive-value-monitor";

export function useMonitorReactiveValue<T>(
  value: ReactiveValue<T> | null | undefined,
  options: MonitorReactiveValueOptions,
) {
  const metadataKey = options.metadata
    ? JSON.stringify(options.metadata)
    : undefined;

  useEffect(() => {
    if (!value) return;

    monitor.reactiveValue.track(value, options);
    return () => {
      monitor.reactiveValue.untrack(value);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, options.name, metadataKey]);
}
