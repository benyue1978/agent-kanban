import type { Metadata } from "next";
import { IBM_Plex_Mono, Manrope } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const sans = Manrope({
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
    <html lang="en">
      <body className={cn(sans.variable, mono.variable, "antialiased")}>
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
              <div className="hidden items-center gap-3 text-sm text-muted-foreground md:flex">
                <span>Board</span>
                <span className="text-border">/</span>
                <span>Card Detail</span>
              </div>
            </div>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
