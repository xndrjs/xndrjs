import type {ReactNode} from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import HomepageHeader from '@site/src/components/homepage-header';
import FeatureCard from '@site/src/components/feature-card';
import styles from './index.module.css';

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={siteConfig.title}
      description="Framework-agnostic state management libraries. Build reusable business logic with React, Solid, Svelte, and any framework.">
      <HomepageHeader />
      <main className={styles.main}>
        <section className={styles.featuresSection}>
          <div className={styles.featuresHeader}>
            <Heading as="h2" className={styles.featuresTitle}>
              Why xndr?
            </Heading>
            <p className={styles.featuresSubtitle}>
              A framework-agnostic approach to state management
            </p>
          </div>
          <div className={styles.featuresGrid}>
            <FeatureCard
              title="Framework Agnostic"
              description="Write your business logic once and reuse it across different frameworks"
            />
            <FeatureCard
              title="Clean Architecture"
              description="Clear separation between business logic and UI layer with proven patterns"
            />
            <FeatureCard
              title="Composable Patterns"
              description="Build complex state management with CQRS, FSM, and Memento patterns"
            />
            <FeatureCard
              title="Type-Safe"
              description="Advanced TypeScript usage for maximum type safety"
            />
            <FeatureCard
              title="Easy to Test"
              description="Test your business logic in isolation without framework mocking"
            />
            <FeatureCard
              title="Flexible"
              description="Share logics between client-side and server-side"
            />
          </div>
        </section>
      </main>
    </Layout>
  );
}
