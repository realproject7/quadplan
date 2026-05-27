"use client";

import { useEffect } from "react";
import { useLocale } from "@/components/LocaleProvider";

interface HowToWorkModalProps {
  open: boolean;
  onClose: () => void;
}

const COPY = {
  en: {
    title: "How QuadPlan plans your project",
    subtitle: "Five steps from your planning request to a reviewed, approved artifact.",
    close: "Close",
    helpClass: "",
    steps: [
      {
        title: "You assign a task in the chat",
        body: "Tell @head what to plan. Be as specific or as vague as you like.",
      },
      {
        title: "HEAD creates a GitHub issue",
        body: "HEAD opens an issue, adds it to the queue, and waits for your trigger.",
      },
      {
        title: "HEAD creates the artifact",
        body: "HEAD drafts the proposal, tickets, design, or document and opens a pull request.",
      },
      {
        title: "Reviewers check the work",
        body: "RE1 and RE2 each review the artifact independently. Both must approve before it is accepted.",
      },
      {
        title: "HEAD completes and continues",
        body: "HEAD marks the item done and moves to the next artifact from the queue. The cycle continues all night while you sleep.",
      },
    ],
  },
  ko: {
    title: "QuadPlan이 프로젝트를 기획하는 방식",
    subtitle: "기획 요청에서 리뷰를 거쳐 승인된 산출물까지 5단계입니다.",
    close: "닫기",
    helpClass: "ko-help",
    steps: [
      {
        title: "채팅에서 작업을 지시합니다",
        body: "@head에게 기획할 것을 말해주세요. 구체적으로 또는 모호하게 말해도 괜찮습니다.",
      },
      {
        title: "HEAD가 GitHub 이슈를 만듭니다",
        body: "HEAD가 이슈를 열고, 큐에 추가한 뒤, 당신의 트리거를 기다립니다.",
      },
      {
        title: "HEAD가 산출물을 작성합니다",
        body: "HEAD가 제안서, 티켓, 디자인, 또는 문서를 작성하고 풀 리퀘스트를 엽니다.",
      },
      {
        title: "리뷰어가 작업을 검토합니다",
        body: "RE1과 RE2가 각각 독립적으로 산출물을 리뷰합니다. 둘 다 승인해야 산출물이 확정됩니다.",
      },
      {
        title: "HEAD가 완료하고 계속 진행합니다",
        body: "HEAD가 항목을 완료 처리하고, 큐에서 다음 산출물로 넘어갑니다. 당신이 자는 동안에도 이 사이클은 밤새 계속됩니다.",
      },
    ],
  },
} as const;

/**
 * "How to Work" modal (#229).
 *
 * Vertical-timeline explanation of the 3-agent planning workflow. Accessible
 * from both empty states (HomeEmptyState + ProjectChatEmptyState).
 * Closes on Escape, backdrop click, or the X button.
 */
export default function HowToWorkModal({ open, onClose }: HowToWorkModalProps) {
  const { locale } = useLocale();
  const t = COPY[locale];

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="how-to-work-title"
    >
      <div
        className={`relative mx-4 max-w-xl w-full max-h-[90vh] overflow-auto rounded-lg border border-white/10 bg-neutral-950 p-6 shadow-2xl ${t.helpClass}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={t.close}
          className="absolute right-3 top-3 rounded p-1 text-neutral-400 hover:bg-white/5 hover:text-white"
        >
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M4 4l12 12M16 4L4 16" strokeLinecap="round" />
          </svg>
        </button>

        <h2 id="how-to-work-title" className="text-base font-semibold text-white">
          {t.title}
        </h2>
        <p className="mt-2 text-[12px] text-neutral-400">
          {t.subtitle}
        </p>

        <ol className="mt-5 relative">
          {/* Vertical accent line connecting the step circles. */}
          <span aria-hidden className="absolute left-[14px] top-3 bottom-3 w-px bg-accent/30" />
          {t.steps.map((step, i) => (
            <li key={i} className="relative pl-10 pb-5 last:pb-0">
              <span
                className="absolute left-0 top-0 inline-flex items-center justify-center w-7 h-7 rounded-full border border-accent bg-neutral-950 text-accent text-[12px] font-semibold tabular-nums"
                aria-hidden
              >
                {i + 1}
              </span>
              <div className="text-[13px] font-semibold text-white">{step.title}</div>
              <div className="mt-1 text-[12px] leading-relaxed text-neutral-400">{step.body}</div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
