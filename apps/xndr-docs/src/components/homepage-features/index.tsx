import type {ReactNode} from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  Svg: React.ComponentType<React.ComponentProps<'svg'>>;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Framework-Agnostic Core',
    Svg: require('@site/static/img/undraw_docusaurus_mountain.svg').default,
    description: (
      <>
        Write your business logic once with <code>@xndrjs/core</code>. 
        Use the StatePort pattern to create reactive, framework-independent code that works everywhere.
      </>
    ),
  },
  {
    title: 'Powerful Patterns',
    Svg: require('@site/static/img/undraw_docusaurus_tree.svg').default,
    description: (
      <>
        Implement CQRS, FSM, and Memento patterns with <code>@xndrjs/cqrs</code>, 
        <code>@xndrjs/fsm</code>, and <code>@xndrjs/memento</code>. Build complex state management with ease.
      </>
    ),
  },
  {
    title: 'Framework Adapters',
    Svg: require('@site/static/img/undraw_docusaurus_react.svg').default,
    description: (
      <>
        Connect your framework-agnostic code to React, Solid, or Svelte. 
        Use <code>@xndrjs/adapter-react</code>, <code>@xndrjs/adapter-solid</code>, 
        or <code>@xndrjs/adapter-svelte</code>.
      </>
    ),
  },
];

function Feature({title, Svg, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
