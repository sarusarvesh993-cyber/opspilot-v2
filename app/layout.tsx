import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://opspilot-v2.vercel.app"),
  title: "OpsPilot v2 | AI DevSecOps Copilot Demo",
  description:
    "A portfolio demonstration of a secure AI chat endpoint and simulated DevSecOps operations dashboard.",
  openGraph: {
    title: "OpsPilot v2",
    description: "AI DevSecOps copilot and operations dashboard demonstration.",
    type: "website",
  },
};

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#030712",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
