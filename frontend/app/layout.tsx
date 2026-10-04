import type { Metadata } from "next";
import { Inter, Playfair_Display, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import "@/components/product/product.css";
import ProductBoundary from "@/components/product/ProductBoundary";

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

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "ComplyWise — Know what applies to your business",
  description:
    "Understand what applies to your business, see why, and keep requirements, documents and next steps together.",
};

import { AuthProvider } from "@/context/AuthContext";
import { BusinessProvider } from "@/context/BusinessContext";
import { LanguageProvider } from "@/context/LanguageContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfair.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-[#F7F5EF] text-[#171714] selection:bg-[#DCEAE2] selection:text-[#171714]">
        <LanguageProvider>
          <AuthProvider>
            <BusinessProvider><ProductBoundary>{children}</ProductBoundary></BusinessProvider>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
