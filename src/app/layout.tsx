import type { Metadata } from "next";
import {
  DM_Sans,
  Playfair_Display,
  Space_Mono,
} from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
});

export const metadata: Metadata = {
  title: "Reelog — Film & Series Diary",
  description:
    "Log films and series, keep a watchlist, and share your personal Top 5.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${dmSans.variable} ${playfair.variable} ${spaceMono.variable}`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}