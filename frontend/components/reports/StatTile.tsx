import type { LucideIcon } from "lucide-react";
import styles from "./StatTile.module.css";

type StatTileProps = {
  label: string;
  value: number;
  hint: string;
  icon: LucideIcon;
};

export function StatTile({ label, value, hint, icon: Icon }: StatTileProps) {
  return (
    <section className={`card ${styles.tile}`}>
      <div className={styles.top}>
        <h2 className={styles.label}>{label}</h2>
        <span className={styles.icon} aria-hidden="true">
          <Icon size={18} />
        </span>
      </div>
      <p className={styles.value}>{value.toLocaleString()}</p>
      <p className={styles.hint}>{hint}</p>
    </section>
  );
}
