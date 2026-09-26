export type BreakJudgment =
    | 'miss'
    | 'good'
    | 'great'
    | 'perfect'
    | 'critical';

export interface BreakJudgmentEvent {
    time: number;
    judgment: BreakJudgment;
}

export interface BreakPlayback extends BreakJudgmentEvent {
    duration: number;
}

const judgmentPriority: Record<BreakJudgment, number> = {
    miss: 0,
    good: 1,
    great: 2,
    perfect: 3,
    critical: 4,
};

/** One Break at each chart timestamp, using the highest simultaneous judgment. */
export function mergeBreakJudgments(events: BreakJudgmentEvent[]) {
    const sorted = [...events].sort((a, b) => a.time - b.time);
    const merged: BreakJudgmentEvent[] = [];

    for (const event of sorted) {
        const previous = merged.at(-1);
        if (previous?.time === event.time) {
            if (
                judgmentPriority[event.judgment] >
                judgmentPriority[previous.judgment]
            ) {
                previous.judgment = event.judgment;
            }
        } else {
            merged.push({ ...event });
        }
    }

    return merged;
}

function replaceOnNextTrigger(
    events: BreakJudgmentEvent[],
    sampleDuration: number,
): BreakPlayback[] {
    if (sampleDuration <= 0) return [];

    return events.map((event, index) => ({
        ...event,
        duration: Math.min(
            sampleDuration,
            (events[index + 1]?.time ?? Infinity) - event.time,
        ),
    }));
}

/** Consecutive Break sounds replace the previous instance on their channel. */
export function buildBreakPlaybacks(
    events: BreakJudgmentEvent[],
    breakDuration: number,
) {
    return replaceOnNextTrigger(
        mergeBreakJudgments(events),
        breakDuration,
    );
}
