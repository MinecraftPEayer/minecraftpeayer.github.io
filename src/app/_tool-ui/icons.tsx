import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Icon({ size = 18, children, ...props }: IconProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false"
            {...props}
        >
            {children}
        </svg>
    );
}

export const IconCheck = (p: IconProps) => (
    <Icon {...p}><circle cx="12" cy="12" r="9" /><path d="m8.5 12.2 2.4 2.4 4.6-4.8" /></Icon>
);
export const IconRing = (p: IconProps) => (
    <Icon {...p}><circle cx="12" cy="12" r="9" /></Icon>
);
export const IconActive = (p: IconProps) => (
    <Icon {...p}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3.5" fill="currentColor" stroke="none" /></Icon>
);
export const IconSpinner = (p: IconProps) => (
    <Icon {...p}><path d="M12 3a9 9 0 1 1-9 9" /></Icon>
);
export const IconAlert = (p: IconProps) => (
    <Icon {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7.5v5.5" /><path d="M12 16.4v.1" /></Icon>
);
export const IconDownload = (p: IconProps) => (
    <Icon {...p}><path d="M12 4v11" /><path d="m7 10.5 5 5 5-5" /><path d="M5 20h14" /></Icon>
);
export const IconUpload = (p: IconProps) => (
    <Icon {...p}><path d="M12 15V4" /><path d="m7 8.5 5-5 5 5" /><path d="M5 20h14" /></Icon>
);
export const IconFolder = (p: IconProps) => (
    <Icon {...p}><path d="M3.5 7.5a2 2 0 0 1 2-2h4l2 2h7a2 2 0 0 1 2 2v7.5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z" /></Icon>
);
export const IconFile = (p: IconProps) => (
    <Icon {...p}><path d="M14 3.5H7.5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V8z" /><path d="M14 3.5V8h4.5" /><path d="M9 13h6M9 16.5h4" /></Icon>
);
export const IconMusic = (p: IconProps) => (
    <Icon {...p}><path d="M9 18V5.5l11-2V16" /><circle cx="6.5" cy="18" r="2.5" /><circle cx="17.5" cy="16" r="2.5" /></Icon>
);
export const IconWave = (p: IconProps) => (
    <Icon {...p}><path d="M3 12h2M7 8v8M11 5v14M15 9v6M19 7v10M21 12h0" /></Icon>
);
export const IconBolt = (p: IconProps) => (
    <Icon {...p}><path d="M13 3 5 13.5h6L10 21l8-10.5h-6z" /></Icon>
);
export const IconSearch = (p: IconProps) => (
    <Icon {...p}><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4.5 4.5" /></Icon>
);
export const IconClose = (p: IconProps) => (
    <Icon {...p}><path d="M6 6l12 12M18 6 6 18" /></Icon>
);
export const IconChevron = (p: IconProps) => (
    <Icon {...p}><path d="m9 6 6 6-6 6" /></Icon>
);
