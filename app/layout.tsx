import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import ChatBootstrapLoader from "@/components/chat/ChatBootstrapLoader";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ABA — Find Trusted Local Businesses",
  description:
    "A curated directory of premium, verified local businesses. Find legal, finance, creative, health, and real estate services near you.",
  keywords: ["business directory", "local businesses", "verified services", "ABA"],
  openGraph: {
    title: "ABA — Find Trusted Local Businesses",
    description: "Discover and connect with elite local businesses near you.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
        />
      </head>
      <body className={`${inter.variable} antialiased`}>
        <AuthProvider>
          <ChatBootstrapLoader />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
