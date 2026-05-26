"use client";

import { useEffect, useState, useCallback } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useLocale } from "@/components/LocaleProvider";

interface ArtifactPreviewProps {
  projectId: string;
  artifactPath: string | null;
}

const COPY = {
  en: {
    selectArtifact: "Select an artifact to preview",
    loading: "Loading preview...",
    notFound: "File not found",
    forbidden: "Access denied — file outside allowed directories",
    error: "Could not load preview",
    unsupported: "Preview not supported for this file type",
    openInBrowser: "Open in Browser",
    browserHint: "Use browser dev tools to check responsiveness at desktop/tablet/mobile widths",
  },
  ko: {
    selectArtifact: "미리보기할 산출물을 선택하세요",
    loading: "미리보기 로딩 중...",
    notFound: "파일을 찾을 수 없습니다",
    forbidden: "접근 거부 — 허용된 디렉터리 밖의 파일",
    error: "미리보기를 불러올 수 없습니다",
    unsupported: "이 파일 형식은 미리보기를 지원하지 않습니다",
    openInBrowser: "브라우저에서 열기",
    browserHint: "브라우저 개발자 도구로 데스크톱/태블릿/모바일 너비에서 반응형을 확인하세요",
  },
} as const;

type PreviewState = "idle" | "loading" | "loaded" | "not_found" | "forbidden" | "error" | "unsupported";

export default function ArtifactPreview({ projectId, artifactPath }: ArtifactPreviewProps) {
  const { locale } = useLocale();
  const t = COPY[locale];
  const [state, setState] = useState<PreviewState>("idle");
  const [content, setContent] = useState("");
  const [ext, setExt] = useState("");

  const load = useCallback(() => {
    if (!artifactPath) { setState("idle"); return; }
    setState("loading");

    fetch(`/api/artifact-preview?project=${encodeURIComponent(projectId)}&path=${encodeURIComponent(artifactPath)}`)
      .then((r) => {
        if (r.status === 403) { setState("forbidden"); return null; }
        if (r.status === 404) { setState("not_found"); return null; }
        if (!r.ok) { setState("error"); return null; }
        return r.json();
      })
      .then((d) => {
        if (!d) return;
        const fileExt = d.ext || "";
        if (fileExt === ".md" || fileExt === ".html") {
          setContent(d.content);
          setExt(fileExt);
          setState("loaded");
        } else {
          setState("unsupported");
        }
      })
      .catch(() => setState("error"));
  }, [projectId, artifactPath]);

  useEffect(() => { load(); }, [load]);

  if (state === "idle") {
    return (
      <div className="flex items-center justify-center h-full text-[11px] text-text-muted p-4">
        {t.selectArtifact}
      </div>
    );
  }

  if (state === "loading") {
    return (
      <div className="flex items-center justify-center h-full text-[11px] text-text-muted animate-pulse p-4">
        {t.loading}
      </div>
    );
  }

  if (state === "not_found") {
    return <div className="p-4 text-[11px] text-error">{t.notFound}</div>;
  }

  if (state === "forbidden") {
    return <div className="p-4 text-[11px] text-error">{t.forbidden}</div>;
  }

  if (state === "error") {
    return <div className="p-4 text-[11px] text-error">{t.error}</div>;
  }

  if (state === "unsupported") {
    return <div className="p-4 text-[11px] text-text-muted">{t.unsupported}</div>;
  }

  if (ext === ".html") {
    const serveUrl = `/api/artifact-serve?project=${encodeURIComponent(projectId)}&path=${encodeURIComponent(artifactPath!)}`;
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center gap-3 px-4 py-2 border-b border-border shrink-0">
          <a
            href={serveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2 py-0.5 text-[10px] text-accent border border-accent/40 hover:bg-accent/10 transition-colors"
          >
            {t.openInBrowser}
          </a>
          <span className="text-[9px] text-text-muted">{t.browserHint}</span>
        </div>
        <div className="flex-1 min-h-0 p-4">
          <iframe
            src={serveUrl}
            sandbox="allow-same-origin"
            className="w-full h-full border border-border bg-white min-h-[400px]"
            title="Design preview"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-4">
      <div className="prose prose-invert prose-sm max-w-none
        prose-headings:text-text prose-headings:font-semibold prose-headings:tracking-tight
        prose-p:text-text prose-p:text-[12px] prose-p:leading-relaxed
        prose-li:text-text prose-li:text-[12px]
        prose-code:text-accent prose-code:text-[11px] prose-code:bg-bg-surface prose-code:px-1 prose-code:rounded
        prose-pre:bg-bg-surface prose-pre:border prose-pre:border-border prose-pre:text-[11px]
        prose-table:text-[11px] prose-th:text-text-muted prose-th:border-border prose-td:border-border
        prose-a:text-accent prose-a:no-underline hover:prose-a:underline
        prose-strong:text-text prose-em:text-text-muted
      ">
        <Markdown remarkPlugins={[remarkGfm]}>{content}</Markdown>
      </div>
    </div>
  );
}
