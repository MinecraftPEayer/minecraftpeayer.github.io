import type { ChartType, RatingEntry } from './chart-data';

const WIDTH = 1920;
const HEIGHT = 1080;
const CARD_WIDTH = 168;
const CARD_HEIGHT = 152;
const CARD_GAP_X = 16;
const CARD_GAP_Y = 12;
const CARD_START_X = 48;
const CARD_START_Y = 208;
const FONT = '"MaiChart", "Noto Sans CJK JP", sans-serif';
const ASSET_ROOT = '/astrodx-rating-chart';
const RANKS = ['SSS+', 'SSS', 'SS+', 'SS', 'S+', 'S', 'AAA', 'AA', 'A', 'BBB', 'BB', 'B', 'C', 'D'] as const;
const difficultyColors: Record<string, [string, string]> = {
    basic: ['#45c124', '#daf3d0'],
    advanced: ['#ffba01', '#f3ecae'],
    expert: ['#ff7b7b', '#f8e7e7'],
    master: ['#9f51dc', '#efe7fa'],
    remaster: ['#dbaaff', '#501e89'],
};
const iconForClearType: Record<number, string> = { 3: 'FC', 4: 'FCp', 5: 'AP', 6: 'APp' };
const imageCache = new Map<string, Promise<HTMLImageElement | null>>();

function rankFile(rank: string): string {
    return rank.toLowerCase().replaceAll('+', 'plus') + '.png';
}

function loadImage(src: string, remote = false): Promise<HTMLImageElement | null> {
    const cached = imageCache.get(src);
    if (cached) return cached;
    const pending = new Promise<HTMLImageElement | null>((resolve) => {
        const image = new Image();
        const timeout = window.setTimeout(() => resolve(null), 15000);
        if (remote) image.crossOrigin = 'anonymous';
        image.onload = () => { window.clearTimeout(timeout); resolve(image); };
        image.onerror = () => { window.clearTimeout(timeout); resolve(null); };
        image.src = src;
    });
    imageCache.set(src, pending);
    return pending;
}

function coverImage(name: string): Promise<HTMLImageElement | null> {
    if (!name || !/^[\w.-]+$/.test(name)) return Promise.resolve(null);
    return loadImage('https://dp4p6x0xfi5o9.cloudfront.net/maimai/img/cover-m/' + encodeURIComponent(name), true);
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, radius);
}

function fitText(ctx: CanvasRenderingContext2D, text: string, width: number): string {
    if (ctx.measureText(text).width <= width) return text;
    let short = text;
    while (short && ctx.measureText(short + '…').width > width) short = short.slice(0, -1);
    return short + '…';
}

// Port of maibot's ChartTypeCanvas, drawn directly with the browser 2D context.
function drawChartType(ctx: CanvasRenderingContext2D, x: number, y: number, type: ChartType) {
    ctx.save();
    const dx = type === 'dx';
    const width = dx ? 71 : 85;
    ctx.fillStyle = dx ? '#fff' : '#73adf8';
    ctx.beginPath();
    ctx.moveTo(x + 10, y);
    ctx.lineTo(x, y + 20);
    ctx.lineTo(x + width - 10, y + 20);
    ctx.lineTo(x + width, y);
    ctx.closePath();
    ctx.fill();
    ctx.font = '10px ' + FONT;
    ctx.textAlign = 'left';
    if (dx) {
        const colors = ['#FF1C00', '#FFAB00', '#FFEB00', '#A4FF00', '#0081FF'];
        const text = 'でらっくす';
        for (let i = 0; i < text.length; i++) {
            ctx.fillStyle = colors[i];
            ctx.strokeStyle = colors[i];
            ctx.lineWidth = .5;
            ctx.strokeText(text[i], x + 11 + i * 10, y + 13);
            ctx.fillText(text[i], x + 11 + i * 10, y + 13);
        }
    } else {
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = .5;
        ctx.strokeText('スタンダード', x + 13, y + 13);
        ctx.fillText('スタンダード', x + 13, y + 13);
    }
    ctx.restore();
}

function drawBoldText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number) {
    const previousStroke = ctx.strokeStyle;
    const previousWidth = ctx.lineWidth;
    ctx.strokeStyle = ctx.fillStyle;
    ctx.lineWidth = .5;
    ctx.strokeText(text, x, y);
    ctx.fillText(text, x, y);
    ctx.strokeStyle = previousStroke;
    ctx.lineWidth = previousWidth;
}

function drawCard(
    ctx: CanvasRenderingContext2D,
    entry: RatingEntry,
    images: Map<string, HTMLImageElement | null>,
    index: number,
) {
    const x = CARD_START_X + index % 10 * (CARD_WIDTH + CARD_GAP_X);
    const y = CARD_START_Y + Math.floor(index / 10) * (CARD_HEIGHT + CARD_GAP_Y);
    const [difficultyColor, difficultyText] = difficultyColors[entry.difficulty];
    const cover = images.get(entry.imageName) ?? null;
    ctx.save();
    roundedRect(ctx, x, y, CARD_WIDTH, CARD_HEIGHT, 8);
    ctx.clip();
    ctx.fillStyle = '#20232b';
    ctx.fillRect(x, y, CARD_WIDTH, CARD_HEIGHT);

    if (cover) {
        const scale = Math.max(CARD_WIDTH / cover.width, CARD_HEIGHT / cover.height);
        const scaledWidth = cover.width * scale;
        const scaledHeight = cover.height * scale;
        ctx.save();
        ctx.filter = 'blur(4px)';
        ctx.drawImage(cover, x + (CARD_WIDTH - scaledWidth) / 2 - 6, y + (CARD_HEIGHT - scaledHeight) / 2 - 6,
            scaledWidth + 12, scaledHeight + 12);
        ctx.restore();
    }
    ctx.fillStyle = 'rgba(0,0,0,.5)';
    ctx.fillRect(x, y, CARD_WIDTH, CARD_HEIGHT);

    ctx.fillStyle = '#d9d9d9';
    ctx.fillRect(x, y, CARD_WIDTH, 28);
    if (entry.rating >= 300) {
        const rainbow = ctx.createLinearGradient(x + 18, y, x + CARD_WIDTH, y + 24);
        ['#FF0000', '#F6FF00', '#7BFF0F', '#00EEFF', '#8B3EF7'].forEach((color, i) => rainbow.addColorStop(i / 4, color));
        ctx.fillStyle = rainbow;
        ctx.fillRect(x + 18, y, CARD_WIDTH - 18, 24);
    }
    ctx.fillStyle = 'rgba(255,255,255,.6)';
    ctx.fillRect(x + 18, y, CARD_WIDTH - 18, 24);
    ctx.fillStyle = '#111';
    ctx.font = 'bold 10px ' + FONT;
    ctx.fillText(String(index + 1).padStart(2, '0'), x + 3, y + 20);
    ctx.font = '14px ' + FONT;
    ctx.fillText(fitText(ctx, entry.title, CARD_WIDTH - 27), x + 22, y + 19);

    ctx.fillStyle = difficultyColor;
    ctx.beginPath();
    ctx.moveTo(x, y + 28);
    ctx.lineTo(x + 56, y + 28);
    ctx.lineTo(x + 42, y + 56);
    ctx.lineTo(x, y + 56);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = difficultyText;
    const constantParts = String(entry.constant).split('.');
    ctx.font = '20px ' + FONT;
    ctx.textAlign = 'right';
    drawBoldText(ctx, constantParts[0], x + 29, y + 50);
    ctx.textAlign = 'left';
    ctx.font = '12px ' + FONT;
    drawBoldText(ctx, '.' + (constantParts[1] ?? '0'), x + 30, y + 49.5);
    if (Number.parseInt(constantParts[1] ?? '', 10) > 5) {
        ctx.fillText('+', x + 30, y + 38);
    }
    drawChartType(ctx, x + 46, y + 28, entry.type);

    const rankImage = images.get('ranking/' + rankFile(entry.rank));
    if (rankImage) ctx.drawImage(rankImage, x + 6, y + 114, 45, 20);
    else {
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 18px ' + FONT;
        ctx.fillText(entry.rank, x + 6, y + 131);
    }
    const iconName = iconForClearType[entry.clearType];
    const icon = iconName ? images.get('icons/' + iconName + '.png') : null;
    if (icon) ctx.drawImage(icon, x + 52, y + 116, 18, 18);

    ctx.shadowColor = '#000';
    ctx.shadowBlur = 5;
    ctx.fillStyle = '#fff';
    ctx.font = '12px ' + FONT;
    ctx.fillText(entry.achievement.toFixed(4) + '%', x + 6, y + 143);
    ctx.font = 'bold 28px ' + FONT;
    ctx.textAlign = 'right';
    ctx.fillText(String(entry.rating), x + CARD_WIDTH - 7, y + 142);
    ctx.restore();
}

function drawRankSummary(
    ctx: CanvasRenderingContext2D,
    top: RatingEntry[],
    images: Map<string, HTMLImageElement | null>,
) {
    const counts = new Map<string, number>();
    top.forEach((entry) => counts.set(entry.rank, (counts.get(entry.rank) ?? 0) + 1));
    RANKS.forEach((rank, index) => {
        const x = 1110 + index * 54;
        const y = 142;
        ctx.fillStyle = 'rgba(255,255,255,.75)';
        roundedRect(ctx, x, y, 50, 24, 3);
        ctx.fill();
        ctx.fillStyle = 'rgba(183,183,183,.45)';
        roundedRect(ctx, x, y + 24, 50, 24, 3);
        ctx.fill();
        const badge = images.get('rank_center/' + rankFile(rank));
        if (badge) ctx.drawImage(badge, x + 4, y + 3, 42, 18);
        else {
            ctx.fillStyle = '#111';
            ctx.font = 'bold 10px ' + FONT;
            ctx.textAlign = 'center';
            ctx.fillText(rank, x + 25, y + 18);
        }
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 15px ' + FONT;
        ctx.textAlign = 'center';
        ctx.fillText(String(counts.get(rank) ?? 0), x + 25, y + 42);
    });
    ctx.textAlign = 'left';
}

export async function drawRatingChart(canvas: HTMLCanvasElement, entries: RatingEntry[]): Promise<void> {
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('無法建立繪圖畫布。');
    await document.fonts.load('16px ' + FONT);
    const top = entries.slice(0, 50);
    const covers = [...new Set(top.map((entry) => entry.imageName))];
    const localAssets = [
        ...RANKS.flatMap((rank) => ['ranking/' + rankFile(rank), 'rank_center/' + rankFile(rank)]),
        ...Object.values(iconForClearType).map((name) => 'icons/' + name + '.png'),
    ];
    const loaded = await Promise.all([
        ...covers.map(async (name) => [name, await coverImage(name)] as const),
        ...localAssets.map(async (path) => [path, await loadImage(ASSET_ROOT + '/' + path)] as const),
    ]);
    const images = new Map<string, HTMLImageElement | null>(loaded);

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 48px ' + FONT;
    ctx.fillText('RATING CHART', 48, 72);
    ctx.fillStyle = '#73adf8';
    ctx.font = 'bold 18px ' + FONT;
    ctx.fillText('ASTRODX  /  TOP 50', 50, 105);
    ctx.fillStyle = '#555';
    ctx.fillRect(48, 124, WIDTH - 96, 1);

    const total = top.reduce((sum, entry) => sum + entry.rating, 0);
    const summary = [
        ['TOTAL', String(total)],
        ['CHARTS', String(top.length) + ' / 50'],
        ['AVERAGE', top.length ? String(Math.floor(total / top.length)) : '—'],
        ['RANGE', top.length ? String(top[0].rating) + ' / ' + String(top[top.length - 1].rating) : '—'],
    ];
    summary.forEach(([label, value], i) => {
        const x = 50 + i * 265;
        ctx.fillStyle = '#8c929c';
        ctx.font = 'bold 14px ' + FONT;
        ctx.fillText(label, x, 157);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 25px ' + FONT;
        ctx.fillText(value, x, 188);
    });
    drawRankSummary(ctx, top, images);

    top.forEach((entry, i) => drawCard(ctx, entry, images, i));
    if (top.length === 0) {
        ctx.fillStyle = '#a9a9b3';
        ctx.font = '24px ' + FONT;
        ctx.fillText('沒有可繪製的成績', 52, 264);
    }
}
