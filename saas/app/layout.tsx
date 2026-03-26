import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Lora, Cormorant_Garamond } from "next/font/google";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { FontSizeProvider } from "@/components/providers/FontSizeProvider";
import { SwRegistrar } from "@/components/providers/SwRegistrar";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-cormorant",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Vida com Jesus — Sua Jornada de Fé",
    template: "%s | Vida com Jesus",
  },
  description: "365 dias de crescimento espiritual com comunidade, devocionais e pedidos de oração.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Vida com Jesus",
    statusBarStyle: "black-translucent",
  },
  formatDetection: { telephone: false },
  verification: {
    google: "AeO76Ca8lYzhp9SjBlfCNMwAtlbKwS-toLhslSvM8N0",
  },
  icons: {
    icon: [
      { url: "/cross-crown.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/cross-crown.svg", type: "image/svg+xml" },
    ],
    shortcut: "/cross-crown.svg",
  },
  openGraph: {
    title: "Vida com Jesus — Sua Jornada de Fé",
    description: "365 dias de crescimento espiritual com comunidade, devocionais e pedidos de oração.",
    type: "website",
    siteName: "Vida com Jesus",
    locale: "pt_BR",
  },
  twitter: {
    card: "summary",
    title: "Vida com Jesus",
    description: "365 dias de crescimento espiritual com comunidade, devocionais e pedidos de oração.",
  },
  other: {
    "msapplication-TileColor": "#D4AF37",
    "msapplication-config": "none",
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#D4AF37" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className={`${lora.variable} ${cormorant.variable}`}>
      <head>
        {/* Aplica o tema antes do React hidratar — evita flash branco→escuro */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('luz-theme');document.documentElement.classList.toggle('dark',!t||t==='dark');}catch(e){}})()`,
          }}
        />
      </head>
      <body className="min-h-screen antialiased">
        <ThemeProvider>
          <FontSizeProvider>
            <SwRegistrar />
            <SessionProvider>{children}</SessionProvider>
          </FontSizeProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
