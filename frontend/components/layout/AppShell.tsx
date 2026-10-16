"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import styles from "./AppShell.module.css";

export function AppShell({ children }: { children: ReactNode }) {
  // Only used on small screens, where the sidebar is hidden behind a menu button.
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);

  return (
    <div className={styles.shell}>
      <Sidebar open={menuOpen} onNavigate={() => setMenuOpen(false)} />

      {menuOpen ? (
        <div className={styles.backdrop} onClick={() => setMenuOpen(false)} aria-hidden="true" />
      ) : null}

      <div className={styles.column}>
        <Header menuOpen={menuOpen} onMenuClick={() => setMenuOpen(true)} />
        <main className={styles.content}>{children}</main>
        <Footer />
      </div>
    </div>
  );
}
