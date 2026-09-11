import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

const playfair = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "ComplyWise — AI-Powered Industrial Compliance Intelligence",
  description:
    "Enterprise-grade statutory compliance intelligence, Bureau of Indian Standards (BIS) mandates, Quality Control Orders (QCOs), and automated workflows.",
};

import { BusinessProvider } from "@/context/BusinessContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} h-full antialiased dark`}>
      <body className="min-h-full flex flex-col font-sans bg-[#08080a] text-[#e2e3e9] selection:bg-white/15 selection:text-[#ffffff]">
        <BusinessProvider>{children}</BusinessProvider>
      </body>
    </html>
  );
}
