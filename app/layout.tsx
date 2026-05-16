import type { Metadata } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import { ToastProvider } from "zoui";
import "zoui/styles";
import { CartProvider } from "@/context/CartContext";

export const metadata: Metadata = {
  title: "ecom store",
  description: "ecom store",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const hasSession = !!cookieStore.get('session');

  return (
    <html lang="es">
      <body className="antialiased">
        <ToastProvider>
          <CartProvider hasSession={hasSession}>
            {children}
          </CartProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
