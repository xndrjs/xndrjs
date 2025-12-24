import type {ReactNode} from 'react';
import styles from '../../pages/index.module.css';

type FeatureCardProps = {
  icon: string;
  title: string;
  description: string;
};

export default function FeatureCard({icon, title, description}: FeatureCardProps): ReactNode {
  return (
    <div className={styles.featureCard}>
      <div className={styles.featureIcon}>{icon}</div>
      <h3 className={styles.featureTitle}>{title}</h3>
      <p className={styles.featureDescription}>{description}</p>
    </div>
  );
}

