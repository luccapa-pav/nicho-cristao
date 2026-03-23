import type { ReactNode } from "react";
import { Navbar } from "@/components/layout/Navbar";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "#FFFEF9" }}>
      {/* Sidebar desktop */}
      <Navbar />

      {/* Main content */}
      <main className="flex-1 md:overflow-y-auto min-w-0">
        {/* Padding top mobile para a top bar fixa */}
        <div className="pt-14 md:pt-0 pb-20 md:pb-0 min-h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
