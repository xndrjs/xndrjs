import type { Disposable } from "./disposable";
import { SubscriptionsRegistry } from "./subscriptions-registry";

/**
 * Creates an interval that is automatically cleared when the owner is disposed.
 *
 * @param owner - The Disposable owner responsible for cleanup
 * @param fn - Function to execute on each interval
 * @param delay - Delay in milliseconds
 * @returns The interval ID (can be used to clear manually if needed)
 *
 * @example
 * ```typescript
 * class MyViewModel extends ViewModel {
 *   constructor() {
 *     super();
 *     // Interval is automatically cleared when ViewModel is disposed
 *     createInterval(this, () => {
 *       console.log('Tick');
 *     }, 1000);
 *   }
 * }
 * ```
 */
export function createInterval(
  owner: Disposable,
  fn: () => void,
  delay: number,
): ReturnType<typeof setInterval> {
  const intervalId = setInterval(fn, delay);

  SubscriptionsRegistry.register(owner, () => {
    clearInterval(intervalId);
  });

  return intervalId;
}

/**
 * Creates a timeout that is automatically cleared when the owner is disposed.
 *
 * @param owner - The Disposable owner responsible for cleanup
 * @param fn - Function to execute after delay
 * @param delay - Delay in milliseconds
 * @returns The timeout ID (can be used to clear manually if needed)
 *
 * @example
 * ```typescript
 * class MyViewModel extends ViewModel {
 *   constructor() {
 *     super();
 *     // Timeout is automatically cleared if ViewModel is disposed before it fires
 *     createTimeout(this, () => {
 *       console.log('Delayed action');
 *     }, 5000);
 *   }
 * }
 * ```
 */
export function createTimeout(
  owner: Disposable,
  fn: () => void,
  delay: number,
): ReturnType<typeof setTimeout> {
  const timeoutId = setTimeout(fn, delay);

  SubscriptionsRegistry.register(owner, () => {
    clearTimeout(timeoutId);
  });

  return timeoutId;
}

/**
 * Adds an event listener that is automatically removed when the owner is disposed.
 *
 * @param owner - The Disposable owner responsible for cleanup
 * @param target - The event target (e.g., window, document, element)
 * @param event - The event name
 * @param handler - The event handler
 * @param options - Optional event listener options
 *
 * @example
 * ```typescript
 * class MyViewModel extends ViewModel {
 *   constructor() {
 *     super();
 *     // Listener is automatically removed when ViewModel is disposed
 *     createEventListener(this, window, 'resize', () => {
 *       console.log('Window resized');
 *     });
 *   }
 * }
 * ```
 */
export function createEventListener<T extends EventTarget>(
  owner: Disposable,
  target: T,
  event: string,
  handler: EventListenerOrEventListenerObject,
  options?: boolean | AddEventListenerOptions,
): void {
  target.addEventListener(event, handler, options);

  SubscriptionsRegistry.register(owner, () => {
    target.removeEventListener(event, handler, options);
  });
}

/**
 * Creates an AbortController that is automatically aborted when the owner is disposed.
 * Useful for cancelling fetch requests, WebSocket connections, etc.
 *
 * @param owner - The Disposable owner responsible for cleanup
 * @returns The AbortController instance
 *
 * @example
 * ```typescript
 * class MyViewModel extends ViewModel {
 *   async fetchData() {
 *     const controller = createAbortController(this);
 *     const response = await fetch('/api/data', {
 *       signal: controller.signal
 *     });
 *     return response.json();
 *   }
 *   // If ViewModel is disposed, the fetch is automatically aborted
 * }
 * ```
 */
export function createAbortController(owner: Disposable): AbortController {
  const controller = new AbortController();

  SubscriptionsRegistry.register(owner, () => {
    controller.abort();
  });

  return controller;
}

/**
 * Creates a WebSocket connection that is automatically closed when the owner is disposed.
 *
 * @param owner - The Disposable owner responsible for cleanup
 * @param url - The WebSocket server URL
 * @param protocols - Optional protocol string or array of protocol strings
 * @returns The WebSocket instance
 *
 * @example
 * ```typescript
 * class MyViewModel extends ViewModel {
 *   constructor() {
 *     super();
 *     const ws = createWebSocket(this, 'ws://localhost:8080');
 *     ws.onmessage = (event) => {
 *       console.log('Message:', event.data);
 *     };
 *     // WebSocket is automatically closed when ViewModel is disposed
 *   }
 * }
 * ```
 */
export function createWebSocket(
  owner: Disposable,
  url: string,
  protocols?: string | string[],
): WebSocket {
  const ws = new WebSocket(url, protocols);

  SubscriptionsRegistry.register(owner, () => {
    ws.close();
  });

  return ws;
}

/**
 * Creates an animation frame request that is automatically cancelled when the owner is disposed.
 *
 * @param owner - The Disposable owner responsible for cleanup
 * @param callback - The callback function to execute on the next animation frame
 * @returns The animation frame ID
 *
 * @example
 * ```typescript
 * class MyViewModel extends ViewModel {
 *   constructor() {
 *     super();
 *     const animate = () => {
 *       // Animation logic
 *       const id = createAnimationFrame(this, animate);
 *     };
 *     createAnimationFrame(this, animate);
 *     // Animation frame is automatically cancelled when ViewModel is disposed
 *   }
 * }
 * ```
 */
export function createAnimationFrame(
  owner: Disposable,
  callback: FrameRequestCallback,
): number {
  const id = requestAnimationFrame(callback);

  SubscriptionsRegistry.register(owner, () => {
    cancelAnimationFrame(id);
  });

  return id;
}

/**
 * Creates an IntersectionObserver that is automatically disconnected when the owner is disposed.
 *
 * @param owner - The Disposable owner responsible for cleanup
 * @param callback - The callback function to execute when intersection changes
 * @param options - Optional IntersectionObserver options
 * @returns The IntersectionObserver instance
 *
 * @example
 * ```typescript
 * class MyViewModel extends ViewModel {
 *   constructor(element: HTMLElement) {
 *     super();
 *     const observer = createIntersectionObserver(
 *       this,
 *       (entries) => {
 *         entries.forEach(entry => console.log(entry.isIntersecting));
 *       }
 *     );
 *     observer.observe(element);
 *     // Observer is automatically disconnected when ViewModel is disposed
 *   }
 * }
 * ```
 */
export function createIntersectionObserver(
  owner: Disposable,
  callback: IntersectionObserverCallback,
  options?: IntersectionObserverInit,
): IntersectionObserver {
  const observer = new IntersectionObserver(callback, options);

  SubscriptionsRegistry.register(owner, () => {
    observer.disconnect();
  });

  return observer;
}
