"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";

import type { DashboardSortMode } from "@/lib/chronos/transform-dashboard";

const sortOptions: Array<{ label: string; value: DashboardSortMode }> = [
  { label: "Custom", value: "custom" },
  { label: "Recent", value: "recent" },
];

export function DashboardSortDropdown({ sortMode }: { sortMode: DashboardSortMode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const menuId = useId();
  const pathname = usePathname();
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const selectedOption = sortOptions.find((option) => option.value === sortMode) ?? sortOptions[0];

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  function selectSortMode(nextSortMode: DashboardSortMode) {
    const params = new URLSearchParams(window.location.search);
    params.set("sort", nextSortMode);
    params.delete("error");

    setIsOpen(false);
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    });
  }

  return (
    <div className="dashboard-sort" ref={rootRef} data-no-drag>
      <button
        className="dashboard-sort-trigger"
        type="button"
        aria-controls={isOpen ? menuId : undefined}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        disabled={isPending}
        onClick={() => setIsOpen((current) => !current)}
      >
        <span className="dashboard-sort-label">Sort by</span>
        <span className="dashboard-sort-value">{selectedOption.label}</span>
        <ChevronDown size={16} aria-hidden="true" />
      </button>

      {isOpen ? (
        <div className="dashboard-sort-menu" id={menuId} role="menu" aria-label="Sort skills by">
          {sortOptions.map((option) => {
            const isSelected = option.value === sortMode;

            return (
              <button
                className={isSelected ? "is-selected" : ""}
                type="button"
                role="menuitemradio"
                aria-checked={isSelected}
                key={option.value}
                onClick={() => selectSortMode(option.value)}
              >
                <span>{option.label}</span>
                {isSelected ? <Check size={15} aria-hidden="true" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
