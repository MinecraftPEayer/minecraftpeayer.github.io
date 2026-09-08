'use client';

import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Container,
    CssBaseline,
    Divider,
    FormControl,
    InputLabel,
    LinearProgress,
    MenuItem,
    Paper,
    Select,
    Slider,
    Stack,
    TextField,
    ThemeProvider,
    Tooltip,
    Typography,
} from '@mui/material';
import AudiotrackRoundedIcon from '@mui/icons-material/AudiotrackRounded';
import BoltRoundedIcon from '@mui/icons-material/BoltRounded';
import FolderOpenRoundedIcon from '@mui/icons-material/FolderOpenRounded';
import InsertDriveFileRoundedIcon from '@mui/icons-material/InsertDriveFileRounded';
import MusicNoteRoundedIcon from '@mui/icons-material/MusicNoteRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { decodeAudioFile, encodeMp3, renderAnswerTrack } from './audio';
import { buildAnswerTimeline, parseMaidata, type Maidata } from './simai';
import { FilePicker, ResultPlayer, toolTheme, type OutputFile } from './ui';

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

    const parseMaidataSource = useCallback((source: string, file?: File) => {
        setError(null);
        try {
            const parsed = parseMaidata(source);
            const preferred =
                parsed.charts.find((chart) => chart.difficulty === 5) ??
                parsed.charts.at(-1);
            if (file) setMaidataFile(file);
            setMaidata(parsed);
            setDifficulty(preferred?.key ?? '');
            setShowPaste(false);
            setStatus(
                `已讀取「${parsed.title}」的 ${parsed.charts.length} 個難度。`,
            );
        } catch (caught) {
            setMaidata(null);
            setDifficulty('');
            setError(
                caught instanceof Error
                    ? `Simai 解析失敗：${caught.message}`
                    : 'Simai 解析失敗，請確認 maidata.txt 格式。',
            );
        }
    }, []);

    const loadMaidata = useCallback(
        async (file: File) => {
            setError(null);
            setMaidataFile(file);
            try {
                const source = await file.text();
                parseMaidataSource(source, file);
            } catch (caught) {
                setMaidata(null);
                setDifficulty('');
                setShowPaste(true);
                const reason =
                    caught instanceof DOMException &&
                    caught.name === 'NotReadableError'
                        ? '瀏覽器無法取得此檔案的內容。這常發生於手機 PWA、雲端或網路掛載路徑；可改用下方文字貼上功能。'
                        : caught instanceof Error
                          ? caught.message
                          : '瀏覽器無法讀取 maidata.txt。';
                setError(`讀檔失敗：${reason}`);
            }
        },
        [parseMaidataSource],
    );

    const handleFolderSelect = async (files: FileList | null) => {
        if (!files?.length) return;
        setError(null);
        const found = findSongFolderFiles(Array.from(files));
        if (found.song) setSongFile(found.song);
        if (found.maidata) await loadMaidata(found.maidata);

        if (found.song && found.maidata) {
            setStatus(`已從同一資料夾載入 ${found.song.name} 與 maidata.txt。`);
        } else if (!found.song && !found.maidata) {
            setError('資料夾中找不到 maidata.txt 或可支援的 track 音檔。');
        } else {
            setError(
                found.song
                    ? '已找到 track 音檔，請再選擇 maidata.txt。'
                    : '已找到 maidata.txt，請再選擇 track.mp3／wav／ogg／m4a。',
            );
        }
    };

    const updateProgress = async (value: number, message: string) => {
        setProgress(value);
        setStatus(message);
        await new Promise<void>((resolve) =>
            requestAnimationFrame(() => resolve()),
        );
    };

    const startProcess = async () => {
        if (
            !songFile ||
            !normalSoundFile ||
            !maidata ||
            !selectedChart ||
            !timeline
        ) {
            setError('請先加入歌曲、maidata.txt、一般正解音，並選擇難度。');
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
            await updateProgress(5, '正在解碼歌曲與正解音…');
            const [song, normalSound, breakSound] = await Promise.all([
                decodeAudioFile(songFile),
                decodeAudioFile(normalSoundFile),
                breakSoundFile
                    ? decodeAudioFile(breakSoundFile)
                    : Promise.resolve(undefined),
            ]);

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
                    updateProgress(14 + value * 10, '正在配置含 BGM 正解音…'),
            });
            const withBgmBlob = await encodeMp3(withBgm, (value) =>
                updateProgress(25 + value * 30, '正在編碼含 BGM 的 MP3…'),
            );

            await updateProgress(57, '正在渲染純正解音版本…');
            const withoutBgm = await renderAnswerTrack({
                song,
                normalSound,
                breakSound,
                events: timeline.events,
                includeBgm: false,
                answerVolume,
                breakVolume,
                onProgress: (value) =>
                    updateProgress(57 + value * 10, '正在配置純正解音…'),
            });
            const withoutBgmBlob = await encodeMp3(withoutBgm, (value) =>
                updateProgress(68 + value * 30, '正在編碼純正解音的 MP3…'),
            );

            const title = safeFilename(maidata.title);
            const diffName =
                DIFFICULTY_NAMES[selectedChart.difficulty] ?? selectedChart.key;
            const withBgmUrl = URL.createObjectURL(withBgmBlob);
            const withoutBgmUrl = URL.createObjectURL(withoutBgmBlob);
            outputUrls.current = [withBgmUrl, withoutBgmUrl];
            setOutputs([
                {
                    url: withBgmUrl,
                    filename: `${title}_${diffName}_with_BGM.mp3`,
                    title: '含背景音樂',
                    duration: withBgm.duration,
                },
                {
                    url: withoutBgmUrl,
                    filename: `${title}_${diffName}_answer_only.mp3`,
                    title: '純正解音',
                    duration: withoutBgm.duration,
                },
            ]);
            await updateProgress(100, '兩個 MP3 都已完成，可試聽或下載。');
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

    return (
        <ThemeProvider theme={toolTheme}>
            <CssBaseline />
            <Box
                component="main"
                sx={{
                    minHeight: '100vh',
                    py: { xs: 4, md: 8 },
                    background:
                        'radial-gradient(circle at 12% 5%, rgba(42,143,147,.24), transparent 32rem), radial-gradient(circle at 88% 14%, rgba(255,151,80,.13), transparent 28rem), #07111d',
                }}
            >
                <Container maxWidth="md">
                    <Stack spacing={4}>
                        <Box sx={{ textAlign: 'center' }}>
                            <Chip
                                icon={<BoltRoundedIcon />}
                                label="100% 在瀏覽器內完成"
                                color="primary"
                                variant="outlined"
                                sx={{ mb: 2 }}
                            />
                            <Typography
                                component="h1"
                                variant="h1"
                                sx={{
                                    fontSize: { xs: '2.4rem', md: '3.7rem' },
                                }}
                            >
                                Simai 正解音
                                <Box component="span" color="primary.main">
                                    生成器
                                </Box>
                            </Typography>
                            <Typography color="text.secondary" sx={{ mt: 1.5 }}>
                                讀取 maidata.txt，在正確時點混入音效並輸出 MP3。
                                檔案不會上傳。
                            </Typography>
                        </Box>

                        <Paper
                            variant="outlined"
                            sx={{
                                p: { xs: 2.5, sm: 3 },
                                borderStyle: 'dashed',
                                borderColor: 'rgba(120,231,212,.38)',
                                bgcolor: 'rgba(120,231,212,.055)',
                            }}
                        >
                            <Stack
                                direction={{ xs: 'column', sm: 'row' }}
                                spacing={2}
                                sx={{
                                    alignItems: { xs: 'stretch', sm: 'center' },
                                }}
                            >
                                <Box sx={{ flex: 1 }}>
                                    <Typography
                                        variant="h6"
                                        sx={{ fontWeight: 800 }}
                                    >
                                        快速匯入歌曲資料夾
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                    >
                                        優先配對同一層的 maidata.txt 與
                                        track.mp3／wav／ogg／m4a。
                                    </Typography>
                                </Box>
                                <Button
                                    component="label"
                                    variant="contained"
                                    startIcon={<FolderOpenRoundedIcon />}
                                    size="large"
                                >
                                    選擇資料夾
                                    <input
                                        hidden
                                        type="file"
                                        {...folderInputProps}
                                        onChange={(event) => {
                                            void handleFolderSelect(
                                                event.target.files,
                                            );
                                        }}
                                    />
                                </Button>
                            </Stack>
                        </Paper>

                        <Box>
                            <Typography
                                variant="h5"
                                component="h2"
                                sx={{ mb: 2 }}
                            >
                                1. 準備來源
                            </Typography>
                            <Box
                                sx={{
                                    display: 'grid',
                                    gridTemplateColumns: {
                                        xs: '1fr',
                                        sm: '1fr 1fr',
                                    },
                                    gap: 2,
                                }}
                            >
                                <FilePicker
                                    id="song-file"
                                    label="歌曲音檔"
                                    hint="track.mp3、WAV、OGG 或 M4A"
                                    file={songFile}
                                    accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac"
                                    icon={MusicNoteRoundedIcon}
                                    onChange={setSongFile}
                                />
                                <FilePicker
                                    id="maidata-file"
                                    label="Simai 譜面"
                                    hint="maidata.txt"
                                    file={maidataFile}
                                    accept=".txt,text/plain"
                                    icon={InsertDriveFileRoundedIcon}
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
                                    icon={AudiotrackRoundedIcon}
                                    onChange={setNormalSoundFile}
                                />
                                <FilePicker
                                    id="break-answer-file"
                                    label="Break 正解音"
                                    hint="Break 時額外疊加；未選擇則不疊加"
                                    file={breakSoundFile}
                                    accept="audio/*"
                                    icon={BoltRoundedIcon}
                                    optional
                                    onChange={setBreakSoundFile}
                                />
                            </Box>
                            {showPaste && (
                                <Paper
                                    variant="outlined"
                                    sx={{
                                        p: 2,
                                        mt: 2,
                                        bgcolor: 'rgba(255,126,142,.04)',
                                    }}
                                >
                                    <Stack spacing={1.5}>
                                        <Typography sx={{ fontWeight: 750 }}>
                                            瀏覽器無法取得檔案內容？
                                        </Typography>
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                        >
                                            若檔案位於手機文件供應器、網路磁碟或掛載目錄，可直接貼上
                                            maidata.txt 的完整內容。
                                        </Typography>
                                        <TextField
                                            label="maidata.txt 內容"
                                            value={maidataText}
                                            onChange={(event) =>
                                                setMaidataText(
                                                    event.target.value,
                                                )
                                            }
                                            multiline
                                            minRows={5}
                                            fullWidth
                                        />
                                        <Button
                                            variant="outlined"
                                            disabled={!maidataText.trim()}
                                            onClick={() =>
                                                parseMaidataSource(maidataText)
                                            }
                                        >
                                            解析貼上的內容
                                        </Button>
                                    </Stack>
                                </Paper>
                            )}
                        </Box>

                        <Box>
                            <Typography
                                variant="h5"
                                component="h2"
                                sx={{ mb: 2 }}
                            >
                                2. 譜面與輸出設定
                            </Typography>
                            <Card variant="outlined">
                                <CardContent>
                                    <Stack spacing={3}>
                                        <FormControl
                                            fullWidth
                                            disabled={!maidata}
                                        >
                                            <InputLabel id="difficulty-label">
                                                難度
                                            </InputLabel>
                                            <Select
                                                labelId="difficulty-label"
                                                value={difficulty}
                                                label="難度"
                                                onChange={(event) =>
                                                    setDifficulty(
                                                        event.target.value,
                                                    )
                                                }
                                            >
                                                {!maidata && (
                                                    <MenuItem value="">
                                                        請先讀取 maidata.txt
                                                    </MenuItem>
                                                )}
                                                {maidata?.charts.map(
                                                    (chart) => (
                                                        <MenuItem
                                                            key={chart.key}
                                                            value={chart.key}
                                                        >
                                                            {DIFFICULTY_NAMES[
                                                                chart.difficulty
                                                            ] ?? chart.key}
                                                            {chart.level
                                                                ? ` · Lv ${chart.level}`
                                                                : ''}
                                                        </MenuItem>
                                                    ),
                                                )}
                                            </Select>
                                        </FormControl>

                                        {maidata &&
                                            selectedChart &&
                                            timeline && (
                                                <Stack
                                                    direction="row"
                                                    sx={{
                                                        gap: 1,
                                                        flexWrap: 'wrap',
                                                    }}
                                                >
                                                    <Chip
                                                        label={maidata.title}
                                                        color="primary"
                                                    />
                                                    <Chip
                                                        label={`${timeline.events.length} 個時點`}
                                                    />
                                                    <Chip
                                                        label={`${breakCount} 個 Break 時點`}
                                                        color={
                                                            breakCount
                                                                ? 'secondary'
                                                                : 'default'
                                                        }
                                                    />
                                                    <Chip
                                                        label={`First ${selectedChart.first.toFixed(3)}s`}
                                                    />
                                                </Stack>
                                            )}

                                        <Divider />
                                        <Stack
                                            direction={{
                                                xs: 'column',
                                                sm: 'row',
                                            }}
                                            spacing={3}
                                            sx={{
                                                alignItems: {
                                                    xs: 'stretch',
                                                    sm: 'center',
                                                },
                                            }}
                                        >
                                            <Box sx={{ flex: 1 }}>
                                                <Stack
                                                    direction="row"
                                                    spacing={1}
                                                    sx={{
                                                        alignItems: 'center',
                                                    }}
                                                >
                                                    <TuneRoundedIcon
                                                        color="primary"
                                                        fontSize="small"
                                                    />
                                                    <Typography
                                                        sx={{ fontWeight: 750 }}
                                                    >
                                                        正解音音量
                                                    </Typography>
                                                    <Typography
                                                        color="primary.main"
                                                        sx={{ fontWeight: 750 }}
                                                    >
                                                        {Math.round(
                                                            answerVolume * 100,
                                                        )}
                                                        %
                                                    </Typography>
                                                </Stack>
                                                <Slider
                                                    value={answerVolume}
                                                    min={0.1}
                                                    max={1.5}
                                                    step={0.05}
                                                    disabled={isProcessing}
                                                    onChange={(_, value) =>
                                                        setAnswerVolume(
                                                            value as number,
                                                        )
                                                    }
                                                    aria-label="正解音音量"
                                                />
                                            </Box>
                                            <Box sx={{ flex: 1 }}>
                                                <Stack
                                                    direction="row"
                                                    spacing={1}
                                                    sx={{
                                                        alignItems: 'center',
                                                    }}
                                                >
                                                    <BoltRoundedIcon
                                                        color="secondary"
                                                        fontSize="small"
                                                    />
                                                    <Typography
                                                        sx={{ fontWeight: 750 }}
                                                    >
                                                        Break 音效音量
                                                    </Typography>
                                                    <Typography
                                                        color="secondary.main"
                                                        sx={{ fontWeight: 750 }}
                                                    >
                                                        {Math.round(
                                                            breakVolume * 100,
                                                        )}
                                                        %
                                                    </Typography>
                                                </Stack>
                                                <Slider
                                                    color="secondary"
                                                    value={breakVolume}
                                                    min={0.1}
                                                    max={1.5}
                                                    step={0.05}
                                                    disabled={
                                                        isProcessing ||
                                                        !breakSoundFile
                                                    }
                                                    onChange={(_, value) =>
                                                        setBreakVolume(
                                                            value as number,
                                                        )
                                                    }
                                                    aria-label="Break 音效音量"
                                                />
                                            </Box>
                                            <Tooltip title="同一時點的一般正解音只播放一次；若含 Break，再額外疊加一次 Break 音效。">
                                                <Chip
                                                    label="同拍去重 + Break 疊加"
                                                    variant="outlined"
                                                />
                                            </Tooltip>
                                        </Stack>
                                    </Stack>
                                </CardContent>
                            </Card>
                        </Box>

                        <Alert
                            severity={
                                error
                                    ? 'error'
                                    : outputs.length
                                      ? 'success'
                                      : 'info'
                            }
                            variant="outlined"
                        >
                            {error ?? status}
                        </Alert>

                        {isProcessing && (
                            <Box>
                                <Stack
                                    direction="row"
                                    sx={{
                                        justifyContent: 'space-between',
                                        mb: 1,
                                    }}
                                >
                                    <Typography variant="body2">
                                        {status}
                                    </Typography>
                                    <Typography variant="body2">
                                        {Math.round(progress)}%
                                    </Typography>
                                </Stack>
                                <LinearProgress
                                    variant="determinate"
                                    value={progress}
                                />
                            </Box>
                        )}

                        <Button
                            variant="contained"
                            color="primary"
                            size="large"
                            disabled={isProcessing}
                            onClick={() => void startProcess()}
                            sx={{ py: 1.6, fontSize: '1rem' }}
                        >
                            {isProcessing ? '正在生成…' : '生成兩個 MP3'}
                        </Button>

                        {outputs.length > 0 && (
                            <Stack spacing={2}>
                                <Typography variant="h5" component="h2">
                                    3. 試聽與下載
                                </Typography>
                                {outputs.map((output) => (
                                    <ResultPlayer
                                        key={output.url}
                                        output={output}
                                    />
                                ))}
                            </Stack>
                        )}

                        <Typography
                            variant="caption"
                            color="text.disabled"
                            sx={{ textAlign: 'center' }}
                        >
                            音訊解碼、混音與 MP3 編碼皆在本機瀏覽器執行
                        </Typography>
                    </Stack>
                </Container>
            </Box>
        </ThemeProvider>
    );
}
