import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import Script from "next/script";

export const metadata: Metadata = {
  title: "KookminDashboard",
  description: "국민대학교 조명 제어 대시보드",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link
          href="https://static.tandem.autodesk.com/1.0.620/style.min.css"
          rel="stylesheet"
          type="text/css"
        />
      </head>
      <body className="font-pretendard">
        <Toaster />
        {children}
        <Script
          src="https://static.tandem.autodesk.com/1.0.620/viewer3D.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
