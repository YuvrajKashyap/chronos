import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";

const editorial = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-editorial",
  weight: ["500", "600", "700"],
});

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Chronos",
  description: "A lifetime time-investment ledger for Yuvraj Kashyap.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${editorial.variable} ${sans.variable}`}>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                try {
                  var requested = new URLSearchParams(window.location.search).get('theme');
                  if (requested === 'light' || requested === 'dark') {
                    document.documentElement.dataset.theme = requested;
                    return;
                  }
                  var saved = localStorage.getItem('chronos-theme');
                  var theme = saved || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
                  document.documentElement.dataset.theme = theme;
                } catch (_) {
                  document.documentElement.dataset.theme = 'dark';
                }
              })();
            `,
          }}
        />
        {children}
      </body>
    </html>
  );
}
