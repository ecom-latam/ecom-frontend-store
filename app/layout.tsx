import type { Metadata } from "next";
import "./globals.css";
import "./zoui.css";

export const metadata: Metadata = {
  title: "ecom store",
  description: "ecom store",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  );
}
