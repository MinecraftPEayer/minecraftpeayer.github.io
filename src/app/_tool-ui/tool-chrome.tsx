import type { ReactNode } from 'react';
import {
    IconActive,
    IconAlert,
    IconCheck,
    IconRing,
    IconSpinner,
} from './icons';
import styles from './tool-ui.module.css';

export const surfaceClass = styles.surface;

export function ToolIntro({ title, children }: { title: ReactNode; children: ReactNode }) {
    return (
        <div className={styles.intro}>
            <h1 className={styles.title}>{title}</h1>
            <p className={styles.lede}>{children}</p>
        </div>
    );
}

export type StageState = 'pending' | 'active' | 'busy' | 'done' | 'error';

export interface Stage {
    label: string;
    value?: string;
    state: StageState;
}

const stateText: Record<StageState, string> = {
    pending: '尚未開始',
    active: '進行中',
    busy: '處理中',
    done: '完成',
    error: '需要處理',
};

export function Pipeline({ stages, label }: { stages: Stage[]; label: string }) {
    return (
        <ol
            className={styles.pipeline}
            aria-label={label}
            style={{ ['--count' as string]: stages.length }}
        >
            {stages.map((stage) => {
                const Icon =
                    stage.state === 'done'
                        ? IconCheck
                        : stage.state === 'error'
                          ? IconAlert
                          : stage.state === 'busy'
                            ? IconSpinner
                            : stage.state === 'active'
                              ? IconActive
                              : IconRing;
                const tone =
                    stage.state === 'done'
                        ? styles.done
                        : stage.state === 'error'
                          ? styles.error
                          : stage.state === 'pending'
                            ? ''
                            : styles.active;
                return (
                    <li
                        key={stage.label}
                        className={`${styles.stage} ${tone}`}
                        aria-current={stage.state === 'active' || stage.state === 'busy' ? 'step' : undefined}
                    >
                        <div className={styles.stageHead}>
                            <Icon size={15} className={stage.state === 'busy' ? styles.spin : undefined} />
                            <span className={styles.stageLabel}>{stage.label}</span>
                        </div>
                        <span className={styles.stageValue}>
                            {stage.value ? (
                                <>
                                    <span className="sr-only">{stateText[stage.state]}：</span>
                                    {stage.value}
                                </>
                            ) : (
                                stateText[stage.state]
                            )}
                        </span>
                    </li>
                );
            })}
        </ol>
    );
}
