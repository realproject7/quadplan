"use client";

import { useCallback, useEffect, useState } from "react";
import InfoTooltip from "./InfoTooltip";
import { useLocale } from "@/components/LocaleProvider";

interface PlanningLoopWidgetProps {
  projectId: string;
}

interface LoopStatus {
  enabled: boolean;
  state: "running" | "paused" | "error";
  intervalMin: number | null;
  lastPulse: number | null;
  nextPulse: number | null;
}

const INTERVALS = [5, 10, 15, 30];

const COPY = {
  en: {
    label: (running: boolean) => `Planning Loop${running ? " (running)" : ""}`,
    tooltip: (
      <>
        <b>Planning Loop</b> sends a periodic queue-check pulse to HEAD so planning work continues automatically. Default interval is 10 minutes.
      </>
    ),
    interval: "Interval",
    min: "min",
    start: "Start",
    stop: "Stop",
    pulseNow: "Pulse Now",
    lastPulse: "Last pulse",
    nextPulse: "Next pulse",
    never: "never",
    pulseSent: "Pulse sent",
    state: "State",
  },
  ko: {
    label: (running: boolean) => `기획 루프${running ? " (실행 중)" : ""}`,
    tooltip: (
      <>
        <b>기획 루프</b>는 HEAD에게 주기적으로 큐 확인 메시지를 보내 기획 작업이 자동으로 진행되게 합니다. 기본 간격은 10분입니다.
      </>
    ),
    interval: "간격",
    min: "분",
    start: "시작",
    stop: "정지",
    pulseNow: "지금 펄스",
    lastPulse: "마지막 펄스",
    nextPulse: "다음 펄스",
    never: "없음",
    pulseSent: "펄스 전송됨",
    state: "상태",
  },
} as const;

function formatTime(ts: number | null): string {
  if (!ts) return "—";
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function formatCountdown(ms: number | null): string {
  if (ms === null || ms <= 0) return "—";
  const totalSec = Math.ceil(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}m ${s}s`;
}

export default function PlanningLoopWidget({ projectId }: PlanningLoopWidgetProps) {
  const { locale } = useLocale();
  const t = COPY[locale];
  const [status, setStatus] = useState<LoopStatus>({ enabled: false, state: "paused", intervalMin: 10, lastPulse: null, nextPulse: null });
  const [intervalMin, setIntervalMin] = useState(10);
  const [pulsing, setPulsing] = useState(false);
  const [pulseFlash, setPulseFlash] = useState(false);

  const loadStatus = useCallback(() => {
    fetch(`/api/planning-loop/status?project=${encodeURIComponent(projectId)}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (d) {
          setStatus(d);
          if (d.intervalMin) setIntervalMin(d.intervalMin);
        }
      })
      .catch(() => {});
  }, [projectId]);

  useEffect(() => {
    loadStatus();
    const id = setInterval(loadStatus, 5000);
    return () => clearInterval(id);
  }, [loadStatus]);

  const handleStart = async () => {
    await fetch(`/api/planning-loop/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project: projectId, intervalMin }),
    });
    loadStatus();
  };

  const handleStop = async () => {
    await fetch(`/api/planning-loop/stop`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project: projectId }),
    });
    loadStatus();
  };

  const handlePulseNow = async () => {
    setPulsing(true);
    await fetch(`/api/planning-loop/pulse`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project: projectId }),
    });
    setPulsing(false);
    setPulseFlash(true);
    setTimeout(() => setPulseFlash(false), 2000);
    loadStatus();
  };

  const countdown = status.nextPulse ? status.nextPulse - Date.now() : null;

  return (
    <div className="border-t border-border">
      <div className="flex items-center justify-between h-7 px-3 border-b border-border/40">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-text-muted uppercase tracking-wider">
            {t.label(status.enabled)}
          </span>
          <InfoTooltip>{t.tooltip}</InfoTooltip>
        </div>
      </div>

      <div className="px-3 py-2 space-y-2">
        {/* Interval selector + start/stop */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-text-muted">{t.interval}:</span>
          <select
            value={intervalMin}
            onChange={(e) => setIntervalMin(Number(e.target.value))}
            disabled={status.enabled}
            className="bg-transparent border border-border text-[11px] text-text px-1 py-0.5 outline-none focus:border-accent disabled:opacity-50"
          >
            {INTERVALS.map((v) => (
              <option key={v} value={v}>{v} {t.min}</option>
            ))}
          </select>

          {status.enabled ? (
            <button
              type="button"
              onClick={handleStop}
              className="px-2 py-0.5 text-[10px] text-error border border-error/40 hover:bg-error/10 transition-colors"
            >
              {t.stop}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStart}
              className="px-2 py-0.5 text-[10px] text-accent border border-accent/40 hover:bg-accent/10 transition-colors"
            >
              {t.start}
            </button>
          )}

          <button
            type="button"
            onClick={handlePulseNow}
            disabled={pulsing}
            className="px-2 py-0.5 text-[10px] text-text-muted border border-border hover:text-accent hover:border-accent transition-colors disabled:opacity-50"
          >
            {pulsing ? "..." : t.pulseNow}
          </button>

          {pulseFlash && (
            <span className="text-[10px] text-success">{t.pulseSent}</span>
          )}
        </div>

        {/* Status row */}
        <div className="flex items-center gap-4 text-[10px] text-text-muted">
          <span>
            {t.lastPulse}: {status.lastPulse ? formatTime(status.lastPulse) : t.never}
          </span>
          {status.enabled && (
            <span>
              {t.nextPulse}: {formatCountdown(countdown)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
