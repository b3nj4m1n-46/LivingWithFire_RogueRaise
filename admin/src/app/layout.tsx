import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SidebarNav } from "@/components/sidebar-nav";
import { SaveChangesButton } from "@/components/save-changes-button";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LWF Admin",
  description: "Living With Fire — Plant Data Admin Portal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex h-full">
        <SidebarNav />
        <div className="flex flex-1 flex-col overflow-hidden">
          <header className="flex items-center justify-end border-b px-6 py-2">
            <SaveChangesButton />
          </header>
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
