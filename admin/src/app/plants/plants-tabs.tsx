"use client";

import { type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CoverageDetailTabs } from "./coverage-tabs";

interface PlantTabsProps {
  browseContent: ReactNode;
}

export function PlantTabs({ browseContent }: PlantTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") ?? "browse";

  function switchTab(value: string) {
    const sp = new URLSearchParams(searchParams.toString());
    if (value === "browse") {
      sp.delete("tab");
    } else {
      sp.set("tab", value);
    }
    router.push(`/plants?${sp.toString()}`, { scroll: false });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <h2 className="text-2xl font-bold">Plants</h2>
        <div className="mx-auto flex rounded-lg border bg-muted p-1">
          <button
            onClick={() => switchTab("browse")}
            className={`rounded-md px-5 py-2 text-sm font-semibold transition-colors ${
              tab === "browse"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Browse Plants
          </button>
          <button
            onClick={() => switchTab("coverage")}
            className={`rounded-md px-5 py-2 text-sm font-semibold transition-colors ${
              tab === "coverage"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Coverage
          </button>
        </div>
      </div>

      {tab === "browse" ? (
        <div className="space-y-6">{browseContent}</div>
      ) : (
        <CoverageDetailTabs />
      )}
    </div>
  );
}
