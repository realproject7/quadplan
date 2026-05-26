"use client";

import { useEffect, useState, useCallback } from "react";
import InfoTooltip from "./InfoTooltip";
import { useLocale } from "@/components/LocaleProvider";

interface ArtifactRow {
  id: string;
  title: string;
  type: string | null;
  status: string;
  statusLabel: string;
  progress: number;
  review: { re1: string; re2: string };
  source: string | null;
  output: string | null;
  issueUrl: string | null;
}

interface PlanningProgressData {
  batchNumber: number | null;
  batchTitle: string | null;
  artifacts: ArtifactRow[];
  summary: {
    total: number;
    done: number;
    approved: number;
    inReview: number;
    drafting: number;
    queued: number;
    progress: number;
  };
}

interface PlanningProgressPanelProps {
  projectId: string;
}

const COPY = {
  en: {
    loading: "Loading planning progress...",
    currentBatchNone: "Current Batch: (none)",
    noActiveBatch: "No active batch. Ask HEAD to start one via the chat.",
    currentBatch: (n: number | string) => `Current Batch: Batch ${n}`,
    complete: "COMPLETE",
    allDone: (n: number) => `All ${n} artifacts done. Waiting for the next batch.`,
    itemsCount: (n: number) => `(${n} items)`,
    tooltip: (
      <>
        <b>Current Batch</b> — planning artifact progress. Tracks each artifact from queued through review to done.
      </>
    ),
  },
  ko: {
    loading: "기획 진행 상황 로딩 중...",
    currentBatchNone: "현재 배치: (없음)",
    noActiveBatch: "활성 배치가 없습니다. 채팅에서 HEAD에게 시작을 요청하세요.",
    currentBatch: (n: number | string) => `현재 배치: ${n}번`,
    complete: "완료",
    allDone: (n: number) => `${n}개 산출물 모두 완료. 다음 배치를 기다리는 중.`,
    itemsCount: (n: number) => `(${n}개 항목)`,
    tooltip: (
      <>
        <b>현재 배치</b> — 기획 산출물 진행 상황. 대기부터 리뷰를 거쳐 완료까지 각 산출물을 추적합니다.
      </>
    ),
  },
} as const;

const BAR_SEGMENTS = 20;

function ProgressBar({ percent }: { percent: number }) {
  const filled = Math.round((percent / 100) * BAR_SEGMENTS);
  const empty = BAR_SEGMENTS - filled;
  return (
    <span className="font-mono text-[11px] tabular-nums whitespace-nowrap">
      <span className="text-accent">{"█".repeat(filled)}</span>
      <span className="text-text-muted">{"░".repeat(empty)}</span>
    </span>
  );
}

function artifactLink(artifact: ArtifactRow): string | null {
  if (artifact.issueUrl) return artifact.issueUrl;
  if (!artifact.output) return null;
  if (artifact.output.startsWith("http://") || artifact.output.startsWith("https://")) return artifact.output;
  if (artifact.output.startsWith("/") || artifact.output.startsWith("artifacts/")) return artifact.output;
  return null;
}

export default function PlanningProgressPanel({ projectId }: PlanningProgressPanelProps) {
  const { locale } = useLocale();
  const t = COPY[locale];
  const [data, setData] = useState<PlanningProgressData | null>(null);

  const load = useCallback(() => {
    fetch(`/api/planning-progress?project=${encodeURIComponent(projectId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d) setData(d); })
      .catch(() => {});
  }, [projectId]);

  useEffect(() => {
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, [load]);

  if (!data) {
    return (
      <div className="px-3 py-1.5 text-[11px] text-text-muted border-t border-border">
        {t.loading}
      </div>
    );
  }

  if (!data.artifacts || data.artifacts.length === 0) {
    return (
      <div className="border-t border-border">
        <div className="px-3 py-1.5 flex items-center gap-2">
          <span className="text-[10px] text-text-muted uppercase tracking-wider">
            {t.currentBatchNone}
          </span>
        </div>
        <div className="px-3 pb-2 text-[11px] text-text-muted">
          {t.noActiveBatch}
        </div>
      </div>
    );
  }

  const allDone = data.summary.progress === 100;

  if (allDone) {
    return (
      <div className="border-t border-border">
        <div className="px-3 py-1.5 flex items-center gap-2">
          <span className="text-[10px] text-text-muted uppercase tracking-wider">
            {t.currentBatch(data.batchNumber ?? "—")}
          </span>
          <span className="text-[10px] text-success">{t.complete}</span>
        </div>
        <div className="px-3 pb-2 text-[11px] text-text-muted">
          {t.allDone(data.artifacts.length)}
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-border">
      <div className="px-3 py-1.5 flex items-center gap-2 border-b border-border/40">
        <span className="text-[10px] text-text-muted uppercase tracking-wider">
          {t.currentBatch(data.batchNumber ?? "—")}
        </span>
        <span className="text-[10px] text-text-muted">{t.itemsCount(data.artifacts.length)}</span>
        <InfoTooltip>
          {t.tooltip}
        </InfoTooltip>
      </div>
      <div className="max-h-40 overflow-y-auto">
        {data.artifacts.map((artifact) => {
          const link = artifactLink(artifact);
          const row = (
            <div className="px-3 py-1 font-mono">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-text-muted w-12 shrink-0 tabular-nums truncate">
                  {artifact.id}
                </span>
                <ProgressBar percent={artifact.progress} />
                <span className="text-[11px] text-text-muted tabular-nums shrink-0 w-9 text-right">
                  {artifact.progress}%
                </span>
                <span className="text-[11px] text-text-muted shrink-0">
                  {artifact.statusLabel}
                </span>
              </div>
              <div className="flex items-center gap-2 pl-14">
                {artifact.type && (
                  <span className="text-[10px] text-accent-dim uppercase tracking-wider">{artifact.type}</span>
                )}
                <span className="text-[10px] text-text truncate min-w-0">{artifact.title}</span>
              </div>
            </div>
          );
          if (!link) {
            return <div key={artifact.id} className="border-b border-border/30">{row}</div>;
          }
          return (
            <a
              key={artifact.id}
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="block hover:bg-[#1a1a1a] transition-colors border-b border-border/30"
            >
              {row}
            </a>
          );
        })}
      </div>
      <div className="px-3 py-1.5 text-[11px] text-text-muted border-t border-border/40">
        {data.summary.done}/{data.summary.total} done · {data.summary.progress}% overall
      </div>
    </div>
  );
}
