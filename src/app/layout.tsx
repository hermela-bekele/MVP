import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";
import { ToastProvider } from "@/components/ui/toast";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Prime Teaching System",
    template: "%s | Prime Teaching System",
  },
  description: "AI-Powered Education Management Ecosystem for the Ethiopian Education Sector — Empowering schools, teachers, and students through intelligent analytics and streamlined administration.",
  keywords: ["education", "Ethiopia", "school management", "AI", "teaching", "analytics"],
  authors: [{ name: "Prime Teaching System" }],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full`}
      suppressHydrationWarning
    >
      <body
        className="min-h-full flex flex-col bg-background text-foreground transition-colors duration-300 font-[family-name:var(--font-inter)] antialiased"
        suppressHydrationWarning
      >
        <ToastProvider>
          <AppProvider>
            {children}
          </AppProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
