import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { cookies } from "next/headers";
import { getSiteUrl } from "@/lib/site-url";
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
  metadataBase: getSiteUrl(),
  applicationName: "Chronos",
  title: {
    default: "Chronos — Time Investment Ledger",
    template: "%s | Chronos",
  },
  description:
    "A public proof-of-work dashboard and private time-investment ledger for durable skill totals, live sessions, and personal analytics.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "/",
    title: "Chronos — Time Investment Ledger",
    description:
      "Track where time compounds through durable skill totals, live sessions, and a public-safe proof-of-work view.",
    siteName: "Chronos",
    images: [
      {
        url: "/portfolio-hero.png",
        width: 1234,
        height: 712,
        alt: "Chronos public time-investment dashboard",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Chronos — Time Investment Ledger",
    description: "A public proof-of-work dashboard backed by a private, authenticated time ledger.",
    images: ["/portfolio-hero.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/favicon.ico"],
  },
  appleWebApp: {
    title: "Chronos",
    capable: true,
    statusBarStyle: "black-translucent",
  },
};

type Theme = "light" | "dark";

function isTheme(value: string | undefined): value is Theme {
  return value === "light" || value === "dark";
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const cookieTheme = cookieStore.get("chronos-theme")?.value;
  const initialTheme = isTheme(cookieTheme) ? cookieTheme : undefined;

  return (
    <html lang="en" data-theme={initialTheme} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                var fallbackTheme = 'dark';
                var storageKey = 'chronos-theme';
                var cookieName = 'chronos-theme';

                function isTheme(value) {
                  return value === 'light' || value === 'dark';
                }

                function getCookieTheme() {
                  var parts = document.cookie ? document.cookie.split('; ') : [];
                  for (var index = 0; index < parts.length; index += 1) {
                    var pair = parts[index].split('=');
                    if (pair[0] === cookieName && isTheme(pair[1])) {
                      return pair[1];
                    }
                  }
                  return null;
                }

                function persistTheme(theme) {
                  try {
                    localStorage.setItem(storageKey, theme);
                  } catch (_) {}
                  document.cookie = cookieName + '=' + theme + '; Path=/; Max-Age=31536000; SameSite=Lax';
                }

                function applyTheme(theme) {
                  document.documentElement.dataset.theme = theme;
                  document.documentElement.style.colorScheme = theme;
                }

                try {
                  var saved = localStorage.getItem(storageKey);
                  var cookieTheme = getCookieTheme();
                  var requested = new URLSearchParams(window.location.search).get('theme');
                  var systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  var theme = isTheme(saved) ? saved : isTheme(cookieTheme) ? cookieTheme : isTheme(requested) ? requested : systemTheme;

                  applyTheme(theme);

                  if (!isTheme(saved) || cookieTheme !== theme || (isTheme(requested) && !isTheme(saved))) {
                    persistTheme(theme);
                  }
                } catch (_) {
                  applyTheme(fallbackTheme);
                }
              })();
            `,
          }}
        />
      </head>
      <body className={`${editorial.variable} ${sans.variable}`}>
        {children}
      </body>
    </html>
  );
}
