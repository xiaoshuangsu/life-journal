import type { Metadata } from "next";
import ThemeProvider from "@/components/theme-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Life Journal",
  description: "Your AI-powered personal memory and emotion insight system.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <body className="min-h-full flex flex-col transition-colors duration-500 bg-gradient-to-br from-[#f4f6fa] via-[#edf1f7] to-[#e9ecf3] dark:from-[#11131e] dark:via-[#141724] dark:to-[#1a1c29]">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
