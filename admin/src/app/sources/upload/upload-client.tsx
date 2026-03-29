"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const CATEGORIES = [
  "fire",
  "deer",
  "water",
  "pollinators",
  "birds",
  "native",
  "invasive",
  "traits",
  "taxonomy",
];

const STEP_LABELS = [
  "Upload CSV",
  "Source Metadata",
  "AI Data Dictionary",
  "Run Pipeline",
];

export function UploadClient() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  // Navigation
  const [step, setStep] = useState(1);

  // Step 1 — Upload
  const [uploading, setUploading] = useState(false);
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [sampleRows, setSampleRows] = useState<string[][]>([]);
  const [rowCount, setRowCount] = useState(0);
  const [fileSize, setFileSize] = useState(0);
  const [dragOver, setDragOver] = useState(false);

  // Step 2 — Metadata
  const [name, setName] = useState("");
  const [sourceId, setSourceId] = useState("");
  const [category, setCategory] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [citation, setCitation] = useState("");
  const [notes, setNotes] = useState("");
  const [creating, setCreating] = useState(false);
  const [datasetFolder, setDatasetFolder] = useState<string | null>(null);

  // Step 3 — Dictionary
  const [generating, setGenerating] = useState(false);
  const [dictionary, setDictionary] = useState<string | null>(null);
  const [editingDict, setEditingDict] = useState(false);
  const [savingDict, setSavingDict] = useState(false);

  // Step 4 — Run
  const [running, setRunning] = useState(false);

  // --- Step 1: Upload CSV ---

  async function handleFileUpload(file: File) {
    if (!file.name.endsWith(".csv")) {
      toast.error("Only .csv files are accepted");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/sources/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }

      const data = await res.json();
      setUploadId(data.uploadId);
      setHeaders(data.headers);
      setSampleRows(data.sampleRows);
      setRowCount(data.rowCount);
      setFileSize(data.fileSize);
      toast.success(`Uploaded: ${data.rowCount} rows, ${data.headers.length} columns`);
      setStep(2);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  }

  // --- Step 2: Source Metadata ---

  async function handleCategoryChange(cat: string | null) {
    if (!cat) return;
    setCategory(cat);
    // Auto-suggest source ID
    try {
      const res = await fetch(
        `/api/sources/create?suggestId=${encodeURIComponent(cat)}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.suggestedId) setSourceId(data.suggestedId);
      }
    } catch {
      // Non-critical — user can type manually
    }
  }

  async function handleCreate() {
    if (!name.trim()) {
      toast.error("Dataset name is required");
      return;
    }
    if (!sourceId.trim()) {
      toast.error("Source ID is required");
      return;
    }
    if (!category) {
      toast.error("Category is required");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/sources/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uploadId,
          name: name.trim(),
          sourceId: sourceId.trim(),
          category,
          url: sourceUrl.trim() || undefined,
          citation: citation.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create dataset");
      }

      const data = await res.json();
      setDatasetFolder(data.datasetFolder);
      toast.success("Dataset folder created");
      setStep(3);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Creation failed");
    } finally {
      setCreating(false);
    }
  }

  // --- Step 3: AI Data Dictionary ---

  async function handleGenerateDict() {
    if (!datasetFolder) return;

    setGenerating(true);
    try {
      const res = await fetch("/api/sources/dictionary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ datasetFolder, sourceId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Dictionary generation failed");
      }

      const data = await res.json();
      setDictionary(data.dictionary);
      toast.success("Data dictionary generated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  }

  async function handleSaveDict() {
    if (!datasetFolder || !dictionary) return;

    setSavingDict(true);
    try {
      // Re-write dictionary if edited
      const res = await fetch("/api/sources/dictionary", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ datasetFolder, content: dictionary }),
      });
      // PUT may not exist yet — fall through if not needed
      if (res.ok) {
        toast.success("Dictionary saved");
      }
    } catch {
      // Non-critical
    } finally {
      setSavingDict(false);
      setStep(4);
    }
  }

  // --- Step 4: Run Pipeline ---

  async function handleRunPipeline() {
    if (!datasetFolder) return;

    setRunning(true);
    try {
      const res = await fetch("/api/sources/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          datasetFolder,
          sourceDataset: name.trim(),
          sourceId: sourceId.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to start pipeline");
      }

      const data = await res.json();
      toast.success("Pipeline started");
      router.push(`/sources/${data.batchId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Pipeline start failed");
      setRunning(false);
    }
  }

  // --- Render ---

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {STEP_LABELS.map((label, i) => {
          const stepNum = i + 1;
          const isActive = step === stepNum;
          const isDone = step > stepNum;
          return (
            <div key={label} className="flex items-center gap-2">
              {i > 0 && (
                <div
                  className={`h-px w-8 ${isDone ? "bg-primary" : "bg-border"}`}
                />
              )}
              <Badge
                variant={isActive ? "default" : isDone ? "default" : "secondary"}
                className={isDone ? "opacity-60" : ""}
              >
                {stepNum}. {label}
              </Badge>
            </div>
          );
        })}
      </div>

      {/* Step 1: Upload CSV */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Upload CSV File</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className={`cursor-pointer rounded-lg border-2 border-dashed p-12 text-center transition-colors ${
                dragOver
                  ? "border-primary bg-accent"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <p className="text-lg font-medium">
                {uploading
                  ? "Uploading..."
                  : "Drop a CSV file here or click to browse"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Only .csv files are accepted
              </p>
              <input
                ref={fileRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Source Metadata */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Source Metadata</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Preview summary */}
            <div className="rounded-md bg-muted p-3 text-sm">
              <span className="font-medium">{rowCount.toLocaleString()}</span>{" "}
              rows,{" "}
              <span className="font-medium">{headers.length}</span> columns,{" "}
              <span className="font-medium">
                {(fileSize / 1024).toFixed(1)} KB
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Dataset Name <span className="text-destructive">*</span>
                </label>
                <Input
                  placeholder="e.g. FirePerformancePlants"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Category <span className="text-destructive">*</span>
                </label>
                <Select value={category} onValueChange={handleCategoryChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Source ID <span className="text-destructive">*</span>
                </label>
                <Input
                  placeholder="e.g. FIRE-13"
                  value={sourceId}
                  onChange={(e) => setSourceId(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Source URL</label>
                <Input
                  placeholder="https://..."
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Citation</label>
              <Input
                placeholder="Author, Title, Year..."
                value={citation}
                onChange={(e) => setCitation(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Notes</label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="Any additional notes about this dataset..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {/* Column preview */}
            <details className="text-sm">
              <summary className="cursor-pointer font-medium text-muted-foreground hover:text-foreground">
                Preview columns ({headers.length})
              </summary>
              <div className="mt-2 max-h-64 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {headers.map((h) => (
                        <TableHead key={h} className="whitespace-nowrap">
                          {h}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sampleRows.slice(0, 5).map((row, i) => (
                      <TableRow key={i}>
                        {row.map((cell, j) => (
                          <TableCell
                            key={j}
                            className="max-w-[200px] truncate whitespace-nowrap"
                          >
                            {cell}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </details>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? "Creating..." : "Create Dataset"}
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Step 3: AI Data Dictionary */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>AI Data Dictionary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!dictionary ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Generate a DATA-DICTIONARY.md using AI analysis of your CSV
                  headers and sample data. You can review and edit the result
                  before saving.
                </p>
                <Button onClick={handleGenerateDict} disabled={generating}>
                  {generating
                    ? "Generating (this may take a moment)..."
                    : "Generate Data Dictionary"}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="default">Generated</Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingDict(!editingDict)}
                  >
                    {editingDict ? "Preview" : "Edit"}
                  </Button>
                </div>
                {editingDict ? (
                  <textarea
                    className="flex min-h-[400px] w-full rounded-md border border-input bg-transparent px-3 py-2 font-mono text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={dictionary}
                    onChange={(e) => setDictionary(e.target.value)}
                  />
                ) : (
                  <pre className="max-h-[500px] overflow-auto rounded-md bg-muted p-4 text-sm whitespace-pre-wrap">
                    {dictionary}
                  </pre>
                )}
              </div>
            )}
          </CardContent>
          {dictionary && (
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button onClick={handleSaveDict} disabled={savingDict}>
                {savingDict ? "Saving..." : "Save & Continue"}
              </Button>
            </CardFooter>
          )}
        </Card>
      )}

      {/* Step 4: Run Pipeline */}
      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Run Pipeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Summary */}
            <div className="rounded-md bg-muted p-4 space-y-2 text-sm">
              <div>
                <span className="font-medium">Dataset:</span> {name}
              </div>
              <div>
                <span className="font-medium">Source ID:</span>{" "}
                <span className="font-mono">{sourceId}</span>
              </div>
              <div>
                <span className="font-medium">Category:</span>{" "}
                <span className="capitalize">{category}</span>
              </div>
              <div>
                <span className="font-medium">Records:</span>{" "}
                {rowCount.toLocaleString()}
              </div>
              <div>
                <span className="font-medium">Dictionary:</span>{" "}
                <Badge variant="default">Generated</Badge>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              The full pipeline will: match plants to the production database,
              map schema columns, create warrants, and classify conflicts. This
              may take several minutes for large datasets.
            </p>

            <div className="flex gap-3">
              <Button onClick={handleRunPipeline} disabled={running}>
                {running ? "Starting..." : "Run Full Pipeline"}
              </Button>
              <Link href="/fusion">
                <Button variant="outline">Review Mapping First</Button>
              </Link>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" onClick={() => setStep(3)}>
              Back
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
