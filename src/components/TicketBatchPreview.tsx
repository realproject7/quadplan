"use client";

import { useEffect, useState, useCallback } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useLocale } from "@/components/LocaleProvider";

interface TicketBatchPreviewProps {
  projectId: string;
  artifactPath: string | null;
  issueLinks?: { id: string; url: string; title: string }[];
}

const COPY = {
  en: {
    title: "Ticket Batch",
    draft: "Draft",
    created: "Created Tickets",
    noDraft: "No draft ticket content available.",
    noTickets: "No tickets created yet. HEAD will create them from the proposal.",
    viewOnGitHub: "view →",
  },
  ko: {
    title: "티켓 배치",
    draft: "초안",
    created: "생성된 티켓",
    noDraft: "초안 티켓 내용이 없습니다.",
    noTickets: "아직 생성된 티켓이 없습니다. HEAD가 제안서에서 생성합니다.",
    viewOnGitHub: "보기 →",
  },
} as const;

export default function TicketBatchPreview({ projectId, artifactPath, issueLinks }: TicketBatchPreviewProps) {
  const { locale } = useLocale();
  const t = COPY[locale];
  const [draftContent, setDraftContent] = useState<string | null>(null);

  const loadDraft = useCallback(() => {
    setDraftContent(null);
    if (!artifactPath) return;
    fetch(`/api/artifact-preview?project=${encodeURIComponent(projectId)}&path=${encodeURIComponent(artifactPath)}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { setDraftContent(d?.content ?? null); })
      .catch(() => { setDraftContent(null); });
  }, [projectId, artifactPath]);

  useEffect(() => { loadDraft(); }, [loadDraft]);

  const hasLinks = issueLinks && issueLinks.length > 0;
  const hasDraft = draftContent !== null;

  return (
    <div className="border border-border">
      <div className="h-7 px-3 flex items-center border-b border-border">
        <span className="text-[10px] text-text-muted uppercase tracking-wider">{t.title}</span>
      </div>

      {/* Created ticket links */}
      {hasLinks && (
        <div className="border-b border-border/40">
          <div className="px-3 py-1 text-[9px] text-text-muted uppercase tracking-wider">{t.created}</div>
          {issueLinks!.map((link) => (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-1 text-[11px] hover:bg-[#1a1a1a] transition-colors border-b border-border/30 last:border-b-0"
            >
              <span className="text-accent font-mono shrink-0">{link.id}</span>
              <span className="text-text truncate flex-1 min-w-0">{link.title}</span>
              <span className="text-text-muted text-[10px] shrink-0">{t.viewOnGitHub}</span>
            </a>
          ))}
        </div>
      )}

      {/* Draft markdown preview */}
      {hasDraft ? (
        <div className="max-h-60 overflow-y-auto p-3">
          <div className="text-[9px] text-text-muted uppercase tracking-wider mb-2">{t.draft}</div>
          <div className="prose prose-invert prose-sm max-w-none
            prose-headings:text-text prose-headings:text-[12px] prose-headings:font-semibold
            prose-p:text-text prose-p:text-[11px] prose-p:leading-relaxed
            prose-li:text-text prose-li:text-[11px]
            prose-code:text-accent prose-code:text-[10px]
            prose-pre:bg-bg-surface prose-pre:border prose-pre:border-border prose-pre:text-[10px]
          ">
            <Markdown remarkPlugins={[remarkGfm]}>{draftContent}</Markdown>
          </div>
        </div>
      ) : !hasLinks ? (
        <div className="px-3 py-3 text-[11px] text-text-muted">{t.noTickets}</div>
      ) : null}
    </div>
  );
}
