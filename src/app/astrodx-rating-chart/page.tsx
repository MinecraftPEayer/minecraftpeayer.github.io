import type { Metadata } from 'next';
import ChartApp from './chart-app';

export const metadata: Metadata = {
    title: 'AstroDX Rating Chart | MinecraftPEayer',
    description: '將 AstroDX 成績匯出檔繪製成 Rating 組成表。',
};

export default function Page() {
    return <ChartApp />;
}
