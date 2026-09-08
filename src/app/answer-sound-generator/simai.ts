import {
    SimaiConvert,
    SimaiFile,
    NoteType,
    type MaiChart,
    type Note,
} from 'simai.js';

export type AnswerEventKind = 'normal' | 'break';

export interface AnswerEvent {
    time: number;
    kind: AnswerEventKind;
}

export interface SimaiChart {
    key: string;
    difficulty: number;
    level?: string;
    designer?: string;
    first: number;
    parsed: MaiChart;
}

export interface Maidata {
    title: string;
    artist?: string;
    charts: SimaiChart[];
}

export interface TimelineResult {
    events: AnswerEvent[];
}

const EPSILON = 0.0001;

const numberOr = (value: string | undefined, fallback: number) => {
    const parsed = Number.parseFloat(value ?? '');
    return Number.isFinite(parsed) ? parsed : fallback;
};

/** Uses Simai.js for both maidata fields and chart syntax. */
export function parseMaidata(source: string): Maidata {
    const file = new SimaiFile(source.replace(/^\uFEFF/, ''));
    const values = file.toKeyValuePairs();
    const globalFirst = numberOr(values.get('first'), 0);
    const charts: SimaiChart[] = [];

    for (const [key, rawChart] of values) {
        const match = /^inote_(\d+)$/i.exec(key);
        if (!match || !rawChart.trim()) continue;

        const difficulty = Number.parseInt(match[1], 10);
        charts.push({
            key: `inote_${difficulty}`,
            difficulty,
            level: values.get(`lv_${difficulty}`)?.trim() || undefined,
            designer:
                values.get(`des_${difficulty}`)?.trim() ||
                values.get('des')?.trim() ||
                undefined,
            first: numberOr(values.get(`first_${difficulty}`), globalFirst),
            parsed: SimaiConvert.deserialize(rawChart),
        });
    }

    charts.sort((a, b) => a.difficulty - b.difficulty);
    if (charts.length === 0) {
        throw new Error('maidata.txt 中找不到可用的 &inote_N 譜面。');
    }

    return {
        title: values.get('title')?.trim() || 'Untitled',
        artist: values.get('artist')?.trim() || undefined,
        charts,
    };
}

const isAudibleHead = (note: Note) => note.type !== NoteType.ForceInvalidate;
const isBreak = (note: Note) => note.type === NoteType.Break;

export function buildAnswerTimeline(chart: SimaiChart): TimelineResult {
    const candidates: AnswerEvent[] = [];

    for (const collection of chart.parsed.noteCollections) {
        // A slide is represented as a tap head plus slidePaths by Simai.js.
        // Only the head is used; slidePaths and their completion times are ignored.
        const audibleHeads = collection.filter(isAudibleHead);
        if (audibleHeads.length > 0) {
            candidates.push({
                time: collection.time + chart.first,
                kind: audibleHeads.some(isBreak) ? 'break' : 'normal',
            });
        }

        for (const note of collection) {
            // Hold and touch-hold releases retain the existing answer-sound behavior.
            if (note.length !== undefined && note.length > 0) {
                candidates.push({
                    time: collection.time + note.length + chart.first,
                    kind: isBreak(note) ? 'break' : 'normal',
                });
            }
        }
    }

    candidates.sort((a, b) => a.time - b.time || (a.kind === 'break' ? -1 : 1));

    // Exactly one sound per judgement time; BREAK wins on a mixed beat.
    const events: AnswerEvent[] = [];
    for (const event of candidates) {
        const previous = events.at(-1);
        if (previous && Math.abs(previous.time - event.time) < EPSILON) {
            if (event.kind === 'break') previous.kind = 'break';
        } else {
            events.push({
                time: Math.round(event.time * 10000) / 10000,
                kind: event.kind,
            });
        }
    }

    return { events };
}
