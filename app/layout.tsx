import type { Metadata } from "next";
import Navbar from "./components/navbar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sinau Bareng",
  description: "Ruang terbuka buat bikin soal, jawab bareng, dan belajar dari satu sama lain.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-white">
        <Navbar />
        {children}
      </body>
    </html>
  );
}