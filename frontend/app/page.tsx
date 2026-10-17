import Link from "next/link";
import { Activity, ArrowRight, ChartColumn, ListChecks, type LucideIcon } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import styles from "./home.module.css";

const SECTIONS: Array<{ href: string; title: string; text: string; icon: LucideIcon }> = [
  { href: "/tasks", title: "Tasks", text: "Search, filter and update your tasks.", icon: ListChecks },
  { href: "/activity", title: "Activity", text: "See everything that happened, newest first.", icon: Activity },
  { href: "/reports", title: "Reports", text: "Task totals by status and recent activity.", icon: ChartColumn },
];

export default function HomePage() {
  return (
    <div className="stack">
      <PageHeader title="Welcome back" description="Pick a section to get started." />

      <div className={styles.grid}>
        {SECTIONS.map(({ href, title, text, icon: Icon }) => (
          <Link key={href} href={href} className={`card ${styles.card}`}>
            <span className={styles.icon} aria-hidden="true">
              <Icon size={20} />
            </span>
            <h2 className={styles.title}>
              {title}
              <ArrowRight size={16} className={styles.arrow} aria-hidden="true" />
            </h2>
            <p className={styles.text}>{text}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
