'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { parseAstroDx, parseSongDatabase, resolveSongs, SONG_DATA_URL } from './chart-data';
import type { ChartType, DatabaseSong, SourceSong } from './chart-data';
import { drawRatingChart } from './draw-chart';
import { buildScoresCsv } from './chart-csv';
import styles from './chart.module.css';
import { IconDownload, IconUpload } from '../_tool-ui/icons';
import { Pipeline, ToolIntro, surfaceClass, type Stage } from '../_tool-ui/tool-chrome';

export default function ChartApp() {
    const [source, setSource] = useState<SourceSong[] | null>(null);
    const [database, setDatabase] = useState<DatabaseSong[] | null>(null);
    const [pattern, setPattern] = useState('');
    const [songOverrides, setSongOverrides] = useState<Record<string, number>>({});
    const [typeOverrides, setTypeOverrides] = useState<Record<string, ChartType>>({});
    const [manualText, setManualText] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [drawing, setDrawing] = useState(false);
    const [error, setError] = useState('');
    const [drawError, setDrawError] = useState('');
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const patternError = useMemo(() => {
        if (!pattern.trim()) return '';
        try { new RegExp(pattern, 'iu'); return ''; }
        catch { return '正則表達式格式不正確。'; }
    }, [pattern]);

    const records = useMemo(() => {
        if (!source || !database || patternError) return [];
        return resolveSongs(source, database, pattern, songOverrides, typeOverrides);
    }, [source, database, pattern, patternError, songOverrides, typeOverrides]);

    const entries = useMemo(() => records.flatMap((record) => record.entries)
        .sort((a, b) => b.rating - a.rating || b.achievement - a.achievement || a.title.localeCompare(b.title)), [records]);
    const top = useMemo(() => entries.slice(0, 50), [entries]);
    const unmatched = records.filter((record) => !record.song);
    const dualType = records.filter((record) => record.source.difficulties.length > 0 && record.availableTypes.length === 2);
    const skipped = records.filter((record) => record.source.difficulties.length > 0 && record.issue && record.song);
    const playedCount = source?.reduce((sum, song) => sum + song.difficulties.length, 0) ?? 0;

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !source || !database || patternError) return;
        let cancelled = false;
        const buffer = document.createElement('canvas');
        setDrawing(true);
        setDrawError('');
        drawRatingChart(buffer, top).then(() => {
            if (cancelled) return;
            canvas.width = buffer.width;
            canvas.height = buffer.height;
            canvas.getContext('2d')?.drawImage(buffer, 0, 0);
            setDrawing(false);
        }).catch((cause) => {
            if (cancelled) return;
            setDrawError(cause instanceof Error ? cause.message : '繪製圖片失敗。');
            setDrawing(false);
        });
        return () => { cancelled = true; };
    }, [top, source, database, patternError]);

    async function importFile(file: File) {
        setLoading(true);
        setError('');
        setSource(null);
        setSongOverrides({});
        setTypeOverrides({});
        setManualText({});
        try {
            const parsed = parseAstroDx(JSON.parse(await file.text()));
            setSource(parsed);
            if (!database) {
                try {
                    const response = await fetch(SONG_DATA_URL);
                    if (!response.ok) throw new Error(`歌曲資料庫下載失敗 (${response.status})。`);
                    setDatabase(parseSongDatabase(await response.json()));
                } catch (cause) {
                    setError(cause instanceof Error ? cause.message : '歌曲資料庫下載失敗。');
                }
            }
        } catch (cause) {
            setSource(null);
            setError(cause instanceof SyntaxError ? '檔案不是有效的 JSON。'
                : cause instanceof Error ? cause.message : '無法讀取檔案。');
        } finally {
            setLoading(false);
        }
    }

    const options = useMemo(() => database?.map((song, index) => ({
        index,
        label: `${song.title} 〔${song.songId}〕 #${index + 1}`,
    })) ?? [], [database]);
    const optionLookup = useMemo(() => new Map(options.map((option) => [option.label, option.index])), [options]);

    function setManualSong(key: string, value: string) {
        setManualText((current) => ({ ...current, [key]: value }));
        setSongOverrides((current) => {
            const next = { ...current };
            const index = optionLookup.get(value);
            if (index === undefined) delete next[key];
            else next[key] = index;
            return next;
        });
    }

    function downloadCsv() {
        if (!source) return;
        const csv = buildScoresCsv(source, records);
        const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
        const link = document.createElement('a');
        link.href = url;
        link.download = 'astrodx-all-scores.csv';
        link.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    }

    function download() {
        const canvas = canvasRef.current;
        if (!canvas || drawing) return;
        canvas.toBlob((blob) => {
            if (!blob) { setDrawError('無法匯出 PNG。'); return; }
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'astrodx-rating-chart.png';
            link.click();
            window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
        }, 'image/png');
    }

    const needsType = dualType.some((record) => !record.selectedType);
    const topTotal = top.reduce((sum, entry) => sum + entry.rating, 0);
    const ready = Boolean(source && database);
    const stages: Stage[] = [
        {
            label: '匯入',
            state: loading ? 'busy' : source ? 'done' : error ? 'error' : 'active',
            value: loading ? '讀取中' : source ? `${playedCount} 筆` : error ? '讀取失敗' : 'JSON',
        },
        {
            label: '比對',
            state: !ready ? 'pending' : patternError ? 'error' : unmatched.length || needsType ? 'active' : 'done',
            value: !ready ? undefined : patternError ? '正則錯誤'
                : unmatched.length ? `${unmatched.length} 首未比對`
                : needsType ? '選擇 DX/SD' : `${entries.length} 可計算`,
        },
        {
            label: '組成表',
            state: !ready || patternError ? 'pending' : drawing ? 'busy' : drawError ? 'error' : 'done',
            value: !ready || patternError ? undefined : drawing ? '繪製中' : drawError ? '繪製失敗' : `TOP ${top.length}`,
        },
        {
            label: '下載',
            state: ready && !drawing && !drawError && !patternError ? 'active' : 'pending',
            value: ready && !drawing && !drawError && !patternError ? 'PNG · CSV' : undefined,
        },
    ];

    return <main className={`${surfaceClass} ${styles.page}`}>
        <div className={styles.shell}>
            <ToolIntro title="AstroDX Rating Chart">
                匯入 AstroDX 成績，對照歌曲定數，產生前 50 譜面的組成表。
            </ToolIntro>

            <Pipeline label="組成表進度" stages={stages} />

            <section className={styles.panel} aria-labelledby="import-title">
                <div className={styles.panelHead}>
                    <h2 id="import-title">匯入成績</h2>
                    {source && <span className={styles.meta}>{playedCount} 筆成績</span>}
                </div>
                <div className={styles.panelBody}>
                    <label className={`${styles.dropZone} ${source ? styles.dropZoneDone : ''}`}>
                        <input type="file" accept=".json,application/json" onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) void importFile(file);
                            event.target.value = '';
                        }} />
                        <span className={styles.uploadIcon}><IconUpload size={20} /></span>
                        <span className={styles.dropText}>
                            <strong>{loading ? '正在讀取檔案與歌曲資料庫…' : '選擇 AstroDX 匯出的 JSON 檔案'}</strong>
                            <small>支援包含 level_metadata 的 processed.json</small>
                        </span>
                    </label>
                    {error && <p className={styles.error} role="alert">{error}</p>}
                    {source && <div className={styles.importActions}>
                        <button type="button" className={styles.secondary} onClick={downloadCsv} disabled={loading}>
                            <IconDownload size={16} />下載所有成績 CSV
                        </button>
                        <span className={styles.muted}>包含未能計算 Rating 的項目</span>
                    </div>}
                </div>
            </section>

            {source && database && <>
                <section className={styles.panel} aria-labelledby="match-title">
                    <div className={styles.panelHead}>
                        <h2 id="match-title">曲名比對</h2>
                        <span className={styles.meta}>{source.length} 首 · {playedCount} 筆</span>
                    </div>
                    <div className={styles.metrics}>
                        <div><small>可計算成績</small><strong>{entries.length}</strong></div>
                        <div className={unmatched.length ? styles.metricWarn : ''}><small>資料庫找不到</small><strong>{unmatched.length}</strong></div>
                        <div className={skipped.length ? styles.metricWarn : ''}><small>需要檢查</small><strong>{skipped.length}</strong></div>
                    </div>
                    <div className={styles.panelBody}>
                        <p className={styles.intro}>預設會忽略曲名尾端的 [DX]、[SD] 等標記，並統一全半形與空白。若匯出檔使用其他命名方式，可輸入擷取規則；第一個括號群組會作為曲名。</p>
                        <label className={styles.fieldLabel} htmlFor="title-pattern">曲名擷取正則（選填）</label>
                        <input id="title-pattern" className={`${styles.textInput} ${patternError ? styles.invalid : ''}`} type="text" value={pattern}
                            onChange={(event) => setPattern(event.target.value)}
                            aria-invalid={!!patternError}
                            placeholder={String.raw`^(.+?)\s*\[(?:DX|SD)\]$`} spellCheck={false} />
                        <p className={styles.help}>例如「曲名 [DX]」可使用 <code>{String.raw`^(.+?)\s*\[(?:DX|SD)\]$`}</code>。未符合規則的曲名仍會使用預設處理。</p>
                        {patternError && <p className={styles.error} role="alert">{patternError}</p>}
                    </div>

                    {dualType.length > 0 && <details className={styles.details} open={dualType.some((record) => !record.selectedType)}>
                        <summary>DX / SD 譜面選擇 <span>{dualType.length} 首有兩種譜面</span></summary>
                        <div className={styles.rows}>
                            {dualType.map((record) => <label className={styles.row} key={record.source.key}>
                                <span><strong>{record.source.title}</strong><small>{record.source.difficulties.length} 筆成績</small></span>
                                <select value={record.selectedType ?? ''} onChange={(event) => setTypeOverrides((current) => ({ ...current, [record.source.key]: event.target.value as ChartType }))}>
                                    <option value="" disabled>請選擇</option>
                                    <option value="dx">DX</option>
                                    <option value="std">SD</option>
                                </select>
                            </label>)}
                        </div>
                    </details>}

                    <details className={styles.details} open={unmatched.length > 0}>
                        <summary>資料庫找不到的歌曲 <span>{unmatched.length} 首</span></summary>
                        <div className={styles.rows}>
                            {unmatched.length === 0 ? <p className={styles.empty}>全部曲名都找到對應歌曲。</p> : unmatched.map((record) =>
                                <label className={styles.row} key={record.source.key}>
                                    <span><strong>{record.source.title}</strong><small>擷取結果：{record.extractedTitle || '空白'} · {record.source.difficulties.length} 筆成績</small></span>
                                    <input list="song-catalog" className={styles.matchInput}
                                        value={manualText[record.source.key] ?? ''}
                                        onChange={(event) => setManualSong(record.source.key, event.target.value)}
                                        placeholder="搜尋並指定歌曲" />
                                </label>)}
                        </div>
                    </details>
                    <datalist id="song-catalog">{options.map((option) => <option key={option.index} value={option.label} />)}</datalist>

                    {skipped.length > 0 && <details className={styles.details}>
                        <summary>未計入的成績 <span>{skipped.length} 首需檢查</span></summary>
                        <div className={styles.rows}>{skipped.map((record) =>
                            <div className={styles.row} key={record.source.key}>
                                <span><strong>{record.source.title}</strong><small>{record.issue}</small></span>
                            </div>)}</div>
                    </details>}
                </section>

                <section className={styles.panel} aria-labelledby="result-title">
                    <div className={styles.panelHead}>
                        <h2 id="result-title">組成表</h2>
                        <span className={styles.meta}>{drawing ? '繪製中…' : `TOP ${top.length}`}</span>
                    </div>
                    <div className={styles.resultStats}>
                        <div><small>TOP 50 總值</small><strong className={styles.total}>{topTotal}</strong></div>
                        <div><small>列入圖表</small><strong>{top.length}</strong></div>
                        <div><small>其他成績</small><strong>{Math.max(0, entries.length - 50)}</strong></div>
                    </div>
                    <div className={styles.panelBody}>
                        <p className={styles.intro}>所有已比對的譜面合併排名，取 Rating 最高的 50 筆。總值為這 50 筆之和，僅供這份成績檔參考。</p>
                        {drawError && <p className={styles.error} role="alert">{drawError}</p>}
                        <div className={`${styles.canvasWrap} ${drawing ? styles.canvasBusy : ''}`} aria-busy={drawing}>
                            <canvas ref={canvasRef} aria-label="AstroDX Rating Chart 預覽" />
                        </div>
                        {drawing && <p className={styles.muted}>正在載入封面並繪製圖片…</p>}
                        <p className={styles.sourceLink}>歌曲資料來源：<a href={SONG_DATA_URL} target="_blank" rel="noreferrer">arcade-songs maimai data.json</a>；圖示與版面參考 <a href="https://github.com/MinecraftPEayer/maibot" target="_blank" rel="noreferrer">maibot Rating Chart</a>。</p>
                    </div>
                </section>
            </>}
        </div>

        {source && database && <div className={styles.actionBar}>
            <div className={styles.actionInner}>
                <span className={styles.actionMeta}><small>TOP 50 總值</small><strong>{topTotal}</strong></span>
                <button type="button" className={styles.primary} onClick={download} disabled={drawing || !!patternError}>
                    <IconDownload size={17} />下載 PNG
                </button>
            </div>
        </div>}
    </main>;
}
