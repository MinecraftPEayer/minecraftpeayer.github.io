import type { MatchRecord, SourceSong } from './chart-data';

function csvField(value: string | number | null | undefined): string {
    const raw = value === null || value === undefined ? '' : String(value);
    const safe = /^[\s\uFEFF]*[=+\-@]/u.test(raw) ? "'" + raw : raw;
    return '"' + safe.replaceAll('"', '""') + '"';
}

export function buildScoresCsv(sources: SourceSong[], records: MatchRecord[]): string {
    const bySource = new Map(records.map((record) => [record.source.key, record]));
    const rows: Array<Array<string | number | null | undefined>> = [[
        '原始曲名', '比對曲名', '歌曲 ID', '譜面類型', '難度', '達成率 (%)',
        'Clear Type', '定數', 'Rating', '狀態',
    ]];

    for (const source of sources) {
        const record = bySource.get(source.key);
        source.difficulties.forEach((difficulty, index) => {
            const entry = record?.entriesByDifficulty[index] ?? null;
            rows.push([
                source.title,
                record?.song?.title,
                record?.song?.songId,
                record?.selectedType === 'dx' ? 'DX' : record?.selectedType === 'std' ? 'SD' : '',
                difficulty.alias,
                difficulty.achievement,
                difficulty.clearType,
                entry?.constant,
                entry?.rating,
                entry ? '已計算' : record?.issue ?? '尚未完成歌曲比對',
            ]);
        });
    }

    return '\uFEFF' + rows.map((row) => row.map(csvField).join(',')).join('\r\n') + '\r\n';
}

