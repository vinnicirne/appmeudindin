import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";
import { AppLock } from "@/components/ui/AppLock";

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Meu DinDin | Controle Financeiro Descomplicado",
  description: "Seu dinheiro, sob seu controle, sem complicaÃ§Ã£o.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Meu DinDin",
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    "link:material-icons": "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200",
  },
  openGraph: {
    title: "Meu DinDin | Controle Financeiro Descomplicado",
    description: "Seu dinheiro, sob seu controle, sem complicação.",
    url: "https://meudindinapp.vercel.app",
    siteName: "Meu DinDin",
    images: [{ url: "https://meudindinapp.vercel.app/icons/icon-512x512.png", width: 512, height: 512 }],
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Meu DinDin | Controle Financeiro Descomplicado",
    description: "Seu dinheiro, sob seu controle, sem complicação.",
    images: ["https://meudindinapp.vercel.app/icons/icon-512x512.png"],
  }
};

export const viewport: Viewport = {
  themeColor: "#006948",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

import { Toaster } from 'react-hot-toast';
import { InstallPWA } from '@/components/InstallPWA';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pt-BR"
      className={cn("antialiased", "h-full", plusJakartaSans.variable, "font-sans", geist.variable)}
      suppressHydrationWarning
    >
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
          rel="stylesheet"
        />
      </head>
      <body
        className="min-h-screen bg-background text-foreground antialiased flex flex-col"
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <AppLock />
          {children}
          <InstallPWA />
          <Toaster 
            position="top-center"
            containerStyle={{ top: 80 }}
            toastOptions={{
              style: {
                borderRadius: '12px',
                background: 'var(--card)',
                color: 'var(--card-foreground)',
                border: '1px solid var(--border)',
                fontWeight: 'bold',
                fontSize: '14px',
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}

