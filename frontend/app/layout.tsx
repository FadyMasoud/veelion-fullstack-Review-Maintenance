import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import "./globals.css";

export const metadata: Metadata = {
  title: "Task Manager",
  description: "Task dashboard, activity feed and reports",
};

// Runs before the page is painted, so a saved dark theme doesn't flash light first.
// Uses the saved choice, or the system setting if nothing was saved yet.
const themeScript = `(function () {
  try {
    var theme = localStorage.getItem("theme");
    if (theme !== "light" && theme !== "dark") {
      theme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    document.documentElement.dataset.theme = theme;
  } catch (error) {
    document.documentElement.dataset.theme = "light";
  }
})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // The script above changes data-theme before React loads, so the server and
    // client <html> attributes can differ on purpose.
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
