/**
 * Dependency Graph Tracker
 * Tracks dependencies between reactive instances
 * Updated for new reactive system (ComputedValue)
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { ComputedValue } from "@xndrjs/core";
import { getDevToolsHook } from "../core/hook";
import { getDevToolsStore } from "../core/store";
import type { Dependency, InstanceId } from "../core/types";

/**
 * Extract dependencies from a reactive instance
 */
export function extractDependencies(
  instance: any,
  instanceId: InstanceId,
): Dependency[] {
  const hook = getDevToolsHook();
  const dependencies: Dependency[] = [];

  // ComputedValue: extract dependencies from dependencies array
  if (instance && typeof instance === "object" && "dependencies" in instance) {
    const computedValue = instance as ComputedValue<any>;
    if (Array.isArray(computedValue.dependencies)) {
      for (const dep of computedValue.dependencies) {
        const depInstanceId = hook.findInstanceId(dep);
        if (depInstanceId) {
          dependencies.push({
            sourceInstanceId: depInstanceId,
            targetInstanceId: instanceId,
            dependencyType: "computed",
          });
        }
      }
    }
  }

  return dependencies;
}

/**
 * Get dependencies for a specific instance
 */
export function getInstanceDependencies(instanceId: InstanceId): Dependency[] {
  const store = getDevToolsStore();
  return store
    .getDependencies()
    .filter((dep) => dep.targetInstanceId === instanceId);
}

/**
 * Get all instances that depend on a given instance
 */
function getDependentInstances(instanceId: InstanceId): InstanceId[] {
  const dependencies = getInstanceDependencies(instanceId);
  return Array.from(new Set(dependencies.map((dep) => dep.targetInstanceId)));
}

/**
 * Check if there are circular dependencies
 */
export function detectCircularDependencies(): Dependency[][] {
  const store = getDevToolsStore();
  const dependencies = store.getDependencies();
  const cycles: Dependency[][] = [];

  // Build adjacency list (instanceId -> [instanceIds it depends on])
  const graph = new Map<InstanceId, InstanceId[]>();
  for (const dep of dependencies) {
    if (!graph.has(dep.targetInstanceId)) {
      graph.set(dep.targetInstanceId, []);
    }
    graph.get(dep.targetInstanceId)!.push(dep.sourceInstanceId);
  }

  // DFS to detect cycles
  const visited = new Set<InstanceId>();
  const recStack = new Set<InstanceId>();
  const path: InstanceId[] = [];

  function dfs(node: InstanceId): void {
    visited.add(node);
    recStack.add(node);
    path.push(node);

    const neighbors = graph.get(node) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        dfs(neighbor);
      } else if (recStack.has(neighbor)) {
        // Found a cycle
        const cycleStart = path.indexOf(neighbor);
        const cycle = path.slice(cycleStart).map((id, index, arr) => {
          const nextId = arr[(index + 1) % arr.length];
          return dependencies.find(
            (d) => d.sourceInstanceId === id && d.targetInstanceId === nextId,
          )!;
        });
        cycles.push(cycle);
      }
    }

    recStack.delete(node);
    path.pop();
  }

  for (const node of graph.keys()) {
    if (!visited.has(node)) {
      dfs(node);
    }
  }

  return cycles;
}

/**
 * Get a textual representation of the dependency graph
 */
export function getDependencyTree(instanceId: InstanceId): string {
  const hook = getDevToolsHook();
  const dependencies = getInstanceDependencies(instanceId);

  if (dependencies.length === 0) {
    return "No dependencies found";
  }

  const lines: string[] = [];
  const processed = new Set<string>();

  function addInstance(id: InstanceId, indent: number = 0): void {
    const key = `${indent}:${id}`;
    if (processed.has(key)) {
      return;
    }
    processed.add(key);

    const instance = hook.getInstance(id);
    if (!instance) {
      return;
    }

    const prefix = "  ".repeat(indent);
    lines.push(`${prefix}${instance.name} (${instance.type})`);

    const dependents = getDependentInstances(id);
    for (const dependent of dependents) {
      addInstance(dependent, indent + 1);
    }
  }

  // Start from the given instance
  addInstance(instanceId);

  return lines.join("\n");
}
