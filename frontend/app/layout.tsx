import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Playfair_Display } from "next/font/google";
import { Sidebar } from "@/components/sidebar";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair-display",
  subsets: ["latin"],
});

import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "Logos Polis | Intelligence",
  description: "Political Intelligence Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${jetbrainsMono.variable} ${playfairDisplay.variable} dark scroll-smooth`}>
      <body className="antialiased selection:bg-acid selection:text-black bg-obsidian text-neutral-300">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <Sidebar />
          <main className="ml-64 min-h-screen">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
