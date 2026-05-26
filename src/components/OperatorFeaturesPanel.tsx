"use client";

import PanelHeader from "./PanelHeader";
import InfoTooltip from "./InfoTooltip";
import PlanningLoopWidget from "./PlanningLoopWidget";
import LoopGuardWidget from "./LoopGuardWidget";
import ProjectHistoryWidget from "./ProjectHistoryWidget";
import AgentModelsWidget from "./AgentModelsWidget";
import { useLocale } from "@/components/LocaleProvider";

const COPY = {
  en: {
    label: "Operator Features",
    tooltip: (
      <>
        <b>Operator Features</b> — tools for running autonomous planning batches. Includes the Planning Loop, Loop Guard, Project History, and Agent Models.
      </>
    ),
  },
  ko: {
    label: "운영자 기능",
    tooltip: (
      <>
        <b>운영자 기능</b> - 자율 기획 배치를 운영할 때 쓰는 도구 모음입니다. Planning Loop, Loop Guard, Project History, Agent Models가 포함됩니다.
      </>
    ),
  },
} as const;

/**
 * Bottom-right quadrant of the project dashboard (#208).
 *
 * Hosts the operator-only widgets:
 *   - #210 Scheduled Trigger
 *   - #211 Telegram Bridge
 *
 * #226: OVERNIGHT-QUEUE.md viewer/editor moved to a compact row at
 * the bottom of the GitHub panel (bottom-left quadrant) — click Edit
 * there to open the modal.
 *
 * #351: two-column layout at lg+ widths — Scheduled Trigger gets
 * the full-height left column (primary surface during an
 * overnight run so its textarea + Start/Stop button are always
 * reachable without scrolling), while Telegram Bridge → Loop
 * Guard → Project History stack in the right column and scroll
 * independently if the stack exceeds panel height. Below lg the
 * layout collapses back to the single-column stack so nothing
 * clips in cramped split-view / mobile.
 */
export default function OperatorFeaturesPanel({ projectId }: { projectId: string }) {
  const { locale } = useLocale();
  const t = COPY[locale];
  return (
    <div className="flex flex-col h-full min-h-0">
      <PanelHeader label={t.label} tooltip={
        <InfoTooltip>
          {t.tooltip}
        </InfoTooltip>
      } />
      <div className="flex-1 min-h-0 overflow-y-auto p-2 flex flex-col gap-2">
        <PlanningLoopWidget projectId={projectId} />
        <AgentModelsWidget projectId={projectId} />
        <LoopGuardWidget projectId={projectId} />
        <ProjectHistoryWidget projectId={projectId} />
      </div>
    </div>
  );
}
