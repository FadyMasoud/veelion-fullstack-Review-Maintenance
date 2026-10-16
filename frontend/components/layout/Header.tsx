"use client";

import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { NAV_ITEMS, isActivePath } from "@/components/layout/navItems";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import styles from "./Header.module.css";

type HeaderProps = {
  menuOpen: boolean;
  onMenuClick: () => void;
};

export function Header({ menuOpen, onMenuClick }: HeaderProps) {
  const pathname = usePathname();
  const title = NAV_ITEMS.find((item) => isActivePath(pathname, item.href))?.label ?? "Task Manager";

  return (
    <header className={styles.header}>
      <button
        type="button"
        className={`icon-button ${styles.menuButton}`}
        onClick={onMenuClick}
        aria-label="Open menu"
        aria-controls="app-sidebar"
        aria-expanded={menuOpen}
      >
        <Menu size={18} aria-hidden="true" />
      </button>

      <p className={styles.title}>{title}</p>

      <ThemeToggle />
    </header>
  );
}
