import { useMemo, useState } from 'react';
import {
    Alert,
    Autocomplete,
    Box,
    Button,
    CircularProgress,
    LinearProgress,
    Stack,
    TextField,
    Typography,
    createFilterOptions,
} from '@mui/material';
import { IconSearch } from '../_tool-ui/icons';
import { tool } from '../_tool-ui/tokens';
import {
    loadMaiNotesManifest,
    type MaiNotesManifest,
    type MaiNotesSong,
    type MaiNotesChart,
} from './mai-notes';

const songLabel = (song: MaiNotesSong) =>
    `${song.title}${song.type ? ` · ${song.type === 'deluxe' ? 'DX' : 'STANDARD'}` : ''}`;

const filterSongs = createFilterOptions<MaiNotesSong>({
    limit: 30,
    stringify: (song) => song.title,
});

export function MaiNotesSearch({
    disabled,
    chartLoading,
    onSelect,
}: {
    disabled: boolean;
    chartLoading: boolean;
    onSelect: (song: MaiNotesSong, chart: MaiNotesChart) => void;
}) {
    const [manifest, setManifest] = useState<MaiNotesManifest | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [song, setSong] = useState<MaiNotesSong | null>(null);
    const songs = useMemo(
        () => Object.values(manifest?.songs ?? {}),
        [manifest],
    );
    const charts = useMemo(
        () =>
            manifest?.charts.filter(
                (chart) =>
                    chart.song_id === song?.id && chart.has_chart_data === true,
            ) ?? [],
        [manifest, song],
    );

    const openSearch = async () => {
        if (manifest || loading) return;
        setError(null);
        setLoading(true);
        try {
            setManifest(await loadMaiNotesManifest());
        } catch (caught) {
            setError(
                caught instanceof Error
                    ? caught.message
                    : 'mai-notes 曲目清單載入失敗。',
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ p: 2, borderTop: `1px solid ${tool.seam}` }}>
            <Stack spacing={2}>
                <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={2}
                    sx={{ alignItems: { sm: 'center' } }}
                >
                    <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
                            或從 mai-notes 選擇譜面
                        </Typography>
                        <Typography sx={{ fontSize: 13, color: tool.textMuted, mt: 0.25 }}>
                            直接選擇歌曲與難度，無需上傳 maidata.txt。
                        </Typography>
                    </Box>
                    {!manifest && (
                        <Button
                            variant="outlined"
                            startIcon={<IconSearch size={16} />}
                            disabled={disabled || loading || chartLoading}
                            onClick={() => void openSearch()}
                        >
                            {loading ? '正在載入曲目…' : '搜尋 mai-notes'}
                        </Button>
                    )}
                </Stack>
                {loading && <LinearProgress />}
                {error && <Alert severity="error">{error}</Alert>}
                {manifest && (
                    <>
                        <Autocomplete
                            options={songs}
                            value={song}
                            disabled={disabled || chartLoading}
                            filterOptions={filterSongs}
                            getOptionKey={(option) => option.id}
                            getOptionLabel={songLabel}
                            isOptionEqualToValue={(option, value) =>
                                option.id === value.id
                            }
                            onChange={(_, value) => setSong(value)}
                            noOptionsText="找不到符合的歌曲。"
                            renderOption={(props, option) => {
                                const { key, ...other } = props;
                                return (
                                    <li {...other} key={key}>
                                        {songLabel(option)}
                                        {option.artist
                                            ? ` · ${option.artist}`
                                            : ''}
                                    </li>
                                );
                            }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="搜尋歌曲名稱"
                                    helperText="輸入曲名搜尋；曲目清單在本次頁面使用期間只下載一次。"
                                />
                            )}
                        />
                        {song && (
                            <Stack spacing={1}>
                                <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
                                    {song.title} · 選擇譜面
                                </Typography>
                                {charts.length === 0 ? (
                                    <Alert severity="warning">
                                        這首歌曲目前沒有可讀取的譜面資料。
                                    </Alert>
                                ) : (
                                    <Stack
                                        direction="row"
                                        sx={{ gap: 1, flexWrap: 'wrap' }}
                                    >
                                        {charts.map((chart) => (
                                            <Button
                                                key={chart.id}
                                                variant="outlined"
                                                disabled={
                                                    disabled || chartLoading
                                                }
                                                onClick={() =>
                                                    onSelect(song, chart)
                                                }
                                            >
                                                {chart.difficulty}
                                                {chart.level
                                                    ? ` · Lv ${chart.level}`
                                                    : ''}
                                            </Button>
                                        ))}
                                    </Stack>
                                )}
                            </Stack>
                        )}
                    </>
                )}
                {chartLoading && (
                    <Stack
                        direction="row"
                        spacing={1}
                        sx={{ alignItems: 'center' }}
                    >
                        <CircularProgress size={16} />
                        <Typography sx={{ fontSize: 13, color: tool.textMuted }}>正在載入譜面…</Typography>
                    </Stack>
                )}
            </Stack>
        </Box>
    );
}
