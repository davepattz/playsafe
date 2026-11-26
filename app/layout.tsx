import type { Metadata } from "next";
import { Geist, Geist_Mono, Lato } from "next/font/google";
import Analytics from "@/components/Analytics";
import { isStagingBuild } from "@/lib/staging";
import { SITE_URL } from "@/lib/siteUrl";
import "./globals.css";

const lato = Lato({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-lato",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "PlaySafe.games | Steam parents guides",
  description: "Check available age classifications, content concerns and online features before your child plays a Steam game.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${lato.variable} ${geistSans.variable} ${geistMono.variable} antialiased bg-white min-h-screen`}
      >
        {!isStagingBuild() && process.env.NODE_ENV === "production" && <Analytics />}
        {children}
      </body>
    </html>
  );
}
