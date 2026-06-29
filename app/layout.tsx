import type { Metadata } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import styles from "./layout.module.scss";
import "./zoui.css";
import NextLink from "next/link";
import NextImage from "next/image";
import { ToastProvider, ZouiProvider, brandScale } from "zoui";
import { CartProvider } from "@/context/CartContext";
import { DynamicStoreTheme } from "@/components/DynamicStoreTheme";
import { getPageInfo } from "@/lib/api/storeClient";
import { ErrorModalProvider } from "@/components/ui/ErrorModal";
import { StoreProvider } from "@/store/StoreProvider";

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
  const storeInfo = await getPageInfo();
  const hue = Math.round(Math.max(0, Math.min(360, storeInfo?.brand_hue ?? 262)));
  const sat = Math.round(Math.max(0, Math.min(100, storeInfo?.brand_saturation ?? 72)));
  const lit = Math.round(Math.max(0, Math.min(100, storeInfo?.brand_lightness ?? 50)));
  // Color secundario para themes de 2 colores (ej. gradient). Si la tienda
  // todavía no lo configuró, se deriva del color principal en vez de caer en un
  // default fijo que ignoraría el brand real del vendedor.
  const hue2 = Math.round(Math.max(0, Math.min(360, storeInfo?.brand2_hue ?? (hue + 60) % 360)));
  const sat2 = Math.round(Math.max(0, Math.min(100, storeInfo?.brand2_saturation ?? sat)));
  const lit2 = Math.round(Math.max(0, Math.min(100, storeInfo?.brand2_lightness ?? lit)));
  const storeTheme = storeInfo?.theme ?? 'outlined';
  const brandContrast = (lit >= 62 || (hue >= 45 && hue <= 75)) ? '#000000' : '#ffffff';
  const fontFamily = storeInfo?.font_family ?? 'Geist';
  const scale = brandScale(hue, sat, lit);
  const scale2 = brandScale(hue2, sat2, lit2);
  const brandStyles = `
    :root {
      --color-brand-50:       ${scale[50]};
      --color-brand-100:      ${scale[100]};
      --color-brand-200:      ${scale[200]};
      --color-brand-300:      ${scale[300]};
      --color-brand-400:      ${scale[400]};
      --color-brand-500:      ${scale[500]};
      --color-brand-600:      ${scale[600]};
      --color-brand-700:      ${scale[700]};
      --color-brand-contrast: ${brandContrast};
      --color-brand2-50:      ${scale2[50]};
      --color-brand2-100:     ${scale2[100]};
      --color-brand2-200:     ${scale2[200]};
      --color-brand2-300:     ${scale2[300]};
      --color-brand2-400:     ${scale2[400]};
      --color-brand2-500:     ${scale2[500]};
      --color-brand2-600:     ${scale2[600]};
      --color-brand2-700:     ${scale2[700]};
      --font-ui:              '${fontFamily}', sans-serif;
    }
  `.trim();

  return (
    <html lang="es" data-theme={theme} data-store-theme={storeTheme}>
      <body className={styles.body}>
        <style dangerouslySetInnerHTML={{ __html: brandStyles }} />
        <StoreProvider>
          <DynamicStoreTheme initialConfig={(storeInfo ?? {}) as Record<string, unknown>}>
            <ZouiProvider linkComponent={NextLink} imageComponent={NextImage}>
              <ToastProvider>
                <ErrorModalProvider>
                  <CartProvider hasSession={hasSession}>
                    {children}
                  </CartProvider>
                </ErrorModalProvider>
              </ToastProvider>
            </ZouiProvider>
          </DynamicStoreTheme>
        </StoreProvider>
      </body>
    </html>
  );
}
