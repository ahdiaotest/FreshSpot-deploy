import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "鲜点 FreshSpot",
  description:
    "JB live status cards + voucher relay for SG↔MY visitors · 新山实况与券池",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#059669",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hans">
      <body className="min-h-screen bg-stone-100 antialiased">
        {children}
      </body>
    </html>
  );
}
