"use client";

import { VfsFileExplorer } from "@/components/playground/vfs-file-explorer";
import { SlidePane } from "@/components/playground/slide-pane";
import type { ScrimSlide } from "@/lib/schemas/playground";
import type { VfsState } from "@/lib/playground/vfs";
import { cn } from "@/lib/utils";

type FileSidebarProps = {
  vfs: VfsState;
  activeFile: string;
  readOnly?: boolean;
  defaultLanguage?: string;
  slides?: ScrimSlide[];
  activeSlideId?: string | null;
  onSelectFile: (path: string) => void;
  onVfsChange: (vfs: VfsState) => void;
  onSelectSlide?: (id: string) => void;
  className?: string;
};

/** Left rail: files always visible; slides stack below when present. */
export function FileSidebar({
  vfs,
  activeFile,
  readOnly,
  defaultLanguage,
  slides = [],
  activeSlideId,
  onSelectFile,
  onVfsChange,
  onSelectSlide,
  className,
}: FileSidebarProps) {
  const hasSlides = slides.length > 0;

  return (
    <aside
      className={cn(
        "flex h-full min-w-[11rem] flex-col border-r border-[var(--hairline-warm)] bg-[#13120e]",
        className
      )}
    >
      <div className="flex shrink-0 items-center justify-between border-b border-[var(--hairline-warm)] px-3 py-2">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--on-dark-mute)]">
          Explorer
        </p>
        <span className="max-w-[55%] truncate font-mono text-[10px] text-[var(--primary)]">
          {activeFile}
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        <VfsFileExplorer
          vfs={vfs}
          activeFile={activeFile}
          readOnly={readOnly}
          onSelect={onSelectFile}
          onChange={onVfsChange}
        />
      </div>

      {hasSlides && (
        <>
          <div className="shrink-0 border-t border-[var(--hairline-warm)] px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--on-dark-mute)]">
              Lesson
            </p>
          </div>
          <div className="max-h-[40%] min-h-0 shrink-0 overflow-y-auto border-t border-[var(--hairline-warm)]/50 p-2">
            <SlidePane
              slides={slides}
              activeSlideId={activeSlideId ?? null}
              onSelectSlide={onSelectSlide}
            />
          </div>
        </>
      )}
    </aside>
  );
}
