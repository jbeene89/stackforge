import { useState, useRef, useCallback } from "react";
import { Mic, MicOff, Camera, StickyNote, Send, Trash2, Clock, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMobileCaptures, CaptureType } from "@/hooks/useMobileCaptures";
import { cn } from "@/lib/utils";

type ActiveMode = "text" | "voice" | "photo" | null;

export default function CapturePage() {
  const { captures, isLoading, addCapture, deleteCapture } = useMobileCaptures();
  const [activeMode, setActiveMode] = useState<ActiveMode>(null);
  const [textContent, setTextContent] = useState("");
  const [textTitle, setTextTitle] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [photoNote, setPhotoNote] = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // ── Voice Recording ──
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setRecordingDuration(0);
      timerRef.current = setInterval(() => setRecordingDuration((d) => d + 1), 1000);
    } catch {
      alert("Microphone access denied. Please allow microphone access in your browser settings.");
    }
  }, []);

  const stopRecording = useCallback(() => {
    return new Promise<Blob | null>((resolve) => {
      const mr = mediaRecorderRef.current;
      if (!mr || mr.state === "inactive") { resolve(null); return; }

      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        mr.stream.getTracks().forEach((t) => t.stop());
        resolve(blob);
      };
      mr.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    });
  }, []);

  const handleVoiceSubmit = useCallback(async () => {
    const blob = await stopRecording();
    if (!blob) return;
    addCapture.mutate({
      type: "voice",
      title: `Voice memo — ${new Date().toLocaleTimeString()}`,
      content: `${recordingDuration}s voice recording`,
      file: blob,
      fileName: "voice.webm",
      metadata: { duration_seconds: recordingDuration },
    });
    setActiveMode(null);
    setRecordingDuration(0);
  }, [stopRecording, addCapture, recordingDuration]);

  // ── Photo Capture ──
  const openCamera = useCallback(async () => {
    setActiveMode("photo");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      // Fallback to file input
      fileInputRef.current?.click();
    }
  }, []);

  const takePhoto = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (blob) {
        setPhotoBlob(blob);
        setPhotoPreview(canvas.toDataURL("image/jpeg"));
        streamRef.current?.getTracks().forEach((t) => t.stop());
      }
    }, "image/jpeg", 0.85);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoBlob(file);
    setPhotoPreview(URL.createObjectURL(file));
  }, []);

  const handlePhotoSubmit = useCallback(() => {
    if (!photoBlob) return;
    addCapture.mutate({
      type: "photo",
      title: photoNote || `Photo capture — ${new Date().toLocaleTimeString()}`,
      content: photoNote || "Photo capture",
      file: photoBlob,
      fileName: "photo.jpg",
    });
    setActiveMode(null);
    setPhotoPreview(null);
    setPhotoBlob(null);
    setPhotoNote("");
  }, [photoBlob, photoNote, addCapture]);

  // ── Text Note ──
  const handleTextSubmit = useCallback(() => {
    if (!textContent.trim()) return;
    addCapture.mutate({
      type: "text",
      title: textTitle.trim() || `Note — ${new Date().toLocaleTimeString()}`,
      content: textContent,
    });
    setTextContent("");
    setTextTitle("");
    setActiveMode(null);
  }, [textContent, textTitle, addCapture]);

  const formatDuration = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const statusIcon = (status: string) => {
    if (status === "queued") return <Clock className="h-3 w-3 text-forge-amber" />;
    if (status === "processed") return <CheckCircle2 className="h-3 w-3 text-forge-emerald" />;
    return <Loader2 className="h-3 w-3 animate-spin" />;
  };

  const typeEmoji = (type: string) => {
    if (type === "voice") return "🎙️";
    if (type === "photo") return "📸";
    return "📝";
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold">Capture</h1>
        <p className="text-sm text-muted-foreground">Collect training data on the go</p>
      </div>

      {/* Capture buttons */}
      {!activeMode && (
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => setActiveMode("text")}
            className="flex flex-col items-center gap-2 p-6 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all active:scale-95"
          >
            <StickyNote className="h-8 w-8 text-primary" />
            <span className="text-sm font-semibold">Note</span>
          </button>
          <button
            onClick={() => { setActiveMode("voice"); startRecording(); }}
            className="flex flex-col items-center gap-2 p-6 rounded-2xl bg-card border border-border hover:border-destructive/50 transition-all active:scale-95"
          >
            <Mic className="h-8 w-8 text-destructive" />
            <span className="text-sm font-semibold">Voice</span>
          </button>
          <button
            onClick={openCamera}
            className="flex flex-col items-center gap-2 p-6 rounded-2xl bg-card border border-border hover:border-accent/50 transition-all active:scale-95"
          >
            <Camera className="h-8 w-8 text-accent" />
            <span className="text-sm font-semibold">Photo</span>
          </button>
        </div>
      )}

      {/* Text capture mode */}
      {activeMode === "text" && (
        <Card className="border-primary/30">
          <CardContent className="p-4 space-y-3">
            <Input
              placeholder="Title (optional)"
              value={textTitle}
              onChange={(e) => setTextTitle(e.target.value)}
              className="font-semibold"
            />
            <Textarea
              placeholder="Jot your thought, insight, or idea..."
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              className="min-h-[120px] resize-none"
              autoFocus
            />
            <div className="flex gap-2">
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() => { setActiveMode(null); setTextContent(""); setTextTitle(""); }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 gap-2"
                onClick={handleTextSubmit}
                disabled={!textContent.trim() || addCapture.isPending}
              >
                <Send className="h-4 w-4" />
                Queue
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Voice capture mode */}
      {activeMode === "voice" && (
        <Card className="border-destructive/30">
          <CardContent className="p-6 flex flex-col items-center gap-4">
            <div className={cn(
              "h-24 w-24 rounded-full flex items-center justify-center transition-all",
              isRecording ? "bg-destructive/20 animate-pulse" : "bg-muted"
            )}>
              {isRecording ? (
                <MicOff className="h-10 w-10 text-destructive" />
              ) : (
                <Mic className="h-10 w-10 text-muted-foreground" />
              )}
            </div>
            <span className="text-3xl font-mono font-bold tabular-nums">
              {formatDuration(recordingDuration)}
            </span>
            <div className="flex gap-2 w-full">
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() => {
                  stopRecording();
                  setActiveMode(null);
                  setRecordingDuration(0);
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 gap-2 bg-destructive hover:bg-destructive/90"
                onClick={handleVoiceSubmit}
                disabled={addCapture.isPending || recordingDuration < 1}
              >
                <Send className="h-4 w-4" />
                Save & Queue
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Photo capture mode */}
      {activeMode === "photo" && (
        <Card className="border-accent/30">
          <CardContent className="p-4 space-y-3">
            {!photoPreview ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full rounded-lg bg-black aspect-[4/3] object-cover"
                />
                <Button className="w-full gap-2" onClick={takePhoto}>
                  <Camera className="h-4 w-4" />
                  Take Photo
                </Button>
              </>
            ) : (
              <>
                <img src={photoPreview} alt="Captured" className="w-full rounded-lg" />
                <Input
                  placeholder="Add a note about this photo..."
                  value={photoNote}
                  onChange={(e) => setPhotoNote(e.target.value)}
                />
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileSelect}
            />
            <div className="flex gap-2">
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() => {
                  streamRef.current?.getTracks().forEach((t) => t.stop());
                  setActiveMode(null);
                  setPhotoPreview(null);
                  setPhotoBlob(null);
                  setPhotoNote("");
                }}
              >
                Cancel
              </Button>
              {photoPreview && (
                <Button
                  className="flex-1 gap-2"
                  onClick={handlePhotoSubmit}
                  disabled={addCapture.isPending}
                >
                  <Send className="h-4 w-4" />
                  Queue
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Capture queue */}
      <div>
        <h2 className="text-sm font-display font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Capture Queue ({captures.length})
        </h2>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : captures.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <StickyNote className="h-10 w-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No captures yet</p>
            <p className="text-xs mt-1">Record a voice memo, snap a photo, or jot a note</p>
          </div>
        ) : (
          <div className="space-y-2">
            {captures.map((c) => (
              <div
                key={c.id}
                className="flex items-start gap-3 p-3 rounded-xl bg-card border border-border"
              >
                <span className="text-lg mt-0.5">{typeEmoji(c.type)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold truncate">{c.title}</span>
                    <Badge variant="outline" className="flex items-center gap-1 text-[10px] shrink-0">
                      {statusIcon(c.status)}
                      {c.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{c.content}</p>
                  <span className="text-[10px] text-muted-foreground/60">
                    {new Date(c.created_at).toLocaleString()}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => deleteCapture.mutate(c.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
