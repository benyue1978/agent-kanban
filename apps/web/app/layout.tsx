import type { Metadata } from "next";
import { IBM_Plex_Mono, Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "agent-kanban",
  description: "Local-first kanban for humans and agents",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(sans.variable, mono.variable, "antialiased")}>
        <ThemeProvider>
          <div className="relative min-h-screen">
            <header className="sticky top-0 z-20 border-b border-border/60 bg-background/70 backdrop-blur-xl">
              <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-8">
                <div className="flex flex-col">
                  <span className="font-mono text-[11px] uppercase tracking-[0.28em] text-primary">
                    Local First Workflow
                  </span>
                  <span className="text-lg font-semibold tracking-[-0.03em] text-foreground">
                    agent-kanban
                  </span>
                </div>
                <nav className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Link
                    href="/inbox"
                    className="hidden rounded-full border border-transparent px-3 py-2 transition hover:border-border/60 hover:bg-white/10 hover:text-foreground md:flex"
                  >
                    Inbox
                  </Link>
                  <span className="hidden rounded-full border border-border/60 bg-white/10 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.22em] text-foreground md:flex">
                    Human Actor
                  </span>
                  <ThemeToggle />
                </nav>
              </div>
            </header>
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
