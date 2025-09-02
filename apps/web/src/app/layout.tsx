import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { TrpcProvider } from "@/components/providers/trpc-provider";
import { AuthProvider } from "@/components/providers/session-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Synfind - Academic Publishing Platform",
  description: "Modern academic journal publishing platform with peer review and multi-publisher support",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <TrpcProvider>
            {children}
          </TrpcProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
