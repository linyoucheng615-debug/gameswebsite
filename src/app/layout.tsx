import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "週考成績平台 - 國英數學力儀表板",
  description: "補習班國英數週考成績平台：專業學力數據分析與學習激勵系統",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <body className="antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}

