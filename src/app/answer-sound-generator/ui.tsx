import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Stack,
    Typography,
    createTheme,
} from '@mui/material';
import AudiotrackRoundedIcon from '@mui/icons-material/AudiotrackRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import FolderOpenRoundedIcon from '@mui/icons-material/FolderOpenRounded';
import GraphicEqRoundedIcon from '@mui/icons-material/GraphicEqRounded';
import type { SvgIconComponent } from '@mui/icons-material';

export const toolTheme = createTheme({
    palette: {
        mode: 'dark',
        primary: { main: '#78e7d4', contrastText: '#071713' },
        secondary: { main: '#ffb86b' },
        background: { default: '#07111d', paper: '#101d2c' },
        success: { main: '#62df9a' },
        error: { main: '#ff7e8e' },
    },
    shape: { borderRadius: 18 },
    typography: {
        fontFamily: 'var(--font-nerd), "Noto Sans TC", system-ui, sans-serif',
        h1: { fontWeight: 800, letterSpacing: '-0.04em' },
        h2: { fontWeight: 750, letterSpacing: '-0.025em' },
        button: { fontWeight: 750, textTransform: 'none' },
    },
    components: {
        MuiButton: { defaultProps: { disableElevation: true } },
        MuiCard: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                    border: '1px solid rgba(255,255,255,.08)',
                },
            },
        },
        MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
    },
});

export interface OutputFile {
    url: string;
    filename: string;
    title: string;
    duration: number;
}

interface FilePickerProps {
    id: string;
    label: string;
    hint: string;
    file: File | null;
    accept: string;
    icon?: SvgIconComponent;
    optional?: boolean;
    onChange: (file: File | null) => void;
}

export function FilePicker({
    id,
    label,
    hint,
    file,
    accept,
    icon: Icon = AudiotrackRoundedIcon,
    optional,
    onChange,
}: FilePickerProps) {
    return (
        <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
                <Stack
                    direction="row"
                    spacing={1.5}
                    sx={{ alignItems: 'center', mb: 1.5 }}
                >
                    <Box
                        sx={{
                            display: 'grid',
                            placeItems: 'center',
                            width: 38,
                            height: 38,
                            borderRadius: 2.5,
                            color: file ? 'primary.main' : 'text.secondary',
                            bgcolor: file
                                ? 'rgba(120,231,212,.11)'
                                : 'rgba(255,255,255,.05)',
                        }}
                    >
                        <Icon fontSize="small" />
                    </Box>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Stack
                            direction="row"
                            spacing={1}
                            sx={{ alignItems: 'center' }}
                        >
                            <Typography sx={{ fontWeight: 750 }}>
                                {label}
                            </Typography>
                            {optional && (
                                <Chip
                                    label="選填"
                                    size="small"
                                    variant="outlined"
                                />
                            )}
                        </Stack>
                        <Typography variant="caption" color="text.secondary">
                            {hint}
                        </Typography>
                    </Box>
                </Stack>
                <Button
                    component="label"
                    htmlFor={id}
                    fullWidth
                    variant={file ? 'outlined' : 'contained'}
                    color={file ? 'primary' : 'inherit'}
                    startIcon={
                        file ? (
                            <CheckCircleRoundedIcon />
                        ) : (
                            <FolderOpenRoundedIcon />
                        )
                    }
                    sx={{ justifyContent: 'flex-start', overflow: 'hidden' }}
                >
                    <Typography component="span" noWrap>
                        {file?.name ?? '選擇檔案'}
                    </Typography>
                    <input
                        id={id}
                        hidden
                        type="file"
                        accept={accept}
                        onChange={(event) => {
                            onChange(event.target.files?.[0] ?? null);
                        }}
                    />
                </Button>
            </CardContent>
        </Card>
    );
}

export function ResultPlayer({ output }: { output: OutputFile }) {
    const minutes = Math.floor(output.duration / 60);
    const seconds = Math.floor(output.duration % 60)
        .toString()
        .padStart(2, '0');

    return (
        <Card variant="outlined">
            <CardContent>
                <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={2}
                    sx={{ alignItems: { xs: 'stretch', sm: 'center' } }}
                >
                    <Box
                        sx={{
                            width: 48,
                            height: 48,
                            flex: '0 0 auto',
                            display: { xs: 'none', sm: 'grid' },
                            placeItems: 'center',
                            borderRadius: 3,
                            bgcolor: 'rgba(120,231,212,.12)',
                            color: 'primary.main',
                        }}
                    >
                        <GraphicEqRoundedIcon />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 750 }}>
                            {output.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            MP3 · {minutes}:{seconds}
                        </Typography>
                        <Box
                            component="audio"
                            src={output.url}
                            controls
                            preload="metadata"
                            sx={{ width: '100%', height: 36, mt: 1 }}
                        />
                    </Box>
                    <Button
                        component="a"
                        href={output.url}
                        download={output.filename}
                        variant="outlined"
                        startIcon={<DownloadRoundedIcon />}
                    >
                        下載
                    </Button>
                </Stack>
            </CardContent>
        </Card>
    );
}
