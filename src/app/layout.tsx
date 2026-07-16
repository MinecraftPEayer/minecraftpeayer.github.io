import type { Metadata } from 'next';
import { JetBrains_Mono } from 'next/font/google';
import localFont from 'next/font/local';
import './globals.css';

const jetbrainsMonoNerd = localFont({
  src: '../../public/fonts/JetBrainsMonoNerdFont-Regular.ttf',
  variable: '--font-nerd',
  display: 'swap',
});

export const metadata: Metadata = {
    title: 'MinecraftPEayer',
    description: 'Just a noob Full-Stack developer',
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body
                className={`${jetbrainsMonoNerd.variable} font-mono antialiased`}
            >
                {children}
            </body>
        </html>
    );
}

