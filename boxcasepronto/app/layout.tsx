import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const display = localFont({
  src: "../public/fonts/anton-400.ttf",
  weight: "400",
  variable: "--font-display",
  display: "swap",
});
const inter = localFont({
  src: [
    { path: "../public/fonts/inter-400.ttf", weight: "400" },
    { path: "../public/fonts/inter-600.ttf", weight: "600" },
    { path: "../public/fonts/inter-700.ttf", weight: "700" },
    { path: "../public/fonts/inter-800.ttf", weight: "800" },
    { path: "../public/fonts/inter-900.ttf", weight: "900" },
  ],
  variable: "--font-body",
  display: "swap",
});

const siteUrl = process.env.URL ?? process.env.DEPLOY_PRIME_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Box | Movimento, força e saúde",
  description: "Treinamento funcional em Mossoró com técnica, acompanhamento e planos para todos os ritmos.",
  icons: { icon: "/favicon.svg" },
  openGraph: { title: "Box | Seu corpo não tem limite", description: "Força, movimento, técnica e comunidade.", images: ["/og.png"], type: "website" },
  twitter: { card: "summary_large_image", title: "Box | Seu corpo não tem limite", description: "Força, movimento, técnica e comunidade.", images: ["/og.png"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className={`${display.variable} ${inter.variable}`}>{children}</body>
    </html>
  );
}
