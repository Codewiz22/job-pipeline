import { Inter } from "next/font/google";
import "./globals.css";
import config from "../lib/config";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata = {
  title: config.appName,
  description: config.tagline,
  robots: { index: false, follow: false },
};

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f6f4" },
    { media: "(prefers-color-scheme: dark)", color: "#111113" },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
