// Client-side accessible sidebar data
// This file mirrors the structure from sidebars.ts but in a format that can be imported in React components

export const sidebarData = {
  docsSidebar: [
    {
      type: 'category',
      label: 'Getting Started',
      items: [
        'getting-started/introduction',
        'getting-started/installation',
        'getting-started/concepts',
      ],
    },
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
    {
      type: 'category',
      label: 'Adapters',
      items: [
        {
          type: 'category',
          label: 'React',
          items: [
            'adapters/react/overview',
            'adapters/react/installation',
            'adapters/react/usage',
          ],
        },
        {
          type: 'category',
          label: 'Solid',
          items: [
            'adapters/solid/overview',
            'adapters/solid/installation',
            'adapters/solid/usage',
          ],
        },
        {
          type: 'category',
          label: 'Svelte',
          items: [
            'adapters/svelte/overview',
            'adapters/svelte/installation',
            'adapters/svelte/usage',
          ],
        },
      ],
    },
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

