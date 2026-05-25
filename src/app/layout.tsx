import type { Metadata } from "next";
import "./globals.css";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import "@fontsource/roboto/900.css";
import { Header } from "@/components/Header";
import { getServerLocale } from "@/lib/locale";
import { getDict } from "@/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const dict = getDict(await getServerLocale());
  return {
    title: dict.metadata.title,
    description: dict.metadata.description,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getServerLocale();
  const dict = getDict(locale);
  return (
    <html lang={locale}>
      <body className="overflow-hidden">
        <div className="h-full w-full flex flex-col">
          <Header locale={locale} dict={dict.header} />
          <main className="flex-1 min-h-0 overflow-y-auto">
            <div className="min-h-full p-4 flex flex-col items-center justify-center">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
