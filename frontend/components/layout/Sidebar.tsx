"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SquareCheckBig } from "lucide-react";
import { NAV_ITEMS, isActivePath } from "@/components/layout/navItems";
import styles from "./Sidebar.module.css";

type SidebarProps = {
  open: boolean;
  onNavigate: () => void;
};

export function Sidebar({ open, onNavigate }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside id="app-sidebar" className={`${styles.sidebar} ${open ? styles.open : ""}`}>
      <div className={styles.brand}>
        <span className={styles.brandIcon} aria-hidden="true">
          <SquareCheckBig size={18} />
        </span>
        Task Manager
      </div>

      <nav aria-label="Main">
        <ul className={styles.nav}>
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = isActivePath(pathname, href);

            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`${styles.link} ${active ? styles.active : ""}`}
                  aria-current={active ? "page" : undefined}
                  onClick={onNavigate}
                >
                  <Icon size={18} aria-hidden="true" />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
