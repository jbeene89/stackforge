import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, Copy, Download } from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  blobUrl: string | null;
  filename: string;
}

export function DownloadFallbackDialog({ open, onOpenChange, blobUrl, filename }: Props) {
  const handleOpenInNewTab = () => {
    if (!blobUrl) return;
    window.open(blobUrl, "_blank");
  };

  const handleCopyLink = async () => {
    if (!blobUrl) return;
    try {
      await navigator.clipboard.writeText(blobUrl);
      toast.success("Link copied — paste into a new tab to download");
    } catch {
      toast.error("Couldn't copy link");
    }
  };

  const handleRetryDownload = () => {
    if (!blobUrl) return;
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.info("Retrying download…");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => {
      if (!v && blobUrl) {
        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      }
      onOpenChange(v);
    }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            Download Ready
          </DialogTitle>
          <DialogDescription>
            Your file <strong className="text-foreground">{filename}</strong> is ready.
            If the download didn't start automatically, use one of the options below.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 pt-2">
          <Button onClick={handleRetryDownload} className="w-full">
            <Download className="h-4 w-4 mr-2" />
            Retry Download
          </Button>
          <Button variant="outline" onClick={handleOpenInNewTab} className="w-full">
            <ExternalLink className="h-4 w-4 mr-2" />
            Open in New Tab
          </Button>
          <Button variant="ghost" onClick={handleCopyLink} className="w-full">
            <Copy className="h-4 w-4 mr-2" />
            Copy Download Link
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
