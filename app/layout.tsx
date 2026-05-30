import type { Metadata } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import "./zoui.css";
import { ToastProvider } from "zoui";
import { CartProvider } from "@/context/CartContext";
import { DynamicStoreTheme } from "@/components/DynamicStoreTheme";
import { getStoreInfo } from "@/lib/api/storeClient";
import { ErrorModalProvider } from "@/components/ui/ErrorModal";

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
  const hasSession = !!cookieStore.get('_auth');
  const theme = (cookieStore.get('ui-theme')?.value ?? 'light') as 'light' | 'dark';
  const storeInfo = await getStoreInfo();
  const hue = Math.round(Math.max(0, Math.min(360, storeInfo?.brand_hue ?? 262)));
  const storeTheme = storeInfo?.components_presets?.button ?? 'primary';
  const brandContrast = hue >= 45 && hue <= 75 ? '#000000' : '#ffffff';
  const fontFamily = storeInfo?.font_family ?? 'Geist';
  const brandStyles = `
    :root {
      --color-brand-50:       hsl(${hue}, 95%, 97%);
      --color-brand-100:      hsl(${hue}, 90%, 93%);
      --color-brand-200:      hsl(${hue}, 85%, 86%);
      --color-brand-300:      hsl(${hue}, 80%, 75%);
      --color-brand-400:      hsl(${hue}, 75%, 62%);
      --color-brand-500:      hsl(${hue}, 72%, 50%);
      --color-brand-600:      hsl(${hue}, 75%, 42%);
      --color-brand-700:      hsl(${hue}, 80%, 34%);
      --color-brand-contrast: ${brandContrast};
      --font-ui:              '${fontFamily}', sans-serif;
    }
  `.trim();

  return (
    <html lang="es" data-theme={theme} data-store-theme={storeTheme}>
      <body className="antialiased flex flex-col min-h-screen">
        <style dangerouslySetInnerHTML={{ __html: brandStyles }} />
        <DynamicStoreTheme initialConfig={(storeInfo ?? {}) as Record<string, unknown>}>
          <ToastProvider>
            <ErrorModalProvider>
              <CartProvider hasSession={hasSession}>
                {children}
              </CartProvider>
            </ErrorModalProvider>
          </ToastProvider>
        </DynamicStoreTheme>
      </body>
    </html>
  );
}
