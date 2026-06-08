import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { SessionProvider } from "@/components/auth/SessionProvider";
import { JungleCursorSync } from "@/components/cursor/JungleCursorSync";
import { JungleCornerDecorations } from "@/components/JungleCornerDecorations";
import { MobileRouteGuard } from "@/components/mobile/MobileRouteGuard";

export const metadata: Metadata = {
  title: "Obnofi",
  description: "A Notion-like workspace with publishing",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className="h-full antialiased"
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Averia+Serif+Libre:ital,wght@0,300;0,400;0,700;1,300;1,400;1,700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css"
          rel="stylesheet"
        />
        <Script id="theme-init" strategy="beforeInteractive">
          {`
            (() => {
              const root = document.documentElement;
              const media = window.matchMedia("(prefers-color-scheme: dark)");
              const storedTheme = window.localStorage.getItem("obnofi-theme");
              const applyTheme = (theme) => {
                root.classList.remove("dark", "jungle");
                if (theme === "dark") {
                  root.classList.add("dark");
                  root.style.colorScheme = "dark";
                  return;
                }
                if (theme === "jungle") {
                  root.classList.add("jungle");
                  root.style.colorScheme = "light";
                  return;
                }
                root.style.colorScheme = "light";
              };

              if (storedTheme === "light" || storedTheme === "dark" || storedTheme === "jungle") {
                applyTheme(storedTheme);
              } else {
                applyTheme(media.matches ? "dark" : "light");
              }
            })();
          `}
        </Script>
      </head>
      <body className="min-h-full flex flex-col">
        <SessionProvider>
          <JungleCursorSync />
          <JungleCornerDecorations />
          <MobileRouteGuard>{children}</MobileRouteGuard>
        </SessionProvider>
      </body>
    </html>
  );
}
