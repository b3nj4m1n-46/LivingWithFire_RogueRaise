"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface NavItem {
  href: string;
  label: string;
  badge?: string;
}

interface NavGroup {
  label?: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  { items: [{ href: "/", label: "Dashboard" }] },
  { items: [{ href: "/plants", label: "Browse Plants" }] },
  {
    label: "Data Pipeline",
    items: [
      { href: "/sources", label: "Data Set Sources" },
      { href: "/sources/documents", label: "Documents" },
      { href: "/sources/reliability", label: "Reliability" },
      { href: "/fusion", label: "Fusion" },
    ],
  },
  {
    label: "Curation",
    items: [
      { href: "/conflicts", label: "Conflicts" },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/sync", label: "Sync" },
      { href: "/history", label: "History" },
    ],
  },
];

export function SidebarNav({ onLinkClick }: { onLinkClick?: () => void } = {}) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      <div className="px-5 py-5">
        <h1 className="text-lg font-semibold tracking-tight text-sidebar-primary-foreground">LWF Admin</h1>
        <p className="text-xs text-sidebar-foreground/60">Plant Data Portal</p>
      </div>
      <div className="mx-4 border-t border-sidebar-border" />
      <nav className="mt-2 flex flex-1 flex-col gap-0.5 px-3">
        {navGroups.map((group, gi) => (
          <div key={gi} className={group.label ? "mt-5" : ""}>
            {group.label && (
              <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
                {group.label}
              </p>
            )}
            {group.items.map(({ href, label, badge }) => {
              const isActive =
                href === "/"
                  ? pathname === "/"
                  : pathname === href || pathname.startsWith(href + "/");
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={onLinkClick}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    group.label ? "pl-5" : ""
                  } ${
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                  }`}
                >
                  {label}
                  {badge && (
                    <Badge
                      variant="outline"
                      className="ml-auto border-sidebar-border px-1.5 py-0 text-[10px] font-normal text-sidebar-foreground/50"
                    >
                      {badge}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </div>
  );
}
