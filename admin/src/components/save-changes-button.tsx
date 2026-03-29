"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { SaveIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const POLL_INTERVAL = 15_000;

export function SaveChangesButton() {
  const [changeCount, setChangeCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/dolt/status");
      const data = await res.json();
      setChangeCount(data.changes ?? 0);
    } catch {
      // Silently ignore polling errors
    }
  }, []);

  useEffect(() => {
    checkStatus();

    const interval = setInterval(checkStatus, POLL_INTERVAL);

    function onVisibilityChange() {
      if (document.visibilityState === "visible") {
        checkStatus();
      }
    }
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [checkStatus]);

  function handleOpen() {
    setMessage(
      `Manual save — ${new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })}`
    );
    setOpen(true);
  }

  async function handleCommit() {
    if (!message.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/dolt/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Commit failed");
        return;
      }

      const data = await res.json();
      toast.success(`Committed: ${data.commitHash?.slice(0, 8)}`);
      setOpen(false);
      setChangeCount(0);
    } catch {
      toast.error("Failed to commit changes");
    } finally {
      setSaving(false);
    }
  }

  if (changeCount === 0) return null;

  return (
    <>
      <Button size="sm" onClick={handleOpen}>
        <SaveIcon className="mr-1.5 size-3.5" />
        Save Changes ({changeCount})
      </Button>

      <Dialog open={open} onOpenChange={(o) => !o && setOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Changes</DialogTitle>
            <DialogDescription>
              Commit {changeCount} uncommitted change
              {changeCount !== 1 ? "s" : ""} to Dolt version history.
            </DialogDescription>
          </DialogHeader>

          <div>
            <label
              htmlFor="commit-message"
              className="mb-1.5 block text-sm font-medium"
            >
              Commit message
            </label>
            <Input
              id="commit-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !saving) handleCommit();
              }}
              placeholder="Describe your changes..."
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleCommit} disabled={saving || !message.trim()}>
              {saving ? "Saving..." : "Commit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
