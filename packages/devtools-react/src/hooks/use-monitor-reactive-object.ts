"use client";

import { useEffect } from "react";
import { monitor } from "../monitors/monitor";
import type { ReactiveObject } from "@xndrjs/core";
import type { MonitorReactiveObjectOptions } from "../monitors/reactive-object-monitor";

export function useMonitorReactiveObject<T extends object | null>(
  object: ReactiveObject<T> | null | undefined,
  options: MonitorReactiveObjectOptions,
) {
  const metadataKey = options.metadata
    ? JSON.stringify(options.metadata)
    : undefined;

  useEffect(() => {
    if (!object) return;

    monitor.reactiveObject.track(object, options);
    return () => {
      monitor.reactiveObject.untrack(object);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [object, options.name, metadataKey]);
}
