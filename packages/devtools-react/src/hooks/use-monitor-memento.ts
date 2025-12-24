"use client";

import { useEffect } from "react";
import { monitor } from "../monitors/monitor";
import type {
  MementoAbstractCaretaker,
  MementoAbstractOriginatorProps,
} from "@xndrjs/memento";
import type { MonitorMementoOptions } from "../monitors/memento-monitor";

export function useMonitorMemento<
  TState,
  Originator extends MementoAbstractOriginatorProps<TMemento>,
  TMemento,
>(
  caretaker:
    | MementoAbstractCaretaker<TState, Originator, TMemento>
    | null
    | undefined,
  options: MonitorMementoOptions,
) {
  const metadataKey = options.metadata
    ? JSON.stringify(options.metadata)
    : undefined;

  useEffect(() => {
    if (!caretaker) return;

    monitor.memento.track(caretaker, options);
    return () => {
      monitor.memento.untrack(caretaker);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caretaker, options.name, metadataKey]);
}
