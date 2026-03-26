import type { ReactNode } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { PrayerFAB } from "@/components/ui/PrayerFAB";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#FFFEF9] dark:bg-black">
      {/* Sidebar desktop */}
      <Navbar />

      {/* Main content */}
      <main className="flex-1 md:overflow-y-auto min-w-0">
        {/* Padding top mobile para a top bar fixa */}
        <div
          className="pt-14 md:pt-0 min-h-full"
          style={{
            paddingBottom: "calc(5rem + env(safe-area-inset-bottom, 0px))",
          }}
        >
          {children}
        </div>
      </main>

      {/* FAB flutuante — Orar agora */}
      <PrayerFAB />
    </div>
  );
}
