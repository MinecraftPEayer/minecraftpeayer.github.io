import MaimaiAudioTool from './component';

export const metadata = {
    title: 'Simai譜面正解音合成器',
    description: '將 Simai 譜面與正解音合成為 MP3 音檔，支援含BGM與無BGM版本。',
};

const Page = () => {
    return <MaimaiAudioTool />;
};

export default Page;
