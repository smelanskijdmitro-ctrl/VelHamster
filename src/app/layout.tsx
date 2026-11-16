import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "VelHamster — Форум",
  description: "Официальное сообщество VelHamster"
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ru"><body>{children}</body></html>;
}