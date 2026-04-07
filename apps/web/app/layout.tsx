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
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <body className={cn(sans.variable, mono.variable, "antialiased")}>
        <ThemeProvider>
          <div className="relative min-h-screen">
            <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-md">
              <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-4 px-4 py-4 md:px-8">
                <Link href="/" className="group flex flex-col">
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent transition-colors group-hover:text-foreground">
                    Local First Workflow
                  </span>
                  <span className="text-lg font-semibold tracking-[-0.02em] text-foreground">
                    agent-kanban
                  </span>
                </Link>
                <nav className="flex items-center gap-1 text-sm font-medium">
                  <Link
                    href="/inbox"
                    className="px-3 py-1.5 rounded-md text-muted-foreground hover:bg-surface hover:text-foreground transition-all"
                  >
                    Inbox
                  </Link>
                  <div className="h-4 w-[1px] bg-border mx-2" />
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
