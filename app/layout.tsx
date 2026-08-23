/*
 * @Author: SessyoinKirin
 * @Date: 2026-08-18 21:43:45
 * @LastEditors: SessyoinKirin
 * @LastEditTime: 2026-08-19 22:26:20
 * @FilePath: \my-app\app\layout.tsx
 * @Description: 
 * 
 * Copyright (c) 2026 by SessyoinKirin, All Rights Reserved. 
 */
import "./globals.css";
import Navbar from "@/components/Navbar";
import { Metadata } from "next";
export const metadata: Metadata = {
  title: "MongoDB Next.js App",
  description: "A Next.js application with MongoDB integration",
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        {children}
      </body>
    </html>
  );
}