import { Box, Button, Stack, Typography, createTheme } from '@mui/material';
import type { ComponentType, ReactNode } from 'react';
import { tool } from '../_tool-ui/tokens';
import {
    IconCheck,
    IconClose,
    IconDownload,
    IconFolder,
    IconMusic,
    IconWave,
} from '../_tool-ui/icons';

export const toolTheme = createTheme({
    palette: {
        mode: 'dark',
        primary: { main: tool.accent, contrastText: tool.accentInk },
        secondary: { main: tool.amber, contrastText: '#1d1304' },
        success: { main: tool.green },
        error: { main: tool.red },
        info: { main: tool.accent },
        warning: { main: tool.amber },
        background: { default: tool.ground, paper: tool.panel },
        divider: tool.seam,
        text: {
            primary: tool.text,
            secondary: tool.textMuted,
            disabled: tool.textFaint,
        },
    },
    shape: { borderRadius: 8 },
    typography: {
        fontFamily: tool.sans,
        h1: { fontWeight: 700, letterSpacing: '-0.02em' },
        h2: { fontWeight: 600 },
        button: { fontWeight: 600, textTransform: 'none', letterSpacing: 0 },
    },
    components: {
        MuiCssBaseline: {
            styleOverrides: {
                body: { backgroundColor: tool.ground },
                '::selection': { background: 'rgba(108,182,255,.32)' },
            },
        },
        MuiButton: {
            defaultProps: { disableElevation: true },
            styleOverrides: {
                root: { minHeight: 40, borderRadius: 8 },
                sizeLarge: { minHeight: 48 },
                outlined: {
                    borderColor: tool.seamStrong,
                    '&:hover': { borderColor: tool.accent },
                },
            },
        },
        MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
        MuiOutlinedInput: {
            styleOverrides: {
                root: {
                    backgroundColor: tool.raised,
                    '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: tool.seamStrong,
                    },
                },
            },
        },
        MuiMenu: {
            styleOverrides: {
                paper: { border: `1px solid ${tool.seam}`, backgroundColor: tool.raised },
            },
        },
        MuiAutocomplete: {
            styleOverrides: {
                paper: { border: `1px solid ${tool.seam}`, backgroundColor: tool.raised },
            },
        },
        MuiChip: {
            styleOverrides: {
                root: { borderRadius: 6, fontWeight: 600 },
            },
        },
        MuiSlider: {
            styleOverrides: {
                thumb: { width: 16, height: 16, boxShadow: 'none' },
                rail: { backgroundColor: tool.seamStrong, opacity: 1 },
            },
        },
        MuiLinearProgress: {
            styleOverrides: {
                root: { height: 4, borderRadius: 2, backgroundColor: tool.seam },
            },
        },
        MuiTooltip: {
            styleOverrides: {
                tooltip: {
                    backgroundColor: tool.raised,
                    border: `1px solid ${tool.seamStrong}`,
                    fontSize: 12,
                    lineHeight: 1.6,
                },
            },
        },
    },
});

export const monoSx = {
    fontFamily: tool.mono,
    fontVariantNumeric: 'tabular-nums',
} as const;

/** A console panel: header row (label left, meta right) over seamed content. */
export function Panel({
    title,
    meta,
    id,
    children,
}: {
    title: string;
    meta?: ReactNode;
    id?: string;
    children: ReactNode;
}) {
    return (
        <Box
            component="section"
            aria-labelledby={id}
            sx={{
                border: `1px solid ${tool.seam}`,
                borderRadius: 2,
                bgcolor: tool.panel,
                overflow: 'hidden',
            }}
        >
            <Stack
                direction="row"
                sx={{
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 2,
                    px: 2,
                    py: 1.25,
                    borderBottom: `1px solid ${tool.seam}`,
                }}
            >
                <Typography
                    id={id}
                    component="h2"
                    sx={{ fontSize: 14, fontWeight: 600 }}
                >
                    {title}
                </Typography>
                {meta && (
                    <Typography
                        component="span"
                        sx={{ ...monoSx, fontSize: 12, color: tool.textFaint }}
                    >
                        {meta}
                    </Typography>
                )}
            </Stack>
            {children}
        </Box>
    );
}

export interface OutputFile {
    url: string;
    filename: string;
    title: string;
    duration: number;
}

type IconComponent = ComponentType<{ size?: number }>;

interface FilePickerProps {
    id: string;
    label: string;
    hint: string;
    file: File | null;
    accept: string;
    icon?: IconComponent;
    optional?: boolean;
    disabled?: boolean;
    onChange: (file: File | null) => void;
}

/** One seamed row per input file. */
export function FilePicker({
    id,
    label,
    hint,
    file,
    accept,
    icon: Icon = IconWave,
    optional,
    disabled,
    onChange,
}: FilePickerProps) {
    return (
        <Stack
            direction="row"
            sx={{
                alignItems: 'center',
                gap: 1.5,
                px: 2,
                py: 1.5,
                minHeight: 64,
                '& + &': { borderTop: `1px solid ${tool.seam}` },
            }}
        >
            <Box
                sx={{
                    display: 'grid',
                    placeItems: 'center',
                    flex: '0 0 auto',
                    width: 32,
                    height: 32,
                    borderRadius: 1.5,
                    border: `1px solid ${file ? 'rgba(95,211,141,.45)' : tool.seam}`,
                    color: file ? tool.green : tool.textMuted,
                    transition: 'color .3s, border-color .3s',
                }}
            >
                {file ? <IconCheck size={17} /> : <Icon size={17} />}
            </Box>
            <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography sx={{ fontSize: 14, fontWeight: 600, lineHeight: 1.4 }}>
                    {label}
                </Typography>
                <Typography
                    noWrap
                    title={file?.name}
                    sx={{
                        ...(file ? monoSx : {}),
                        fontSize: 12,
                        mt: 0.25,
                        color: file ? tool.text : tool.textMuted,
                    }}
                >
                    {file?.name ?? (optional ? `選填 · ${hint}` : hint)}
                </Typography>
            </Box>
            {optional && file && (
                <Button
                    size="small"
                    color="inherit"
                    disabled={disabled}
                    onClick={() => onChange(null)}
                    aria-label={`移除${label}`}
                    sx={{ minWidth: 40, px: 1, color: tool.textMuted }}
                >
                    <IconClose size={16} />
                </Button>
            )}
            <Button
                component="label"
                htmlFor={id}
                disabled={disabled}
                variant="outlined"
                color={file ? 'inherit' : 'primary'}
                startIcon={file ? undefined : <IconFolder size={16} />}
                sx={{ flex: '0 0 auto', px: 1.5, color: file ? tool.textMuted : undefined }}
            >
                {file ? '更換' : '選擇檔案'}
                <input
                    id={id}
                    hidden
                    type="file"
                    disabled={disabled}
                    accept={accept}
                    onChange={(event) => {
                        onChange(event.target.files?.[0] ?? null);
                        event.target.value = '';
                    }}
                />
            </Button>
        </Stack>
    );
}

export function ResultPlayer({ output }: { output: OutputFile }) {
    const minutes = Math.floor(output.duration / 60);
    const seconds = Math.floor(output.duration % 60)
        .toString()
        .padStart(2, '0');

    return (
        <Box
            sx={{
                px: 2,
                py: 1.75,
                '& + &': { borderTop: `1px solid ${tool.seam}` },
            }}
        >
            <Stack
                direction="row"
                sx={{ alignItems: 'center', gap: 1.5, mb: 1.25 }}
            >
                <Box sx={{ color: tool.accent, display: 'grid' }}>
                    <IconMusic size={18} />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
                        {output.title}
                    </Typography>
                    <Typography
                        noWrap
                        title={output.filename}
                        sx={{ ...monoSx, fontSize: 12, color: tool.textMuted }}
                    >
                        MP3 · {minutes}:{seconds} · {output.filename}
                    </Typography>
                </Box>
                <Button
                    component="a"
                    href={output.url}
                    download={output.filename}
                    variant="contained"
                    startIcon={<IconDownload size={16} />}
                    sx={{ flex: '0 0 auto' }}
                >
                    下載
                </Button>
            </Stack>
            <Box
                component="audio"
                src={output.url}
                controls
                preload="metadata"
                sx={{ width: '100%', height: 40, colorScheme: 'dark', display: 'block' }}
            />
        </Box>
    );
}
