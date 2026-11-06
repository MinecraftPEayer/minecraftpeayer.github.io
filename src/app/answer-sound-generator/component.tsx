'use client';

import {
    Alert,
    Box,
    Button,
    Container,
    CssBaseline,
    FormControl,
    InputLabel,
    LinearProgress,
    MenuItem,
    Select,
    Slider,
    Stack,
    TextField,
    ThemeProvider,
    Tooltip,
    Typography,
} from '@mui/material';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { decodeAudioFile, encodeMp3, renderAnswerTrack } from './audio';
import {
    buildAnswerTimeline,
    parseMaidata,
    parseSingleSimaiChart,
    type Maidata,
} from './simai';
import {
    loadMaiNotesChart,
    type MaiNotesSong,
    type MaiNotesChart,
} from './mai-notes';
import { MaiNotesSearch } from './mai-notes-search';
import {
    FilePicker,
    Panel,
    ResultPlayer,
    monoSx,
    toolTheme,
    type OutputFile,
} from './ui';
import { tool } from '../_tool-ui/tokens';
import {
    IconBolt,
    IconDownload,
    IconFile,
    IconFolder,
    IconMusic,
    IconWave,
} from '../_tool-ui/icons';
import {
    Pipeline,
    ToolIntro,
    surfaceClass,
    type Stage,
} from '../_tool-ui/tool-chrome';

const DIFFICULTY_NAMES: Record<number, string> = {
    1: 'EASY',
    2: 'BASIC',
    3: 'ADVANCED',
    4: 'EXPERT',
    5: 'MASTER',
    6: 'Re:MASTER',
    7: 'ORIGINAL',
};

const getDirectory = (file: File) => {
    const path = file.webkitRelativePath;
    return path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : '';
};

function findSongFolderFiles(files: File[]) {
    const maidatas = files.filter((file) =>
        /(^|\/)maidata\.txt$/i.test(file.webkitRelativePath || file.name),
    );
    const tracks = files.filter((file) =>
        /^track\.(mp3|wav|ogg|m4a|aac)$/i.test(file.name),
    );

    for (const maidata of maidatas) {
        const song = tracks.find(
            (candidate) => getDirectory(candidate) === getDirectory(maidata),
        );
        if (song) return { maidata, song };
    }
    return { maidata: maidatas[0], song: tracks[0] };
}

const safeFilename = (value: string) =>
    value.replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_').trim() || 'Untitled';

export default function MaimaiAudioTool() {
    const [songFile, setSongFile] = useState<File | null>(null);
    const [maidataFile, setMaidataFile] = useState<File | null>(null);
    const [normalSoundFile, setNormalSoundFile] = useState<File | null>(null);
    const [breakSoundFile, setBreakSoundFile] = useState<File | null>(null);
    const [maidata, setMaidata] = useState<Maidata | null>(null);
    const [maidataText, setMaidataText] = useState('');
    const [showPaste, setShowPaste] = useState(false);
    const [difficulty, setDifficulty] = useState('');
    const [answerVolume, setAnswerVolume] = useState(1);
    const [breakVolume, setBreakVolume] = useState(1);
    const [status, setStatus] = useState(
        '選擇歌曲資料夾，或逐一加入需要的檔案。',
    );
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [outputs, setOutputs] = useState<OutputFile[]>([]);
    const [chartSource, setChartSource] = useState<string | null>(null);
    const [isChartLoading, setIsChartLoading] = useState(false);
    const chartRequestId = useRef(0);
    const outputUrls = useRef<string[]>([]);

    const selectedChart = maidata?.charts.find(
        (chart) => chart.key === difficulty,
    );
    const timeline = useMemo(
        () =>
            selectedChart && maidata
                ? buildAnswerTimeline(selectedChart)
                : null,
        [maidata, selectedChart],
    );
    const breakCount =
        timeline?.events.filter((event) => event.kind === 'break').length ?? 0;
    const clearOutputs = useCallback(() => {
        outputUrls.current.forEach((url) => URL.revokeObjectURL(url));
        outputUrls.current = [];
        setOutputs([]);
    }, []);

    useEffect(() => clearOutputs, [clearOutputs]);

    const parseMaidataSource = useCallback(
        (source: string, origin: string, file?: File) => {
            chartRequestId.current += 1;
            setIsChartLoading(false);
            setError(null);
            clearOutputs();
            setMaidataFile(file ?? null);
            try {
                const parsed = parseMaidata(source);
                const preferred =
                    parsed.charts.find((chart) => chart.difficulty === 5) ??
                    parsed.charts.at(-1);
                setMaidata(parsed);
                setDifficulty(preferred?.key ?? '');
                setChartSource(origin);
                setShowPaste(false);
                setStatus(
                    `已讀取「${parsed.title}」的 ${parsed.charts.length} 個難度。`,
                );
                return true;
            } catch (caught) {
                setMaidata(null);
                setDifficulty('');
                setChartSource(null);
                setError(
                    caught instanceof Error
                        ? `Simai 解析失敗：${caught.message}`
                        : 'Simai 解析失敗，請確認 maidata.txt 格式。',
                );
                return false;
            }
        },
        [clearOutputs],
    );

    const loadMaidata = useCallback(
        async (file: File, origin = '上傳 maidata.txt') => {
            const requestId = ++chartRequestId.current;
            setError(null);
            clearOutputs();
            setMaidata(null);
            setDifficulty('');
            setChartSource(null);
            setMaidataFile(file);
            setMaidataText('');
            setIsChartLoading(false);
            try {
                const source = await file.text();
                if (requestId !== chartRequestId.current) return false;
                return parseMaidataSource(source, origin, file);
            } catch (caught) {
                if (requestId !== chartRequestId.current) return false;
                setShowPaste(true);
                const reason =
                    caught instanceof DOMException &&
                    caught.name === 'NotReadableError'
                        ? '瀏覽器無法取得此檔案的內容。這常發生於手機 PWA、雲端或網路掛載路徑；可改用下方文字貼上功能。'
                        : caught instanceof Error
                          ? caught.message
                          : '瀏覽器無法讀取 maidata.txt。';
                setError(`讀檔失敗：${reason}`);
                return false;
            }
        },
        [clearOutputs, parseMaidataSource],
    );

    const handleFolderSelect = async (files: FileList | null) => {
        if (!files?.length) return;
        setError(null);
        const found = findSongFolderFiles(Array.from(files));
        if (found.song) setSongFile(found.song);
        if (found.maidata) {
            const loaded = await loadMaidata(found.maidata, '歌曲資料夾');
            if (loaded) {
                setStatus(
                    found.song
                        ? `已從資料夾載入 maidata.txt 與 ${found.song.name}。`
                        : '已從資料夾載入 maidata.txt；歌曲音檔可選填。',
                );
            }
        } else {
            setError(
                found.song
                    ? '已找到 track 音檔，請再選擇 maidata.txt。'
                    : '資料夾中找不到 maidata.txt。',
            );
        }
    };

    const selectMaiChart = async (song: MaiNotesSong, chart: MaiNotesChart) => {
        const requestId = ++chartRequestId.current;
        setError(null);
        clearOutputs();
        setMaidata(null);
        setMaidataFile(null);
        setMaidataText('');
        setShowPaste(false);
        setDifficulty('');
        setChartSource(null);
        setIsChartLoading(true);
        try {
            const source = await loadMaiNotesChart(chart.id);
            if (requestId !== chartRequestId.current) return;
            const parsed = parseSingleSimaiChart(source, {
                title: song.title,
                artist: song.artist,
                difficulty: chart.difficulty,
                level: chart.level,
            });
            if (requestId !== chartRequestId.current) return;
            setMaidata(parsed);
            setDifficulty(parsed.charts[0].key);
            setChartSource(`mai-notes · ${song.title} · ${chart.difficulty}`);
            setStatus(
                `已載入 mai-notes「${song.title}」${chart.difficulty} 譜面。`,
            );
        } catch (caught) {
            if (requestId !== chartRequestId.current) return;
            setError(
                caught instanceof Error
                    ? `mai-notes 譜面載入失敗：${caught.message}`
                    : 'mai-notes 譜面載入失敗。',
            );
        } finally {
            if (requestId === chartRequestId.current) setIsChartLoading(false);
        }
    };

    const updateProgress = async (value: number, message: string) => {
        setProgress(value);
        setStatus(message);
        await new Promise<void>((resolve) =>
            requestAnimationFrame(() => resolve()),
        );
    };

    const updateEncodingProgress = (
        start: number,
        span: number,
        message: string,
    ) => {
        let lastUpdate = -Infinity;
        return (value: number) => {
            const now = performance.now();
            if (value < 1 && now - lastUpdate < 250) {
                return Promise.resolve();
            }
            lastUpdate = now;
            return updateProgress(start + value * span, message);
        };
    };

    const startProcess = async () => {
        if (!maidata || !selectedChart || !timeline) {
            setError('請先載入有效的譜面，並選擇難度。');
            return;
        }
        if (!normalSoundFile) {
            setError('請先加入一般正解音檔案。');
            return;
        }
        if (timeline.events.length === 0) {
            setError('所選譜面沒有可輸出的判定時間。');
            return;
        }

        clearOutputs();
        setError(null);
        setIsProcessing(true);
        setProgress(1);

        try {
            await updateProgress(5, '正在解碼已提供的音檔…');
            const [song, normalSound, breakSound] = await Promise.all([
                songFile
                    ? decodeAudioFile(songFile)
                    : Promise.resolve(undefined),
                decodeAudioFile(normalSoundFile),
                breakSoundFile
                    ? decodeAudioFile(breakSoundFile)
                    : Promise.resolve(undefined),
            ]);
            const title = safeFilename(maidata.title);
            const diffName =
                DIFFICULTY_NAMES[selectedChart.difficulty] ?? selectedChart.key;
            const completed: (Omit<OutputFile, 'url'> & { blob: Blob })[] = [];

            if (song) {
                await updateProgress(
                    14,
                    `已建立 ${timeline.events.length} 個判定時點，準備含 BGM 版本…`,
                );
                const withBgm = await renderAnswerTrack({
                    song,
                    normalSound,
                    breakSound,
                    events: timeline.events,
                    includeBgm: true,
                    answerVolume,
                    breakVolume,
                    onProgress: (value) =>
                        updateProgress(
                            14 + value * 10,
                            '正在配置含 BGM 正解音…',
                        ),
                });
                const blob = await encodeMp3(
                    withBgm,
                    updateEncodingProgress(25, 30, '正在編碼含 BGM 的 MP3…'),
                );
                completed.push({
                    blob,
                    filename: `${title}_${diffName}_with_BGM.mp3`,
                    title: '含背景音樂',
                    duration: withBgm.duration,
                });
            }

            const renderStart = song ? 57 : 15;
            const encodeStart = song ? 68 : 30;
            await updateProgress(renderStart, '正在渲染純正解音版本…');
            const withoutBgm = await renderAnswerTrack({
                song,
                normalSound,
                breakSound,
                events: timeline.events,
                includeBgm: false,
                answerVolume,
                breakVolume,
                onProgress: (value) =>
                    updateProgress(
                        renderStart + value * 10,
                        '正在配置純正解音…',
                    ),
            });
            const blob = await encodeMp3(
                withoutBgm,
                updateEncodingProgress(
                    encodeStart,
                    98 - encodeStart,
                    '正在編碼純正解音的 MP3…',
                ),
            );
            completed.push({
                blob,
                filename: `${title}_${diffName}_answer_only.mp3`,
                title: '純正解音',
                duration: withoutBgm.duration,
            });
            const resultFiles = completed.map(({ blob, ...output }) => ({
                ...output,
                url: URL.createObjectURL(blob),
            }));
            outputUrls.current = resultFiles.map((output) => output.url);
            setOutputs(resultFiles);
            await updateProgress(
                100,
                song
                    ? '兩個 MP3 都已完成，可試聽或下載。'
                    : '純正解音 MP3 已完成，可試聽或下載。',
            );
        } catch (caught) {
            console.error(caught);
            setError(
                caught instanceof Error
                    ? `處理失敗：${caught.message}`
                    : '處理失敗，瀏覽器可能不支援其中一個音訊格式。',
            );
            setStatus('處理未完成。');
        } finally {
            setIsProcessing(false);
        }
    };

    const folderInputProps = {
        webkitdirectory: '',
        directory: '',
    } as React.InputHTMLAttributes<HTMLInputElement>;

    const sourcesReady = Boolean(maidata && normalSoundFile);
    const chartReady = Boolean(selectedChart && timeline);
    const diffLabel = selectedChart
        ? `${DIFFICULTY_NAMES[selectedChart.difficulty] ?? selectedChart.key}${selectedChart.level ? ` ${selectedChart.level}` : ''}`
        : undefined;
    const stages: Stage[] = [
        {
            label: '來源',
            state: isChartLoading
                ? 'busy'
                : sourcesReady
                  ? 'done'
                  : error && !isProcessing && !outputs.length && !sourcesReady
                    ? 'error'
                    : 'active',
            value: isChartLoading
                ? '載入譜面'
                : sourcesReady
                  ? songFile
                      ? '譜面 + BGM'
                      : '譜面 + 音效'
                  : !maidata
                    ? '缺譜面'
                    : '缺正解音',
        },
        {
            label: '設定',
            state: chartReady ? 'done' : 'pending',
            value: diffLabel,
        },
        {
            label: '生成',
            state: isProcessing
                ? 'busy'
                : outputs.length
                  ? 'done'
                  : error && sourcesReady
                    ? 'error'
                    : sourcesReady && chartReady
                      ? 'active'
                      : 'pending',
            value: isProcessing
                ? `${Math.round(progress)}%`
                : outputs.length
                  ? `${outputs.length} 個 MP3`
                  : sourcesReady && chartReady
                    ? '待生成'
                    : undefined,
        },
        {
            label: '下載',
            state: outputs.length ? 'active' : 'pending',
            value: outputs.length ? '可試聽' : undefined,
        },
    ];

    const stats = maidata && selectedChart && timeline
        ? [
              { label: '來源', value: chartSource ?? '本機譜面', mono: false },
              { label: '曲名', value: maidata.title, mono: false },
              { label: '判定時點', value: `${timeline.events.length}`, mono: true },
              {
                  label: 'Break 時點',
                  value: `${breakCount}`,
                  mono: true,
                  tone: breakCount ? tool.amber : undefined,
              },
              { label: 'First', value: `${selectedChart.first.toFixed(3)}s`, mono: true },
          ]
        : [];

    const severity = error ? 'error' : outputs.length ? 'success' : 'info';

    return (
        <ThemeProvider theme={toolTheme}>
            <CssBaseline />
            <Box component="main" className={surfaceClass}>
                <Container maxWidth="md" sx={{ px: { xs: 2, sm: 3 }, pb: 4 }}>
                    <ToolIntro title="Simai 正解音生成器">
                        讀取本機或 mai-notes 譜面，在正確時點混入音效並輸出
                        MP3。檔案不會上傳。
                    </ToolIntro>

                    <Pipeline label="生成進度" stages={stages} />

                    <Stack spacing={2}>
                        <Panel
                            id="sources-title"
                            title="準備來源"
                            meta={`${[songFile, maidataFile ?? (maidata ? 1 : null), normalSoundFile, breakSoundFile].filter(Boolean).length} / 4`}
                        >
                            <Stack
                                direction={{ xs: 'column', sm: 'row' }}
                                sx={{
                                    gap: 1.5,
                                    alignItems: { xs: 'stretch', sm: 'center' },
                                    px: 2,
                                    py: 2,
                                    bgcolor: tool.accentSoft,
                                    borderBottom: `1px solid ${tool.seam}`,
                                }}
                            >
                                <Box sx={{ flex: 1 }}>
                                    <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
                                        快速匯入歌曲資料夾
                                    </Typography>
                                    <Typography
                                        sx={{ fontSize: 13, color: tool.textMuted, mt: 0.25, lineHeight: 1.6 }}
                                    >
                                        載入 maidata.txt；若有同一層的
                                        track.mp3／wav／ogg／m4a，也會自動加入。
                                    </Typography>
                                </Box>
                                <Button
                                    component="label"
                                    variant="outlined"
                                    startIcon={<IconFolder size={17} />}
                                    disabled={isProcessing}
                                    sx={{ flex: '0 0 auto' }}
                                >
                                    選擇資料夾
                                    <input
                                        hidden
                                        type="file"
                                        disabled={isProcessing}
                                        {...folderInputProps}
                                        onChange={(event) => {
                                            void handleFolderSelect(
                                                event.target.files,
                                            );
                                        }}
                                    />
                                </Button>
                            </Stack>

                            <FilePicker
                                id="maidata-file"
                                label="Simai 譜面"
                                hint="maidata.txt"
                                file={maidataFile}
                                accept=".txt,text/plain"
                                icon={IconFile}
                                disabled={isProcessing}
                                onChange={(file) => {
                                    if (file) void loadMaidata(file);
                                }}
                            />
                            <FilePicker
                                id="normal-answer-file"
                                label="一般正解音"
                                hint="每個判定時點都會播放"
                                file={normalSoundFile}
                                accept="audio/*"
                                icon={IconWave}
                                disabled={isProcessing}
                                onChange={setNormalSoundFile}
                            />
                            <FilePicker
                                id="song-file"
                                label="歌曲音檔（BGM）"
                                hint="track.mp3、WAV、OGG 或 M4A"
                                file={songFile}
                                accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac"
                                icon={IconMusic}
                                optional
                                disabled={isProcessing}
                                onChange={setSongFile}
                            />
                            <FilePicker
                                id="break-answer-file"
                                label="Break 正解音"
                                hint="Break 時額外疊加；未選擇則不疊加"
                                file={breakSoundFile}
                                accept="audio/*"
                                icon={IconBolt}
                                optional
                                disabled={isProcessing}
                                onChange={setBreakSoundFile}
                            />

                            <MaiNotesSearch
                                key={chartSource ?? 'no-chart'}
                                disabled={isProcessing}
                                chartLoading={isChartLoading}
                                onSelect={(song, chart) =>
                                    void selectMaiChart(song, chart)
                                }
                            />

                            {showPaste && (
                                <Stack
                                    spacing={1.5}
                                    sx={{
                                        p: 2,
                                        borderTop: `1px solid ${tool.seam}`,
                                        bgcolor: tool.redSoft,
                                    }}
                                >
                                    <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
                                        瀏覽器無法取得檔案內容？
                                    </Typography>
                                    <Typography sx={{ fontSize: 13, color: tool.textMuted, lineHeight: 1.6 }}>
                                        若檔案位於手機文件供應器、網路磁碟或掛載目錄，可直接貼上
                                        maidata.txt 的完整內容。
                                    </Typography>
                                    <TextField
                                        label="maidata.txt 內容"
                                        value={maidataText}
                                        onChange={(event) =>
                                            setMaidataText(event.target.value)
                                        }
                                        multiline
                                        minRows={5}
                                        fullWidth
                                        slotProps={{
                                            input: { sx: { ...monoSx, fontSize: 13 } },
                                        }}
                                    />
                                    <Button
                                        variant="outlined"
                                        disabled={!maidataText.trim()}
                                        onClick={() =>
                                            parseMaidataSource(
                                                maidataText,
                                                '貼上 maidata.txt',
                                            )
                                        }
                                    >
                                        解析貼上的內容
                                    </Button>
                                </Stack>
                            )}
                        </Panel>

                        <Panel
                            id="settings-title"
                            title="譜面與輸出設定"
                            meta={maidata ? `${maidata.charts.length} 個難度` : '尚未載入'}
                        >
                            <Box sx={{ p: 2 }}>
                                <FormControl
                                    fullWidth
                                    disabled={
                                        !maidata ||
                                        isProcessing ||
                                        chartSource?.startsWith('mai-notes')
                                    }
                                >
                                    <InputLabel id="difficulty-label">難度</InputLabel>
                                    <Select
                                        labelId="difficulty-label"
                                        value={difficulty}
                                        label="難度"
                                        onChange={(event) =>
                                            setDifficulty(event.target.value)
                                        }
                                    >
                                        {!maidata && (
                                            <MenuItem value="">請先載入譜面</MenuItem>
                                        )}
                                        {maidata?.charts.map((chart) => (
                                            <MenuItem key={chart.key} value={chart.key}>
                                                {DIFFICULTY_NAMES[chart.difficulty] ??
                                                    chart.key}
                                                {chart.level ? ` · Lv ${chart.level}` : ''}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Box>

                            {stats.length > 0 && (
                                <Box
                                    component="dl"
                                    sx={{
                                        m: 0,
                                        display: 'grid',
                                        gridTemplateColumns: {
                                            xs: '1fr 1fr',
                                            sm: '1.4fr 1.4fr 1fr 1fr 1fr',
                                        },
                                        borderTop: `1px solid ${tool.seam}`,
                                        '& > div': {
                                            px: 2,
                                            py: 1.25,
                                            minWidth: 0,
                                            borderBottom: `1px solid ${tool.seam}`,
                                        },
                                        '& > div:last-of-type:nth-of-type(odd)': {
                                            gridColumn: { xs: '1 / -1', sm: 'auto' },
                                        },
                                    }}
                                >
                                    {stats.map((stat) => (
                                        <Box key={stat.label}>
                                            <Typography
                                                component="dt"
                                                sx={{ fontSize: 12, color: tool.textFaint }}
                                            >
                                                {stat.label}
                                            </Typography>
                                            <Typography
                                                component="dd"
                                                noWrap
                                                title={stat.value}
                                                sx={{
                                                    m: 0,
                                                    mt: 0.25,
                                                    fontSize: stat.mono ? 16 : 14,
                                                    fontWeight: 600,
                                                    color: stat.tone ?? tool.text,
                                                    ...(stat.mono ? monoSx : {}),
                                                }}
                                            >
                                                {stat.value}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Box>
                            )}

                            <Box
                                sx={{
                                    display: 'grid',
                                    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                                    columnGap: 4,
                                    rowGap: 1,
                                    px: 2,
                                    pt: 2,
                                    pb: 1,
                                    borderTop: stats.length ? 'none' : `1px solid ${tool.seam}`,
                                }}
                            >
                                <Box>
                                    <Stack direction="row" sx={{ alignItems: 'baseline', justifyContent: 'space-between' }}>
                                        <Typography id="answer-volume-label" sx={{ fontSize: 14, fontWeight: 600 }}>
                                            正解音音量
                                        </Typography>
                                        <Typography sx={{ ...monoSx, fontSize: 14, color: tool.accent }}>
                                            {Math.round(answerVolume * 100)}%
                                        </Typography>
                                    </Stack>
                                    <Slider
                                        value={answerVolume}
                                        min={0.1}
                                        max={1.5}
                                        step={0.05}
                                        disabled={isProcessing}
                                        onChange={(_, value) =>
                                            setAnswerVolume(value as number)
                                        }
                                        aria-label="正解音音量"
                                    />
                                </Box>
                                <Box>
                                    <Stack direction="row" sx={{ alignItems: 'baseline', justifyContent: 'space-between' }}>
                                        <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
                                            Break 音效音量
                                        </Typography>
                                        <Typography
                                            sx={{
                                                ...monoSx,
                                                fontSize: 14,
                                                color: breakSoundFile ? tool.amber : tool.textFaint,
                                            }}
                                        >
                                            {Math.round(breakVolume * 100)}%
                                        </Typography>
                                    </Stack>
                                    <Slider
                                        color="secondary"
                                        value={breakVolume}
                                        min={0.1}
                                        max={1.5}
                                        step={0.05}
                                        disabled={isProcessing || !breakSoundFile}
                                        onChange={(_, value) =>
                                            setBreakVolume(value as number)
                                        }
                                        aria-label="Break 音效音量"
                                    />
                                </Box>
                            </Box>
                            <Tooltip title="同一時點的一般正解音只播放一次；若含 Break，再額外疊加一次 Break 音效。">
                                <Typography
                                    tabIndex={0}
                                    sx={{
                                        px: 2,
                                        pb: 2,
                                        fontSize: 12,
                                        color: tool.textMuted,
                                        width: 'fit-content',
                                        cursor: 'help',
                                        textDecoration: 'underline dotted',
                                        textUnderlineOffset: '3px',
                                    }}
                                >
                                    同拍去重 + Break 疊加
                                </Typography>
                            </Tooltip>
                        </Panel>

                        <Alert
                            severity={severity}
                            variant="outlined"
                            sx={{
                                bgcolor: tool.panel,
                                borderColor:
                                    severity === 'error'
                                        ? 'rgba(255,128,128,.5)'
                                        : severity === 'success'
                                          ? 'rgba(95,211,141,.45)'
                                          : tool.seam,
                                color: tool.text,
                                fontSize: 14,
                            }}
                        >
                            {error ?? status}
                        </Alert>

                        {outputs.length > 0 && (
                            <Panel
                                id="results-title"
                                title="試聽與下載"
                                meta={`${outputs.length} 個檔案`}
                            >
                                {outputs.map((output) => (
                                    <ResultPlayer key={output.url} output={output} />
                                ))}
                            </Panel>
                        )}
                    </Stack>

                    <Typography
                        sx={{
                            mt: 3,
                            fontSize: 12,
                            color: tool.textFaint,
                            textAlign: 'center',
                        }}
                    >
                        音訊解碼、混音與 MP3 編碼皆在本機瀏覽器執行
                    </Typography>
                </Container>

                <Box
                    sx={{
                        position: 'sticky',
                        bottom: 0,
                        zIndex: 10,
                        mt: 1,
                        borderTop: `1px solid ${tool.seam}`,
                        bgcolor: 'rgba(17,19,23,.94)',
                        backdropFilter: 'blur(10px)',
                        pb: 'env(safe-area-inset-bottom)',
                    }}
                >
                    <Container maxWidth="md" sx={{ px: { xs: 2, sm: 3 }, py: 1.5 }}>
                        {isProcessing && (
                            <Box sx={{ mb: 1.25 }}>
                                <Stack
                                    direction="row"
                                    sx={{ justifyContent: 'space-between', gap: 2, mb: 0.75 }}
                                >
                                    <Typography noWrap sx={{ fontSize: 13, color: tool.textMuted }}>
                                        {status}
                                    </Typography>
                                    <Typography sx={{ ...monoSx, fontSize: 13 }}>
                                        {Math.round(progress)}%
                                    </Typography>
                                </Stack>
                                <LinearProgress variant="determinate" value={progress} />
                            </Box>
                        )}
                        {!isProcessing && outputs.length > 1 && (
                            <Button
                                component="a"
                                href={outputs[0].url}
                                download={outputs[0].filename}
                                variant="contained"
                                size="large"
                                fullWidth
                                startIcon={<IconDownload size={17} />}
                                sx={{ mb: 1, fontSize: 15 }}
                            >
                                下載{outputs[0].title}
                            </Button>
                        )}
                        <Stack direction="row" sx={{ gap: 1 }}>
                            <Button
                                variant={
                                    outputs.length || !(sourcesReady && chartReady)
                                        ? 'outlined'
                                        : 'contained'
                                }
                                color="primary"
                                size="large"
                                disabled={isProcessing || isChartLoading}
                                onClick={() => void startProcess()}
                                sx={{
                                    flex: 1,
                                    minWidth: 0,
                                    fontSize: outputs.length ? 14 : 16,
                                }}
                            >
                                {isProcessing
                                    ? '正在生成…'
                                    : outputs.length
                                      ? '重新生成'
                                      : songFile
                                        ? '生成兩個 MP3'
                                        : '生成純正解音 MP3'}
                            </Button>
                            {!isProcessing &&
                                outputs.slice(outputs.length > 1 ? 1 : 0).map((output) => (
                                    <Button
                                        key={output.url}
                                        component="a"
                                        href={output.url}
                                        download={output.filename}
                                        variant={outputs.length > 1 ? 'outlined' : 'contained'}
                                        size="large"
                                        startIcon={<IconDownload size={17} />}
                                        sx={{ flex: 1.6, minWidth: 0, fontSize: 14, whiteSpace: 'nowrap' }}
                                    >
                                        下載{output.title}
                                    </Button>
                                ))}
                        </Stack>
                    </Container>
                </Box>
            </Box>
        </ThemeProvider>
    );
}
