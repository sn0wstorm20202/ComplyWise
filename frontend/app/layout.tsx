import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "ComplyWise — BIS Compliance Intelligence",
  description:
    "Enterprise-grade Bureau of Indian Standards (BIS) compliance intelligence, quality control orders, and statutory workflows.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${plusJakarta.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans bg-[#edf0f6] text-slate-900 selection:bg-slate-200">
        {children}
      </body>
    </html>
  );
}
