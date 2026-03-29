"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

interface DocumentEntry {
  filename: string;
  indexed: boolean;
  sections: number | null;
  sizeBytes: number | null;
  indexFile: string | null;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [indexingFiles, setIndexingFiles] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function loadDocuments() {
    try {
      const res = await fetch("/api/sources/documents/status");
      if (!res.ok) throw new Error("Failed to load documents");
      const data = await res.json();
      setDocuments(data.documents);
    } catch (err) {
      toast.error("Failed to load document list");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDocuments();
  }, []);

  // Poll for indexing status when any files are being indexed
  useEffect(() => {
    if (indexingFiles.size === 0) return;
    const interval = setInterval(async () => {
      await loadDocuments();
      // Check if any indexing files are now indexed
      setIndexingFiles((prev) => {
        const next = new Set(prev);
        for (const filename of prev) {
          const doc = documents.find((d) => d.filename === filename);
          if (doc?.indexed) {
            next.delete(filename);
            toast.success(`Indexed: ${filename}`);
          }
        }
        return next;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [indexingFiles.size, documents]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".pdf")) {
      toast.error("Only PDF files are accepted");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/sources/documents/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }
      toast.success(`Uploaded: ${file.name}`);
      await loadDocuments();
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    }
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleIndex(filename: string) {
    setIndexingFiles((prev) => new Set(prev).add(filename));
    try {
      const res = await fetch("/api/sources/documents/index", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Index trigger failed");
      }
      toast.success(`Indexing started: ${filename}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to start indexing");
      setIndexingFiles((prev) => {
        const next = new Set(prev);
        next.delete(filename);
        return next;
      });
    }
  }

  async function handleIndexAll() {
    const unindexed = documents.filter((d) => !d.indexed);
    if (unindexed.length === 0) {
      toast.info("All documents are already indexed");
      return;
    }
    for (const doc of unindexed) {
      await handleIndex(doc.filename);
    }
  }

  const indexed = documents.filter((d) => d.indexed).length;
  const total = documents.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Knowledge Base Documents</h2>
          <p className="text-sm text-muted-foreground">
            {indexed} of {total} PDFs indexed
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleIndexAll}
            disabled={indexed === total || indexingFiles.size > 0}
          >
            Index All Unindexed
          </Button>
          <input
            type="file"
            accept=".pdf"
            ref={fileInputRef}
            onChange={handleUpload}
            className="hidden"
          />
          <Button onClick={() => fileInputRef.current?.click()}>
            Upload PDF
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">
              Loading documents...
            </div>
          ) : documents.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No PDFs found in knowledge-base/
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Filename</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Sections</TableHead>
                  <TableHead className="text-right">Index Size</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow key={doc.filename}>
                    <TableCell className="font-mono text-xs max-w-md truncate">
                      {doc.filename}
                    </TableCell>
                    <TableCell>
                      {indexingFiles.has(doc.filename) ? (
                        <Badge variant="outline">Indexing...</Badge>
                      ) : doc.indexed ? (
                        <Badge>Indexed</Badge>
                      ) : (
                        <Badge variant="secondary">Not Indexed</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {doc.sections ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {doc.sizeBytes
                        ? `${(doc.sizeBytes / 1024).toFixed(1)} KB`
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {indexingFiles.has(doc.filename) ? (
                        <Button size="sm" variant="ghost" disabled>
                          Indexing...
                        </Button>
                      ) : doc.indexed ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleIndex(doc.filename)}
                        >
                          Re-index
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleIndex(doc.filename)}
                        >
                          Index
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
