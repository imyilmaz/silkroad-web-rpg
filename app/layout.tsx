import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "../styles/main.scss";
import { ActiveCharacterProvider } from "@/context/ActiveCharacterContext";
import { InventoryProvider } from "@/context/InventoryContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Milkroad Online",
  description: "Süt yollarının efsanevi macerası.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <ActiveCharacterProvider>
          <InventoryProvider>
            <Toaster position="top-center" richColors />
            {children}
          </InventoryProvider>
        </ActiveCharacterProvider>
      </body>
    </html>
  );
}
