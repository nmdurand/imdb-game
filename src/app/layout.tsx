import type { Metadata } from "next";
import "./globals.css";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import "@fontsource/roboto/900.css";
import { Header } from "@/components/Header";

export const metadata: Metadata = {
  title: "imdbGame",
  description: "Guess the movie from its plot",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="overflow-hidden">
        <div className="h-full w-full flex flex-col">
          <Header />
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
