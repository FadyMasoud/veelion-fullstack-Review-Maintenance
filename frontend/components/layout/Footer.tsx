import styles from "./Footer.module.css";

export function Footer() {
  return (
    <footer className={styles.footer}>
      <span>© {new Date().getFullYear()} Task Manager</span>
      <span>Next.js · Express</span>
    </footer>
  );
}
