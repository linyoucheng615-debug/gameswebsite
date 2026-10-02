import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "小六週考對戰與作業管理系統",
  description: "補習班小六「遊戲化週考對戰與作業管理系統」",
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
