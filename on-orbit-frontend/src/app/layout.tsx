import type { Metadata } from "next";
import "./globals.css";
import { worksans } from "./styles/font";

export const metadata: Metadata = {
  title: "On Orbit Collision Predictor",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={worksans.className}>
        {children}
      </body>
    </html>
  );
}
