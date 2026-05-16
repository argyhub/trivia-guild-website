import type { Metadata } from "next";
import Navbar from "./components/Navbar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trivia Guild",
  description: "Athens' premier pub quiz experience",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="el" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-body">
        <Navbar />
        <div className="flex-1 flex flex-col pt-[60px]">
          {children}
        </div>
      </body>
    </html>
  );
}
