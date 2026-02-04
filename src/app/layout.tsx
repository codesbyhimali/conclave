import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Conclave - Handwriting to Text",
  description: "Convert your handwritten notes to digital text with OCR",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">{children}</body>
    </html>
  );
}
