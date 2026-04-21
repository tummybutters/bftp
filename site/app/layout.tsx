import type { Metadata } from "next";
import { Lato, PT_Sans } from "next/font/google";
import "./globals.css";
import { PostHogProvider } from "@/lib/analytics";

const bodyFont = Lato({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "700", "900"],
});

const displayFont = PT_Sans({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.backflowtestpros.com"),
  title: "Backflow Test Pros - Rebuild Foundation",
  description:
    "Structural rebuild for the Backflow Test Pros website using a path-driven Next.js template registry.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${bodyFont.variable} ${displayFont.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <PostHogProvider>{children}</PostHogProvider>
      </body>
    </html>
  );
}
