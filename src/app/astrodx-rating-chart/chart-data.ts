export const SONG_DATA_URL = 'https://dp4p6x0xfi5o9.cloudfront.net/maimai/data.json';
export const DEFAULT_TITLE_PATTERN = '';

export type ChartType = 'dx' | 'std';
export type Difficulty = 'basic' | 'advanced' | 'expert' | 'master' | 'remaster';

export type SourceDifficulty = {
    alias: string;
    achievement: number;
    clearType: number;
};

export type SourceSong = {
    key: string;
    title: string;
    difficulties: SourceDifficulty[];
};

export type DatabaseSheet = {
    type: string;
    difficulty: string;
    internalLevelValue: number | null;
    level: string;
};

export type DatabaseSong = {
    songId: string;
    title: string;
    imageName: string;
    sheets: DatabaseSheet[];
};

export type RatingEntry = {
    sourceKey: string;
    title: string;
    imageName: string;
    type: ChartType;
    difficulty: Difficulty;
    constant: number;
    achievement: number;
    clearType: number;
    rank: string;
    rating: number;
};

export type MatchRecord = {
    source: SourceSong;
    extractedTitle: string;
    song: DatabaseSong | null;
    songIndex: number | null;
    availableTypes: ChartType[];
    selectedType: ChartType | null;
    entries: RatingEntry[];
    entriesByDifficulty: Array<RatingEntry | null>;
    issue: string | null;
};

type UnknownObject = Record<string, unknown>;

function object(value: unknown): UnknownObject | null {
    return value !== null && typeof value === 'object' && !Array.isArray(value)
        ? value as UnknownObject : null;
}

export function parseAstroDx(input: unknown): SourceSong[] {
    const root = object(input);
    const metadata = object(root?.level_metadata);
    if (!metadata) throw new Error('找不到 AstroDX 的 level_metadata 資料。');

    const songs = Object.entries(metadata).map(([key, value]) => {
        const raw = object(value);
        if (!raw) return null;
        const title = typeof raw.title === 'string' && raw.title.trim() ? raw.title : key;
        const difficulties = Array.isArray(raw.difficulties) ? raw.difficulties.flatMap((item) => {
            const difficulty = object(item);
            const stats = object(difficulty?.stats);
            const achievement = Number(stats?.achievementRate);
            if (!difficulty || !stats || !Number.isFinite(achievement) || achievement <= 0) return [];
            return [{
                alias: String(difficulty.alias ?? ''),
                achievement,
                clearType: Number(stats.clearType ?? 0),
            }];
        }) : [];
        return { key, title, difficulties };
    }).filter((song): song is SourceSong => song !== null);

    if (songs.length === 0) throw new Error('level_metadata 裡沒有可讀取的歌曲。');
    return songs;
}

export function parseSongDatabase(input: unknown): DatabaseSong[] {
    const root = object(input);
    if (!Array.isArray(root?.songs)) throw new Error('歌曲資料庫格式不正確。');
    const songs = root.songs.flatMap((item) => {
        const song = object(item);
        if (!song || typeof song.title !== 'string' || !Array.isArray(song.sheets)) return [];
        const sheets: DatabaseSheet[] = song.sheets.flatMap((value: unknown) => {
            const sheet = object(value);
            if (!sheet) return [];
            return [{
                type: String(sheet.type ?? ''),
                difficulty: String(sheet.difficulty ?? ''),
                internalLevelValue: sheet.internalLevelValue === null ? null : Number(sheet.internalLevelValue),
                level: String(sheet.level ?? ''),
            }];
        });
        return [{
            songId: String(song.songId ?? song.title),
            title: song.title,
            imageName: String(song.imageName ?? ''),
            sheets,
        }];
    });
    if (songs.length === 0) throw new Error('歌曲資料庫沒有可讀取的歌曲。');
    return songs;
}

function normalizeTitle(value: string): string {
    return value.normalize('NFKC').toLocaleLowerCase().replace(/[\s\u200b-\u200d\ufeff]/g, '');
}

function relaxedTitle(value: string): string {
    return normalizeTitle(value).replace(/[\p{P}\p{S}]/gu, '');
}

const typeSuffix = /\s*(?:[\[［(（]\s*(DX|SD|STD|STANDARD|宴|UTAGE)\s*[\]］)）]|[-_ ]+(DX|SD|STD))\s*$/i;

function extractTitle(raw: string, customPattern: RegExp | null): { title: string; hint: ChartType | 'utage' | null } {
    const suffix = raw.match(typeSuffix);
    const suffixText = (suffix?.[1] ?? suffix?.[2] ?? '').toUpperCase();
    const hint = suffixText === 'DX' ? 'dx' : suffixText === 'SD' || suffixText === 'STD' || suffixText === 'STANDARD'
        ? 'std' : suffixText === '宴' || suffixText === 'UTAGE' ? 'utage' : null;
    const extracted = customPattern ? raw.match(customPattern) : null;
    const title = (extracted?.[1] ?? extracted?.[0] ?? raw.replace(typeSuffix, ''))
        .replace(/^\s*[\[［(（][^\]］)）]{1,3}[\]］)）]\s*(?=.+)/, '')
        .trim();
    return { title, hint };
}

const difficultyAliases: Record<string, Difficulty> = {
    basic: 'basic', advanced: 'advanced', expert: 'expert', master: 'master',
    're:master': 'remaster', remaster: 'remaster', 're-master': 'remaster',
};

export function rankForAchievement(achievement: number): string {
    if (achievement >= 100.5) return 'SSS+';
    if (achievement >= 100) return 'SSS';
    if (achievement >= 99.5) return 'SS+';
    if (achievement >= 99) return 'SS';
    if (achievement >= 98) return 'S+';
    if (achievement >= 97) return 'S';
    if (achievement >= 94) return 'AAA';
    if (achievement >= 90) return 'AA';
    if (achievement >= 80) return 'A';
    if (achievement >= 75) return 'BBB';
    if (achievement >= 70) return 'BB';
    if (achievement >= 60) return 'B';
    if (achievement >= 50) return 'C';
    return 'D';
}

function ratingFactor(achievement: number): number {
    if (achievement >= 100.5) return .224;
    if (achievement === 100.4999) return .222;
    if (achievement >= 100) return .216;
    if (achievement === 99.9999) return .214;
    if (achievement >= 99.5) return .211;
    if (achievement >= 99) return .208;
    if (achievement === 98.9999) return .206;
    if (achievement >= 98) return .203;
    if (achievement >= 97) return .2;
    if (achievement === 94.9999) return .176;
    if (achievement >= 94) return .168;
    if (achievement >= 90) return .152;
    if (achievement >= 80) return .136;
    if (achievement === 75.9999) return .128;
    if (achievement >= 75) return .12;
    if (achievement >= 70) return .112;
    if (achievement >= 60) return .096;
    if (achievement >= 50) return .08;
    if (achievement >= 40) return .064;
    if (achievement >= 30) return .048;
    if (achievement >= 20) return .032;
    if (achievement >= 10) return .016;
    return 0;
}

export function calculateRating(achievement: number, constant: number, clearType: number): number {
    // maibot's rating formula; AstroDX clearType 5/6 represent AP/AP+.
    return Math.floor((Math.min(achievement, 100.5) * 10000 * ratingFactor(achievement) * 1000 * constant * 10) / 100000000)
        + (clearType >= 5 ? 1 : 0);
}

export function resolveSongs(
    sources: SourceSong[],
    database: DatabaseSong[],
    customPattern: string,
    songOverrides: Record<string, number>,
    typeOverrides: Record<string, ChartType>,
): MatchRecord[] {
    const pattern = customPattern.trim() ? new RegExp(customPattern, 'iu') : null;
    const index = new Map<string, number[]>();
    database.forEach((song, songIndex) => {
        for (const title of new Set([song.title, song.songId])) {
            const key = normalizeTitle(title);
            const matches = index.get(key) ?? [];
            if (!matches.includes(songIndex)) matches.push(songIndex);
            index.set(key, matches);
        }
    });

    return sources.map((source) => {
        const { title, hint } = extractTitle(source.title, pattern);
        let candidates = index.get(normalizeTitle(title)) ?? [];
        if (candidates.length === 0 && title) {
            const relaxed = relaxedTitle(title);
            const near = database.flatMap((song, i) =>
                relaxedTitle(song.title) === relaxed || relaxedTitle(song.songId) === relaxed ? [i] : []);
            if (near.length === 1) candidates = near;
        }
        const songIndex = Number.isInteger(songOverrides[source.key]) && database[songOverrides[source.key]]
            ? songOverrides[source.key]
            : candidates.sort((a, b) => {
                const preference = (i: number) => {
                    const song = database[i];
                    const isUtage = song.sheets.some((sheet) => sheet.type === 'utage');
                    return (hint === 'utage' ? isUtage : !isUtage) ? 1 : 0;
                };
                return preference(b) - preference(a);
            })[0] ?? null;
        const song = songIndex === null ? null : database[songIndex];
        const availableTypes = song ? (['dx', 'std'] as const).filter((type) =>
            song.sheets.some((sheet) => sheet.type === type)) : [];
        const selectedType = song && availableTypes.includes(typeOverrides[source.key])
            ? typeOverrides[source.key]
            : hint !== 'utage' && hint && availableTypes.includes(hint)
                ? hint : availableTypes.length === 1 ? availableTypes[0] : null;
        const entriesByDifficulty = source.difficulties.map((difficulty): RatingEntry | null => {
            if (!song || !selectedType) return null;
            const level = difficultyAliases[difficulty.alias.toLowerCase().replace(/\s/g, '')];
            const sheet = song.sheets.find((item) => item.type === selectedType && item.difficulty === level);
            const constant = sheet?.internalLevelValue;
            if (!level || !Number.isFinite(constant) || constant === null || constant === undefined) return null;
            return {
                sourceKey: source.key,
                title: song.title,
                imageName: song.imageName,
                type: selectedType,
                difficulty: level,
                constant,
                achievement: difficulty.achievement,
                clearType: difficulty.clearType,
                rank: rankForAchievement(difficulty.achievement),
                rating: calculateRating(difficulty.achievement, constant, difficulty.clearType),
            };
        });
        const entries = entriesByDifficulty.filter((entry): entry is RatingEntry => entry !== null);
        const issue = !song ? '資料庫找不到歌曲' : source.difficulties.length === 0 ? null
            : hint === 'utage' ? '宴譜面不計入 Rating' : !selectedType ? '請選擇 DX 或 SD 譜面'
            : entries.length < source.difficulties.length ? '部分成績找不到對應難度或定數' : null;
        return { source, extractedTitle: title, song, songIndex, availableTypes, selectedType, entries, entriesByDifficulty, issue };
    });
}
