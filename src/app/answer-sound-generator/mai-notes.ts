export interface MaiNotesSong {
    id: string;
    title: string;
    artist?: string;
    type?: string;
}

export interface MaiNotesChart {
    id: string;
    song_id: string;
    difficulty: string;
    level?: string;
    has_chart_data: boolean;
}

export interface MaiNotesManifest {
    songs: Record<string, MaiNotesSong>;
    charts: MaiNotesChart[];
}

const MANIFEST_URL = 'https://mai-notes.com/data/manifest.json';
let manifestRequest: Promise<MaiNotesManifest> | null = null;

export function loadMaiNotesManifest(): Promise<MaiNotesManifest> {
    if (!manifestRequest) {
        manifestRequest = (async () => {
            let response: Response;
            try {
                response = await fetch(MANIFEST_URL);
            } catch {
                throw new Error(
                    '無法連線至 mai-notes；請檢查網路或跨來源存取設定。',
                );
            }
            if (!response.ok) {
                throw new Error(
                    `mai-notes 曲目清單載入失敗（HTTP ${response.status}）。`,
                );
            }
            let data: unknown;
            try {
                data = await response.json();
            } catch {
                throw new Error('mai-notes 曲目清單不是有效的 JSON。');
            }
            if (
                !data ||
                typeof data !== 'object' ||
                !('songs' in data) ||
                !('charts' in data) ||
                !data.songs ||
                typeof data.songs !== 'object' ||
                !Array.isArray(data.charts)
            ) {
                throw new Error('mai-notes 曲目清單格式不正確。');
            }
            return data as MaiNotesManifest;
        })().catch((error) => {
            manifestRequest = null;
            throw error;
        });
    }
    return manifestRequest;
}

export async function loadMaiNotesChart(chartId: string): Promise<string> {
    let response: Response;
    try {
        response = await fetch(
            `https://mai-notes.com/player/${encodeURIComponent(chartId)}`,
        );
    } catch {
        throw new Error(
            '無法連線至 mai-notes 譜面頁；請檢查網路或跨來源存取設定。',
        );
    }
    if (!response.ok) {
        throw new Error(
            `mai-notes 譜面頁載入失敗（HTTP ${response.status}）。`,
        );
    }
    const html = await response.text();
    const document = new DOMParser().parseFromString(html, 'text/html');
    const input = document.querySelector<HTMLTextAreaElement>(
        'textarea#simaiInput',
    );
    if (!input) {
        throw new Error('mai-notes 譜面頁缺少 #simaiInput。');
    }
    const simai = input.value.trim();
    if (!simai) {
        throw new Error('mai-notes 譜面內容是空的。');
    }
    return simai;
}
