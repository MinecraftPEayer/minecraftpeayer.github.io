import { JetBrains_Mono, Noto_Sans_TC } from 'next/font/google';

// Fonts for the tool pages only.
export const toolSans = Noto_Sans_TC({
    weight: ['400', '600', '700'],
    display: 'swap',
    preload: false,
    variable: '--font-tool-sans',
});

export const toolMono = JetBrains_Mono({
    weight: ['400', '600'],
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-tool-mono',
});

export const toolFontClass = `${toolSans.variable} ${toolMono.variable}`;
