import type { Metadata } from "next";
import LocalFont from 'next/font/local'
import "./globals.css";

const JetBrainsMonoNerdFont = LocalFont({
  src: '../../public/fonts/JetBrainsMonoNerdFont-Regular.ttf',
  display: 'swap',
})

export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${JetBrainsMonoNerdFont.className} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
