import type { Metadata } from 'next';
import { JetBrains_Mono } from 'next/font/google';
import './globals.css';

const JetBrainsMono = JetBrains_Mono({
    display: 'swap',
    subsets: ['latin'],
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
                className={`${JetBrainsMono.className} font-mono antialiased`}
            >
                {children}
            </body>
        </html>
    );
}
