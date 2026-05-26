"use client";

import { useEffect, useState, useCallback } from "react";
import ArtifactPreview from "./ArtifactPreview";
import InfoTooltip from "./InfoTooltip";
import { useLocale } from "@/components/LocaleProvider";

interface Artifact {
  relativePath: string;
  type: string;
  name: string;
  ext: string;
}

interface ArtifactBrowserProps {
  projectId: string;
}

const COPY = {
  en: {
    title: "Artifacts",
    tooltip: (
      <>
        <b>Artifacts</b> — browse and preview project proposals, designs, tickets, and docs.
      </>
    ),
    noArtifacts: "No artifacts found. HEAD will create them as planning work progresses.",
    proposal: "proposal",
    design: "design",
    ticket: "ticket",
    doc: "doc",
  },
  ko: {
    title: "산출물",
    tooltip: (
      <>
        <b>산출물</b> — 프로젝트 제안서, 디자인, 티켓, 문서를 탐색하고 미리봅니다.
      </>
    ),
    noArtifacts: "산출물이 없습니다. 기획 작업이 진행되면 HEAD가 생성합니다.",
    proposal: "제안서",
    design: "디자인",
    ticket: "티켓",
    doc: "문서",
  },
} as const;

const TYPE_COLORS: Record<string, string> = {
  proposal: "text-accent",
  design_html: "text-[#ffcc00]",
  ticket: "text-[#4488ff]",
  doc: "text-text-muted",
};

export default function ArtifactBrowser({ projectId }: ArtifactBrowserProps) {
  const { locale } = useLocale();
  const t = COPY[locale];
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  const load = useCallback(() => {
    fetch(`/api/artifacts?project=${encodeURIComponent(projectId)}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d?.artifacts) setArtifacts(d.artifacts); })
      .catch(() => {});
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="flex flex-col h-full min-h-0 border border-border">
      <div className="flex items-center gap-1.5 h-7 px-3 shrink-0 border-b border-border">
        <span className="text-[10px] text-text-muted uppercase tracking-wider">{t.title}</span>
        <InfoTooltip>{t.tooltip}</InfoTooltip>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* File list */}
        <div className="w-48 shrink-0 border-r border-border overflow-y-auto">
          {artifacts.length === 0 ? (
            <div className="p-3 text-[10px] text-text-muted">{t.noArtifacts}</div>
          ) : (
            artifacts.map((a) => (
              <button
                key={a.relativePath}
                type="button"
                onClick={() => setSelected(a.relativePath)}
                className={`w-full text-left px-3 py-1.5 text-[11px] border-b border-border/30 hover:bg-[#1a1a1a] transition-colors ${
                  selected === a.relativePath ? "bg-accent/10 text-accent" : "text-text"
                }`}
              >
                <div className="truncate">{a.name}</div>
                <div className={`text-[9px] uppercase tracking-wider ${TYPE_COLORS[a.type] || "text-text-muted"}`}>
                  {a.type?.replace("_", " ")}
                </div>
              </button>
            ))
          )}
        </div>

        {/* Preview pane */}
        <div className="flex-1 min-w-0">
          <ArtifactPreview projectId={projectId} artifactPath={selected} />
        </div>
      </div>
    </div>
  );
}
