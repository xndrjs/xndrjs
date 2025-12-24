import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/**
 * xndr Documentation Sidebar
 * Organized by category: Getting Started, Core, Patterns, Adapters, DevTools
 */
const sidebars: SidebarsConfig = {
  docsSidebar: [
    // Getting Started
    {
      type: 'category',
      label: 'Getting Started',
      items: [
        'getting-started/introduction',
        'getting-started/installation',
        'getting-started/concepts',
      ],
    },
    // Core Package
    {
      type: 'category',
      label: 'Core',
      items: [
        'core/overview',
        'core/state-port',
        'core/reactive-value',
        'core/computed-value',
        'core/lifecycle',
      ],
    },
    // Patterns
    {
      type: 'category',
      label: 'Patterns',
      items: [
        {
          type: 'category',
          label: 'CQRS',
          items: [
            'patterns/cqrs/overview',
            'patterns/cqrs/command-bus',
            'patterns/cqrs/query-bus',
            'patterns/cqrs/event-bus',
          ],
        },
        {
          type: 'category',
          label: 'FSM',
          items: [
            'patterns/fsm/overview',
            'patterns/fsm/usage',
          ],
        },
        {
          type: 'category',
          label: 'Memento',
          items: [
            'patterns/memento/overview',
            'patterns/memento/usage',
          ],
        },
      ],
    },
    // Framework Adapters
    {
      type: 'category',
      label: 'Adapters',
      items: [
        {
          type: 'category',
          label: 'React',
          items: [
            'adapters/react/overview',
            'adapters/react/api',
          ],
        },
        {
          type: 'category',
          label: 'Solid',
          items: [
            'adapters/solid/overview',
            'adapters/solid/api',
          ],
        },
        {
          type: 'category',
          label: 'Svelte',
          items: [
            'adapters/svelte/overview',
            'adapters/svelte/api',
          ],
        },
      ],
    },
    // DevTools
    {
      type: 'category',
      label: 'DevTools',
      items: [
        {
          type: 'category',
          label: 'React',
          items: [
            'devtools/react/installation-and-setup',
            'devtools/react/usage',
          ],
        },
      ],
    },
  ],
};

export default sidebars;
