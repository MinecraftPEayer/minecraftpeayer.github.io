import { Mp3Encoder } from '@breezystack/lamejs';
import type { AnswerEvent } from './simai';

export interface RenderOptions {
    song: AudioBuffer;
    normalSound: AudioBuffer;
    breakSound?: AudioBuffer;
    events: AnswerEvent[];
    includeBgm: boolean;
    answerVolume: number;
    breakVolume: number;
    onProgress?: (progress: number) => Promise<void>;
}

const yieldToBrowser = () =>
    new Promise<void>((resolve) => window.setTimeout(resolve, 0));

export async function decodeAudioFile(file: File) {
    const context = new AudioContext();
    try {
        return await context.decodeAudioData(await file.arrayBuffer());
    } finally {
        await context.close();
    }
}

export async function renderAnswerTrack({
    song,
    normalSound,
    breakSound,
    events,
    includeBgm,
    answerVolume,
    breakVolume,
    onProgress,
}: RenderOptions) {
    const sampleRate = song.sampleRate;
    const longestSound = Math.max(
        normalSound.duration,
        breakSound?.duration ?? 0,
    );
    const lastEvent = events.at(-1)?.time ?? 0;
    const duration = Math.max(song.duration, lastEvent + longestSound);
    const frameCount = Math.max(1, Math.ceil(duration * sampleRate));
    const context = new OfflineAudioContext(2, frameCount, sampleRate);
    const limiter = context.createDynamicsCompressor();
    limiter.threshold.value = -1;
    limiter.knee.value = 2;
    limiter.ratio.value = 16;
    limiter.attack.value = 0.003;
    limiter.release.value = 0.12;
    limiter.connect(context.destination);

    if (includeBgm) {
        const songSource = context.createBufferSource();
        songSource.buffer = song;
        songSource.connect(limiter);
        songSource.start(0);
    }

    const answerGain = context.createGain();
    answerGain.gain.value = answerVolume;
    answerGain.connect(limiter);

    const breakGain = context.createGain();
    breakGain.gain.value = breakVolume;
    breakGain.connect(limiter);

    const chunkSize = 250;
    for (let index = 0; index < events.length; index += chunkSize) {
        const chunk = events.slice(index, index + chunkSize);
        for (const event of chunk) {
            if (event.time < 0 || event.time >= duration) continue;
            const answerSource = context.createBufferSource();
            answerSource.buffer = normalSound;
            answerSource.connect(answerGain);
            answerSource.start(event.time);

            if (event.kind === 'break' && breakSound) {
                const breakSource = context.createBufferSource();
                breakSource.buffer = breakSound;
                breakSource.connect(breakGain);
                breakSource.start(event.time);
            }
        }
        await onProgress?.(Math.min(1, (index + chunk.length) / events.length));
        await yieldToBrowser();
    }

    return context.startRendering();
}

const floatToPcm16 = (input: Float32Array, start: number, end: number) => {
    const output = new Int16Array(end - start);
    for (
        let sourceIndex = start, outputIndex = 0;
        sourceIndex < end;
        sourceIndex++, outputIndex++
    ) {
        const sample = Math.max(-1, Math.min(1, input[sourceIndex]));
        output[outputIndex] = sample < 0 ? sample * 32768 : sample * 32767;
    }
    return output;
};

export async function encodeMp3(
    buffer: AudioBuffer,
    onProgress?: (progress: number) => Promise<void>,
) {
    const encoder = new Mp3Encoder(2, buffer.sampleRate, 192);
    const chunks: ArrayBuffer[] = [];
    const left = buffer.getChannelData(0);
    const right = buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : left;
    const blockSize = 1152 * 16;

    for (let start = 0; start < buffer.length; start += blockSize) {
        const end = Math.min(start + blockSize, buffer.length);
        const encoded = encoder.encodeBuffer(
            floatToPcm16(left, start, end),
            floatToPcm16(right, start, end),
        );
        if (encoded.length > 0) {
            chunks.push(encoded.slice().buffer as ArrayBuffer);
        }
        await onProgress?.(end / buffer.length);
        await yieldToBrowser();
    }

    const finalChunk = encoder.flush();
    if (finalChunk.length > 0) {
        chunks.push(finalChunk.slice().buffer as ArrayBuffer);
    }
    return new Blob(chunks, { type: 'audio/mpeg' });
}
