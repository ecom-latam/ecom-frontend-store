import styles from './layout.module.scss';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className={styles.root} style={{ background: 'var(--color-bg-subtle)' }}>
      {children}
    </main>
  );
}
