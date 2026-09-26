import { createEncoder } from 'wasm-media-encoders';
import type { AnswerEvent } from './simai';
import { buildBreakPlaybacks } from './break-audio';

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

    // Cheer is embedded in the supplied Break sample, so replacing that sample
    // also truncates its Cheer. CRI Stop(false) has an unknown release envelope;
    // hard replacement is an approximation, not sample-identical to CRI Atom.
    const breakPlaybacks = buildBreakPlaybacks(
        events
            .filter((event) => event.kind === 'break')
            .map((event) => ({
                time: event.time,
                // The deterministic correct-answer track uses the top success result.
                judgment: 'critical' as const,
            })),
        breakSound?.duration ?? 0,
    );

    if (breakSound) {
        for (const playback of breakPlaybacks) {
            if (playback.time < 0 || playback.time >= duration) continue;
            const breakSource = context.createBufferSource();
            breakSource.buffer = breakSound;
            breakSource.connect(breakGain);
            breakSource.start(playback.time, 0, playback.duration);
        }
    }

    const chunkSize = 250;
    for (let index = 0; index < events.length; index += chunkSize) {
        const chunk = events.slice(index, index + chunkSize);
        for (const event of chunk) {
            if (event.time < 0 || event.time >= duration) continue;
            const answerSource = context.createBufferSource();
            answerSource.buffer = normalSound;
            answerSource.connect(answerGain);
            answerSource.start(event.time);
        }
        await onProgress?.(Math.min(1, (index + chunk.length) / events.length));
        await yieldToBrowser();
    }

    return context.startRendering();
}

const MP3_WASM_URL = '/answer-sound-generator/mp3-encoder-0.7.0.wasm';

const clipPcmForMp3 = (input: Float32Array, start: number, end: number) => {
    const samples = input.subarray(start, end);
    let clipped: Float32Array | undefined;
    for (let index = 0; index < samples.length; index++) {
        const sample = samples[index];
        if (!Number.isFinite(sample) || sample < -1 || sample > 1) {
            clipped ??= new Float32Array(samples);
            clipped[index] = Number.isNaN(sample)
                ? 0
                : Math.max(-1, Math.min(1, sample));
        }
    }
    return clipped ?? samples;
};

export async function encodeMp3(
    buffer: AudioBuffer,
    onProgress?: (progress: number) => Promise<void>,
) {
    // Keep the pinned MP3 WASM asset outside the JavaScript bundle.
    const encoder = await createEncoder('audio/mpeg', MP3_WASM_URL);
    encoder.configure({
        sampleRate: buffer.sampleRate,
        channels: 2,
        bitrate: 192,
    });
    const chunks: ArrayBuffer[] = [];
    const left = buffer.getChannelData(0);
    const right = buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : left;
    const blockSize = 1152 * 16;

    for (let start = 0; start < buffer.length; start += blockSize) {
        const end = Math.min(start + blockSize, buffer.length);
        const encoded = encoder.encode([
            clipPcmForMp3(left, start, end),
            clipPcmForMp3(right, start, end),
        ]);
        if (encoded.length > 0) {
            // The encoder reuses its WASM output memory on the next call.
            chunks.push(encoded.slice().buffer as ArrayBuffer);
        }
        await onProgress?.(end / buffer.length);
        await yieldToBrowser();
    }

    const finalChunk = encoder.finalize();
    if (finalChunk.length > 0) {
        chunks.push(finalChunk.slice().buffer as ArrayBuffer);
    }
    return new Blob(chunks, { type: 'audio/mpeg' });
}
