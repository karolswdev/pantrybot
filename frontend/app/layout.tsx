import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import Providers from "@/components/providers/Providers";

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  weight: ["400", "500", "600", "700", "800"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#10b981",
};

export const metadata: Metadata = {
  title: "Pantrybot - Keep Food Fresh, Waste Less",
  description: "Your fun & easy kitchen companion for tracking food, reducing waste, and saving money!",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={nunito.variable}>
      <body className="font-sans antialiased bg-gradient-to-b from-gray-50 to-white min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
