import type { Metadata } from "next";
import type { ReactNode } from "react";
import Providers from "@/components/Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Health",
  description: "A simple, private place to log daily health data.",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans min-h-screen antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
