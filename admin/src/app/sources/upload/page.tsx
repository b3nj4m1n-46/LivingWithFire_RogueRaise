import { UploadClient } from "./upload-client";

export const dynamic = "force-dynamic";

export default function UploadPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Upload New Source</h2>
      <UploadClient />
    </div>
  );
}
