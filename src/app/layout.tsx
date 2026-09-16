import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ITM games // 清大科管所賽事系統",
  description: "清大科管所賽事系統 - 專為各項競賽打造之智慧賽事排程、對戰時間媒合與戰績管理平台",
};

import Navbar from "@/components/layout/Navbar";
import MobileNav from "@/components/layout/MobileNav";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW" className="dark">
      <body className="bg-cyber-darkest text-slate-100 antialiased selection:bg-cyber-red selection:text-white min-h-screen flex flex-col">
        {/* Background glow ambiance */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-cyber-red/10 blur-[140px] rounded-full" />
          <div className="absolute top-1/3 -right-40 w-[600px] h-[600px] bg-cyber-cyan/5 blur-[160px] rounded-full" />
          <div className="absolute bottom-0 -left-20 w-[500px] h-[500px] bg-cyber-purple/5 blur-[160px] rounded-full" />
        </div>

        {/* Global Content Container */}
        <div className="relative z-10 flex flex-col flex-1 pb-16 sm:pb-0">
          <Navbar />
          {children}
          <MobileNav />
        </div>
      </body>
    </html>
  );
}

