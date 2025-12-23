import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Clinical Reasoning Trainer",
  description: "Educational simulation for clinical history taking.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={cn(inter.className, "min-h-screen bg-slate-50 font-sans antialiased text-slate-900")}>
        <main className="flex flex-col min-h-screen">
            {children}
        </main>
      </body>
    </html>
  );
}
