'use client';

import React, { useState, useRef } from 'react';
import Script from 'next/script';

const DIFF_NAMES: Record<string, string> = {
    '1': 'EASY',
    '2': 'BASIC',
    '3': 'ADVANCED',
    '4': 'EXPERT',
    '5': 'MASTER',
    '6': 'Re:MASTER',
};

// --- 自訂播放器元件 ---
const CustomAudioPlayer = ({
    src,
    duration,
    filename,
    title,
}: {
    src: string;
    duration: number;
    filename: string;
    title: string;
}) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);

    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) audioRef.current.pause();
            else audioRef.current.play();
            setIsPlaying(!isPlaying);
        }
    };

    const formatTime = (secs: number) => {
        if (isNaN(secs)) return '0:00';
        const m = Math.floor(secs / 60);
        const s = Math.floor(secs % 60)
            .toString()
            .padStart(2, '0');
        return `${m}:${s}`;
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = Number(e.target.value);
        if (audioRef.current) audioRef.current.currentTime = time;
        setCurrentTime(time);
    };

    return (
        <div className="p-4 bg-gray-50 rounded-lg border">
            <h3 className="font-bold text-gray-800 mb-3">{title}</h3>
            <audio
                ref={audioRef}
                src={src}
                onTimeUpdate={() =>
                    setCurrentTime(audioRef.current?.currentTime || 0)
                }
                onEnded={() => {
                    setIsPlaying(false);
                    setCurrentTime(0);
                }}
            />
            <div className="flex items-center gap-3">
                <button
                    onClick={togglePlay}
                    className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-blue-600 text-white rounded-full hover:bg-blue-700 transition"
                >
                    {isPlaying ? '⏸' : '▶'}
                </button>
                <span className="text-sm font-mono w-10 text-right text-gray-600">
                    {formatTime(currentTime)}
                </span>
                <input
                    type="range"
                    min="0"
                    max={duration || 100}
                    step="0.1"
                    value={currentTime}
                    onChange={handleSeek}
                    className="flex-1 h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <span className="text-sm font-mono w-10 text-gray-600">
                    {formatTime(duration)}
                </span>
            </div>
            <a
                href={src}
                download={filename}
                className="mt-4 block text-center py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-bold transition"
            >
                 下載 MP3
            </a>
        </div>
    );
};

export const metadata = {
    title: 'Simai譜面正解音合成器',
    description: '將 Simai 譜面與正解音合成為 MP3 音檔，支援含BGM與無BGM版本。',
};

export default function MaimaiAudioTool() {
    const [status, setStatus] = useState('等待上傳檔案...');
    const [progress, setProgress] = useState(0);
    const [chartData, setChartData] = useState<Record<string, string>>({});
    const [songTitle, setSongTitle] = useState('Unknown');
    const [globalBpm, setGlobalBpm] = useState(120);
    const [firstOffset, setFirstOffset] = useState(0);
    const [songDuration, setSongDuration] = useState(0);
    const [results, setResults] = useState<{
        withBgm?: string;
        withoutBgm?: string;
        filenames: string[];
    }>({ filenames: [] });
    const [isProcessing, setIsProcessing] = useState(false);

    const songFileRef = useRef<HTMLInputElement>(null);
    const maidaFileRef = useRef<HTMLInputElement>(null);
    const hitFileRef = useRef<HTMLInputElement>(null);
    const diffSelectRef = useRef<HTMLSelectElement>(null);

    const updateProgress = async (percent: number, text: string) => {
        setProgress(percent);
        setStatus(text);
        await new Promise((resolve) => setTimeout(resolve, 5));
    };

    const handleMaidataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            const data: Record<string, string> = {};
            let title = 'Unknown';
            let bpm = 120;
            let offset = 0;
            const tagRegex = /&([a-zA-Z0-9_]+)=([\s\S]*?)(?=\n&|&|$)/g;
            let match;
            while ((match = tagRegex.exec(text)) !== null) {
                const key = match[1].toLowerCase();
                const val = match[2].trim();
                if (key.startsWith('inote_')) data[key] = val;
                else if (key === 'title') title = val;
                else if (key === 'bpm') bpm = parseFloat(val) || 120;
                else if (key === 'first') offset = parseFloat(val) || 0;
            }
            setChartData(data);
            setSongTitle(title);
            setGlobalBpm(bpm);
            setFirstOffset(offset);
            setStatus(`已載入譜面：${title}`);
        };
        reader.readAsText(file);
    };

    const handleSongChange = () => {
        if (maidaFileRef.current) maidaFileRef.current.value = '';
        setChartData({});
        setSongTitle('Unknown');
    };

    const handleFolderSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;
        let foundSong, foundMaida;
        for (let i = 0; i < files.length; i++) {
            const f = files[i];
            const name = f.name.toLowerCase();
            if (name.startsWith('track.') && /\.(mp3|wav|ogg)$/.test(name))
                foundSong = f;
            if (name === 'maidata.txt') foundMaida = f;
        }
        if (foundSong && songFileRef.current) {
            const dt = new DataTransfer();
            dt.items.add(foundSong);
            songFileRef.current.files = dt.files;
            handleSongChange();
        }
        if (foundMaida && maidaFileRef.current) {
            const dt = new DataTransfer();
            dt.items.add(foundMaida);
            maidaFileRef.current.files = dt.files;
            // 使用 unknown 轉型避免 TypeScript 錯誤
            const event = {
                target: { files: dt.files },
            } as unknown as React.ChangeEvent<HTMLInputElement>;
            handleMaidataChange(event);
        }
        if (foundSong && foundMaida)
            setStatus(`成功載入：${foundSong.name} 與 maidata.txt！`);
        else if (foundSong || foundMaida)
            setStatus(
                `僅找到 ${foundSong ? foundSong.name : foundMaida!.name}，請手動補齊。`,
            );
        else setStatus(`未在資料夾中找到 track.* 或 maidata.txt。`);
        e.target.value = '';
    };

    const parseSimaiTime = (chartString: string) => {
        const rawTimes: number[] = [];
        let currentBpm = globalBpm;
        let currentBeat = 4;
        let currentTime = firstOffset;
        const chunks = chartString
            .replace(/\|\|.*/g, '')
            .replace(/\s+/g, '')
            .split(',');

        for (const chunk of chunks) {
            if (chunk === '' || chunk === 'E') {
                currentTime += ((60 / currentBpm) * 4) / currentBeat;
                continue;
            }
            const bpmMatch = chunk.match(/\(([\d.]+)\)/);
            if (bpmMatch) currentBpm = parseFloat(bpmMatch[1]);
            const beatMatch = chunk.match(/\{([\d.]+)\}/);
            if (beatMatch) currentBeat = parseFloat(beatMatch[1]);

            const noteArea = chunk
                .replace(/\([\d.]+\)/g, '')
                .replace(/\{[\d.]+\}/g, '');
            if (/[1-8A-E]/.test(noteArea)) rawTimes.push(currentTime);

            const holdMatches = [...noteArea.matchAll(/h\[([\d.:#]+)\]/g)];
            holdMatches.forEach((m) => {
                const content = m[1];
                let duration = 0;
                if (content.startsWith('#'))
                    duration = parseFloat(content.substring(1));
                else if (content.includes(':')) {
                    const [hBeat, hLen] = content.split(':').map(parseFloat);
                    duration = (((60 / currentBpm) * 4) / hBeat) * hLen;
                }
                rawTimes.push(currentTime + duration);
            });
            currentTime += ((60 / currentBpm) * 4) / currentBeat;
        }
        return [
            ...new Set(rawTimes.map((t) => Math.round(t * 10000) / 10000)),
        ].sort((a, b) => a - b);
    };

    const bufferToMp3Async = async (
        abuffer: AudioBuffer,
        onProgress: (c: number, t: number) => Promise<void>,
    ) => {
        const nCh = abuffer.numberOfChannels;
        const sampleRate = abuffer.sampleRate;
        const totalLen = abuffer.length;
        const leftData = abuffer.getChannelData(0);
        const rightData = nCh > 1 ? abuffer.getChannelData(1) : leftData;

        // @ts-expect-error - lamejs 透過 CDN 載入，全域變數可能缺乏型別定義
        const mp3encoder = new window.lamejs.Mp3Encoder(2, sampleRate, 192);
        const mp3Data: Int8Array[] = [];
        const sampleBlockSize = 1152 * 40;

        for (let i = 0; i < totalLen; i += sampleBlockSize) {
            const end = Math.min(i + sampleBlockSize, totalLen);
            const len = end - i;
            const leftChunk = new Int16Array(len);
            const rightChunk = new Int16Array(len);

            for (let j = 0; j < len; j++) {
                const sL = Math.max(-1, Math.min(1, leftData[i + j]));
                leftChunk[j] = sL < 0 ? sL * 32768 : sL * 32767;
                const sR = Math.max(-1, Math.min(1, rightData[i + j]));
                rightChunk[j] = sR < 0 ? sR * 32768 : sR * 32767;
            }

            const mp3buf = mp3encoder.encodeBuffer(leftChunk, rightChunk);
            if (mp3buf.length > 0) mp3Data.push(mp3buf);
            if (onProgress) await onProgress(end, totalLen);
        }

        const finalMp3buf = mp3encoder.flush();
        if (finalMp3buf.length > 0) mp3Data.push(finalMp3buf);
        return new Blob(mp3Data as BlobPart[], { type: 'audio/mp3' });
    };

    const startProcess = async () => {
        const songFile = songFileRef.current?.files?.[0];
        const hitFile = hitFileRef.current?.files?.[0];
        const selectedKey = diffSelectRef.current?.value;

        if (!songFile || !hitFile || !selectedKey) return alert('檔案不足！');

        // @ts-expect-error - 檢查全域的 lamejs 是否存在
        if (typeof window.lamejs === 'undefined')
            return alert('MP3 編碼器載入失敗，請確認網路連線。');

        const diffLabel = DIFF_NAMES[selectedKey.split('_')[1]] || 'Difficulty';

        try {
            setIsProcessing(true);
            setResults({ filenames: [] });
            await updateProgress(5, '正在解碼音訊...');

            const ctx = new AudioContext();
            const songBuf = await ctx.decodeAudioData(
                await songFile.arrayBuffer(),
            );
            const hitBuf = await ctx.decodeAudioData(
                await hitFile.arrayBuffer(),
            );
            setSongDuration(songBuf.duration);

            await updateProgress(10, '正在解析譜面時間軸...');
            const hitTimes = parseSimaiTime(chartData[selectedKey]);
            const totalNotes = hitTimes.length;
            const noteChunk = 200;

            // 1. With BGM
            const ctxWith = new OfflineAudioContext(
                songBuf.numberOfChannels,
                songBuf.length,
                songBuf.sampleRate,
            );
            const songSource = ctxWith.createBufferSource();
            songSource.buffer = songBuf;
            songSource.connect(ctxWith.destination);
            songSource.start(0);

            for (let i = 0; i < totalNotes; i += noteChunk) {
                const end = Math.min(i + noteChunk, totalNotes);
                for (let j = i; j < end; j++) {
                    const t = hitTimes[j];
                    if (t >= 0 && t < songBuf.duration) {
                        const hitSource = ctxWith.createBufferSource();
                        hitSource.buffer = hitBuf;
                        hitSource.connect(ctxWith.destination);
                        hitSource.start(t);
                    }
                }
                await updateProgress(
                    10 + (end / totalNotes) * 5,
                    `準備含BGM圖譜 (${end}/${totalNotes})`,
                );
            }

            await updateProgress(15, '正在渲染含BGM音軌...');
            const withBuf = await ctxWith.startRendering();
            const withBlob = await bufferToMp3Async(
                withBuf,
                async (current, total) => {
                    await updateProgress(
                        15 + (current / total) * 35,
                        `壓縮含BGM的 MP3 (${current}/${total})`,
                    );
                },
            );

            // 2. Without BGM
            const ctxWithout = new OfflineAudioContext(
                songBuf.numberOfChannels,
                songBuf.length,
                songBuf.sampleRate,
            );
            for (let i = 0; i < totalNotes; i += noteChunk) {
                const end = Math.min(i + noteChunk, totalNotes);
                for (let j = i; j < end; j++) {
                    const t = hitTimes[j];
                    if (t >= 0 && t < songBuf.duration) {
                        const hitSource = ctxWithout.createBufferSource();
                        hitSource.buffer = hitBuf;
                        hitSource.connect(ctxWithout.destination);
                        hitSource.start(t);
                    }
                }
                await updateProgress(
                    50 + (end / totalNotes) * 5,
                    `準備無BGM圖譜 (${end}/${totalNotes})`,
                );
            }

            await updateProgress(55, '正在渲染無BGM音軌...');
            const withoutBuf = await ctxWithout.startRendering();
            const withoutBlob = await bufferToMp3Async(
                withoutBuf,
                async (current, total) => {
                    await updateProgress(
                        55 + (current / total) * 45,
                        `壓縮無BGM的 MP3 (${current}/${total})`,
                    );
                },
            );

            setResults({
                withBgm: URL.createObjectURL(withBlob),
                withoutBgm: URL.createObjectURL(withoutBlob),
                filenames: [
                    `${songTitle}_${diffLabel}_with_BGM.mp3`,
                    `${songTitle}_${diffLabel}_without_BGM.mp3`,
                ],
            });
            await updateProgress(100, 'MP3 壓縮與合成完成！');
        } catch (err) {
            console.error(err);
            setStatus('發生錯誤，請查看開發者控制台(F12)。');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto p-8 bg-white shadow-xl rounded-2xl my-10">
            <Script
                src="https://cdnjs.cloudflare.com/ajax/libs/lamejs/1.2.1/lame.min.js"
                strategy="beforeInteractive"
            />

            <h1 className="text-3xl font-bold text-center text-blue-600 mb-8">
                Maimai 譜面正解音合成器
            </h1>

            <div className="mb-6 p-5 bg-blue-50 border-2 border-dashed border-blue-300 rounded-xl">
                <label className="block text-blue-800 font-bold mb-2 text-lg">
                    󰉖 快速資料夾匯入
                </label>
                <input
                    type="file"
                    onChange={handleFolderSelect}
                    // @ts-expect-error - webkitdirectory 在 HTML input 中是存在的，但 TypeScript 預設的 DOM 型別並未包含
                    webkitdirectory=""
                    directory=""
                    className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                />
                <p className="text-sm text-gray-500 mt-2">
                    （自動尋找資料夾中的 <b>track.mp3/wav/ogg</b> 與{' '}
                    <b>maidata.txt</b>）
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="flex flex-col">
                    <label className="font-semibold text-gray-700 mb-1">
                        1. 歌曲音檔
                    </label>
                    <input
                        type="file"
                        ref={songFileRef}
                        onChange={handleSongChange}
                        accept="audio/*"
                        className="border p-2 rounded-lg w-full bg-gray-50"
                    />
                </div>
                <div className="flex flex-col">
                    <label className="font-semibold text-gray-700 mb-1">
                        2. maidata.txt
                    </label>
                    <input
                        type="file"
                        ref={maidaFileRef}
                        onChange={handleMaidataChange}
                        accept=".txt"
                        className="border p-2 rounded-lg w-full bg-gray-50"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="flex flex-col">
                    <label className="font-semibold text-gray-700 mb-1">
                        3. 正解音 (Answer Sound)
                    </label>
                    <input
                        type="file"
                        ref={hitFileRef}
                        accept="audio/*"
                        className="border p-2 rounded-lg w-full bg-gray-50"
                    />
                </div>
                <div className="flex flex-col">
                    <label className="font-semibold text-gray-700 mb-1">
                        4. 選擇難度
                    </label>
                    <select
                        ref={diffSelectRef}
                        className="border p-2 rounded-lg w-full bg-white"
                    >
                        {Object.keys(chartData).length === 0 ? (
                            <option value="">請先讀取譜面...</option>
                        ) : (
                            Object.keys(chartData).map((key) => (
                                <option key={key} value={key}>
                                    {DIFF_NAMES[key.split('_')[1]] || key}
                                </option>
                            ))
                        )}
                    </select>
                </div>
            </div>

            <button
                onClick={startProcess}
                disabled={isProcessing}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white text-lg font-bold rounded-xl transition-all disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
                {isProcessing ? '處理中...' : '壓縮合成 MP3 音檔'}
            </button>

            {(progress > 0 || isProcessing) && (
                <div className="mt-6">
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div
                            className="bg-green-500 h-full transition-all duration-75"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                    <p className="text-center mt-2 font-bold text-orange-600">
                        {status}
                    </p>
                </div>
            )}

            {results.withBgm && results.withoutBgm && (
                <div className="mt-8 space-y-4 border-t pt-8">
                    <CustomAudioPlayer
                        src={results.withBgm}
                        duration={songDuration}
                        filename={results.filenames[0]}
                        title="🎵 包含背景音樂 (With BGM) - MP3"
                    />
                    <CustomAudioPlayer
                        src={results.withoutBgm}
                        duration={songDuration}
                        filename={results.filenames[1]}
                        title="🥁 僅正解音 (Without BGM) - MP3"
                    />
                </div>
            )}

            <div className="mt-12 text-center text-xs text-gray-400 font-mono tracking-widest border-t pt-4">
                This page is AI generated.
            </div>
        </div>
    );
}
