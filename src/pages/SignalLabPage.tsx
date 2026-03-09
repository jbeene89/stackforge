import { useState, useMemo } from "react";
import { ExportToDialog } from "@/components/ExportToDialog";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Search, Star, ShoppingCart, CheckCircle2, X, Plus,
  Activity, Radio, Waves, Gauge, Cpu, Zap, Eye,
  ChevronRight, Download, BarChart3, Volume2, Wifi,
  Signal, ScanLine, Binary, AudioWaveform
} from "lucide-react";

interface SignalProcessor {
  id: string;
  name: string;
  description: string;
  category: "filtering" | "spectral" | "modulation" | "compression" | "detection" | "adaptive" | "imaging" | "codec";
  algorithm: string;
  complexity: string;
  sampleRates: string[];
  latency: string;
  precision: string;
  parameters: { name: string; range: string; default: string }[];
  tags: string[];
  rating: number;
  downloads: number;
  applications: string[];
  implementation: string;
}

const processorCatalog: SignalProcessor[] = [
  // Filtering
  {
    id: "sp-01", name: "Butterworth IIR Filter Bank", description: "Maximally-flat magnitude response IIR filter. Configurable as lowpass, highpass, bandpass, or bandstop. Cascaded biquad sections for numerical stability.",
    category: "filtering", algorithm: "Cascaded Biquad (SOS)", complexity: "O(n) per sample", sampleRates: ["8kHz", "44.1kHz", "48kHz", "96kHz", "192kHz"],
    latency: "2 samples group delay (2nd order)", precision: "64-bit double",
    parameters: [
      { name: "Order", range: "1–16", default: "4" }, { name: "Cutoff (Hz)", range: "1–Nyquist", default: "1000" },
      { name: "Type", range: "LP/HP/BP/BS", default: "LP" }, { name: "Gain (dB)", range: "-60–+20", default: "0" }
    ],
    tags: ["iir", "lowpass", "highpass", "real-time"], rating: 4.9, downloads: 78000, applications: ["Audio equalization", "Sensor noise removal", "Anti-aliasing", "Biomedical signal conditioning"],
    implementation: "WASM + SIMD"
  },
  {
    id: "sp-02", name: "FIR Windowed-Sinc Designer", description: "Arbitrary FIR filter design using windowed-sinc method. Supports Kaiser, Hamming, Blackman-Harris windows with automatic order estimation from transition bandwidth.",
    category: "filtering", algorithm: "Windowed Sinc + Window Functions", complexity: "O(N) per sample, O(N log N) via FFT overlap-add", sampleRates: ["Any"],
    latency: "N/2 samples (linear phase)", precision: "32/64-bit float",
    parameters: [
      { name: "Taps", range: "3–4096", default: "127" }, { name: "Window", range: "Kaiser/Hamming/Blackman/Hann", default: "Kaiser" },
      { name: "Beta (Kaiser)", range: "0–14", default: "5.6" }, { name: "Transition BW (Hz)", range: "1–Fs/4", default: "100" }
    ],
    tags: ["fir", "linear-phase", "design"], rating: 4.7, downloads: 52000, applications: ["Precision measurement", "Telecommunications", "Audio mastering", "Radar pulse shaping"],
    implementation: "Rust/WASM"
  },
  // Spectral
  {
    id: "sp-03", name: "STFT Spectrogram Engine", description: "Short-Time Fourier Transform with configurable window, hop size, and zero-padding. Real-time spectrogram rendering with log-frequency and mel-scale options.",
    category: "spectral", algorithm: "Radix-2/4 FFT + Window", complexity: "O(N log N) per frame", sampleRates: ["Any"],
    latency: "1 hop length", precision: "32-bit float",
    parameters: [
      { name: "FFT Size", range: "64–16384", default: "2048" }, { name: "Hop Size", range: "1–FFT/1", default: "512" },
      { name: "Window", range: "Hann/Hamming/Blackman", default: "Hann" }, { name: "Scale", range: "Linear/Log/Mel", default: "Mel" }
    ],
    tags: ["fft", "spectrogram", "frequency"], rating: 4.8, downloads: 96000, applications: ["Music analysis", "Speech recognition preprocessing", "Vibration monitoring", "Sonar processing"],
    implementation: "WASM + Canvas/WebGL"
  },
  {
    id: "sp-04", name: "Welch PSD Estimator", description: "Power spectral density estimation via averaged modified periodograms. Overlapping segments with windowing for reduced variance. Confidence interval computation.",
    category: "spectral", algorithm: "Welch's Method", complexity: "O(K · N log N)", sampleRates: ["Any"],
    latency: "Batch (full signal)", precision: "64-bit double",
    parameters: [
      { name: "Segment Length", range: "64–65536", default: "4096" }, { name: "Overlap", range: "0–95%", default: "50%" },
      { name: "Window", range: "Hann/Kaiser/Flat-top", default: "Hann" }, { name: "Averaging", range: "Mean/Median", default: "Mean" }
    ],
    tags: ["psd", "power-spectrum", "estimation"], rating: 4.6, downloads: 41000, applications: ["Noise characterization", "Vibration analysis", "EEG frequency analysis", "Communications SNR"],
    implementation: "TypeScript + WASM FFT"
  },
  // Modulation
  {
    id: "sp-05", name: "OFDM Modem", description: "Complete OFDM modulator/demodulator with cyclic prefix, pilot insertion, channel estimation (LS/MMSE), and QAM mapping. Configurable subcarrier count and modulation order.",
    category: "modulation", algorithm: "IFFT/FFT + Channel Est.", complexity: "O(N log N) per symbol", sampleRates: ["Baseband configurable"],
    latency: "1 OFDM symbol + CP", precision: "32-bit complex float",
    parameters: [
      { name: "Subcarriers", range: "64–4096", default: "256" }, { name: "CP Length", range: "1/32–1/4", default: "1/8" },
      { name: "Modulation", range: "BPSK/QPSK/16QAM/64QAM/256QAM", default: "16QAM" }, { name: "Pilot Spacing", range: "4–32", default: "8" }
    ],
    tags: ["ofdm", "5g", "wifi", "lte"], rating: 4.8, downloads: 34000, applications: ["5G NR simulation", "WiFi 6/7 prototyping", "DVB-T2 emulation", "Underwater acoustic comms"],
    implementation: "C++/WASM"
  },
  {
    id: "sp-06", name: "PSK/QAM Universal Mapper", description: "Flexible digital modulation mapper supporting BPSK through 1024-QAM. Gray coding, constellation shaping, soft-decision LLR output for turbo/LDPC decoders.",
    category: "modulation", algorithm: "Constellation Mapping + LLR", complexity: "O(M) per symbol (soft)", sampleRates: ["Symbol-rate"],
    latency: "1 symbol", precision: "32-bit float",
    parameters: [
      { name: "Scheme", range: "BPSK/QPSK/8PSK/16QAM–1024QAM", default: "QPSK" }, { name: "Coding", range: "Gray/Natural", default: "Gray" },
      { name: "Output", range: "Hard/Soft-LLR", default: "Soft-LLR" }, { name: "Noise Variance", range: "Auto/Manual", default: "Auto" }
    ],
    tags: ["qam", "psk", "constellation", "llr"], rating: 4.5, downloads: 22000, applications: ["Modem design", "BER simulation", "Channel coding research", "SDR applications"],
    implementation: "TypeScript"
  },
  // Compression
  {
    id: "sp-07", name: "Opus Codec Engine", description: "Full Opus encoder/decoder implementation. Seamlessly blends SILK (speech) and CELT (music) codecs. VBR/CBR modes, FEC, DTX for bandwidth-efficient real-time audio.",
    category: "codec", algorithm: "SILK + CELT Hybrid", complexity: "O(N) encode", sampleRates: ["8kHz", "12kHz", "16kHz", "24kHz", "48kHz"],
    latency: "5–60ms (configurable)", precision: "16-bit PCM",
    parameters: [
      { name: "Bitrate", range: "6–510 kbps", default: "64 kbps" }, { name: "Frame Size", range: "2.5–60ms", default: "20ms" },
      { name: "Mode", range: "VBR/CBR/CVBR", default: "VBR" }, { name: "Application", range: "VOIP/Audio/LowDelay", default: "Audio" }
    ],
    tags: ["opus", "audio", "voip", "compression"], rating: 4.9, downloads: 156000, applications: ["VoIP systems", "Game voice chat", "Music streaming", "Broadcast contribution"],
    implementation: "C/WASM (libopus)"
  },
  // Detection
  {
    id: "sp-08", name: "CFAR Detector", description: "Constant False Alarm Rate detector for radar/sonar. Cell-averaging (CA), greatest-of (GO), and ordered-statistic (OS) variants. Adaptive threshold in non-stationary noise.",
    category: "detection", algorithm: "CA-CFAR / GO-CFAR / OS-CFAR", complexity: "O(N·W) per range bin", sampleRates: ["Any"],
    latency: "1 CPI", precision: "32/64-bit float",
    parameters: [
      { name: "Guard Cells", range: "1–16", default: "4" }, { name: "Training Cells", range: "4–64", default: "16" },
      { name: "PFA", range: "1e-2–1e-8", default: "1e-6" }, { name: "Variant", range: "CA/GO/SO/OS", default: "CA" }
    ],
    tags: ["radar", "detection", "cfar", "sonar"], rating: 4.7, downloads: 18000, applications: ["Air traffic control radar", "Marine navigation", "Automotive radar", "Ground penetrating radar"],
    implementation: "Rust/WASM"
  },
  // Adaptive
  {
    id: "sp-09", name: "LMS/RLS Adaptive Filter", description: "Dual-mode adaptive filter: LMS for low-complexity and RLS for fast convergence. Applications include echo cancellation, noise reduction, and system identification.",
    category: "adaptive", algorithm: "NLMS + RLS", complexity: "O(N) LMS / O(N²) RLS", sampleRates: ["Any"],
    latency: "1 sample", precision: "64-bit double",
    parameters: [
      { name: "Filter Length", range: "16–2048", default: "256" }, { name: "Step Size (μ)", range: "0.001–2.0", default: "0.1" },
      { name: "Algorithm", range: "LMS/NLMS/RLS", default: "NLMS" }, { name: "Forgetting Factor (λ)", range: "0.9–1.0", default: "0.999" }
    ],
    tags: ["adaptive", "echo-cancel", "noise-cancel"], rating: 4.6, downloads: 29000, applications: ["Echo cancellation", "Active noise control", "Channel equalization", "Beamforming"],
    implementation: "WASM"
  },
  // Imaging
  {
    id: "sp-10", name: "SAR Image Processor", description: "Synthetic Aperture Radar image formation. Range-Doppler and Omega-K algorithms with motion compensation, autofocus (PGA), and multi-look processing.",
    category: "imaging", algorithm: "Range-Doppler / Omega-K + PGA", complexity: "O(N² log N)", sampleRates: ["Radar PRF"],
    latency: "Batch (aperture time)", precision: "32-bit complex",
    parameters: [
      { name: "Algorithm", range: "RDA/CSA/ωK", default: "RDA" }, { name: "Looks (azimuth)", range: "1–16", default: "4" },
      { name: "Window", range: "Hamming/Taylor/None", default: "Taylor" }, { name: "Autofocus", range: "PGA/MDA/None", default: "PGA" }
    ],
    tags: ["sar", "radar", "imaging", "remote-sensing"], rating: 4.8, downloads: 12000, applications: ["Earth observation", "Terrain mapping", "Oil spill detection", "Deformation monitoring"],
    implementation: "C++/WASM + WebGL"
  },
];

const categoryLabels: Record<string, string> = {
  filtering: "Filtering", spectral: "Spectral Analysis", modulation: "Modulation",
  compression: "Compression", detection: "Detection", adaptive: "Adaptive",
  imaging: "Imaging", codec: "Codecs",
};

export default function SignalLabPage() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [cart, setCart] = useState<string[]>([]);
  const [selected, setSelected] = useState<SignalProcessor | null>(null);

  const filtered = processorCatalog.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase()) || p.tags.some(t => t.includes(search.toLowerCase()));
    const matchTab = activeTab === "all" || p.category === activeTab;
    return matchSearch && matchTab;
  });

  const toggleCart = (id: string) => {
    setCart(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    const p = processorCatalog.find(x => x.id === id);
    if (p && !cart.includes(id)) toast.success(`${p.name} added to workspace`);
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="p-4 sm:p-6 pb-0 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Signal Lab</h1>
              <p className="text-sm text-muted-foreground">{processorCatalog.length} DSP processors — filtering, spectral, modulation, detection & more</p>
            </div>
            <div className="flex items-center gap-2">
              <ExportToDialog context="signals" projectName="Signal Lab" />
              <Badge variant="outline" className="gap-1"><ShoppingCart className="h-3 w-3" />{cart.length}</Badge>
              {cart.length > 0 && (
                <Button size="sm" onClick={() => { toast.success(`${cart.length} processors deployed`); setCart([]); }}>
                  <Download className="h-3 w-3 mr-1" /> Deploy All
                </Button>
              )}
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search processors, algorithms, tags…" className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col p-6 pt-4">
          <TabsList className="flex flex-wrap h-auto gap-1 bg-transparent p-0 justify-start">
            <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs">All</TabsTrigger>
            {Object.entries(categoryLabels).map(([k, v]) => (
              <TabsTrigger key={k} value={k} className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs">{v}</TabsTrigger>
            ))}
          </TabsList>

          <ScrollArea className="flex-1 mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <AnimatePresence mode="popLayout" initial={false}>
                {filtered.map(p => {
                  const inCart = cart.includes(p.id);
                  return (
                    <motion.div key={p.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }}
                      className={cn("border rounded-lg p-4 cursor-pointer transition-colors hover:bg-accent/10", selected?.id === p.id && "ring-2 ring-primary")}
                      onClick={() => setSelected(p)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-sm truncate">{p.name}</h3>
                            <Badge variant="secondary" className="text-[10px] shrink-0">{p.complexity}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{p.description}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <Badge variant="outline" className="text-[10px]">{p.algorithm.split("+")[0].trim()}</Badge>
                            <span className="text-[10px] text-muted-foreground">{p.implementation}</span>
                            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><Star className="h-2.5 w-2.5 fill-current text-yellow-500" />{p.rating}</span>
                          </div>
                        </div>
                        <Button size="icon" variant={inCart ? "default" : "outline"} className="h-7 w-7 shrink-0" onClick={e => { e.stopPropagation(); toggleCart(p.id); }}>
                          {inCart ? <CheckCircle2 className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </ScrollArea>
        </Tabs>
      </div>

      {/* Detail panel */}
      <AnimatePresence>
        {selected && (
          <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 400, opacity: 1 }} exit={{ width: 0, opacity: 0 }} className="border-l bg-card overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-6 space-y-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-bold">{selected.name}</h2>
                    <Badge className="mt-1">{categoryLabels[selected.category]}</Badge>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => setSelected(null)}><X className="h-4 w-4" /></Button>
                </div>
                <p className="text-sm text-muted-foreground">{selected.description}</p>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { l: "Algorithm", v: selected.algorithm },
                    { l: "Complexity", v: selected.complexity },
                    { l: "Latency", v: selected.latency },
                    { l: "Precision", v: selected.precision },
                    { l: "Implementation", v: selected.implementation },
                    { l: "Sample Rates", v: selected.sampleRates.join(", ") },
                  ].map(({ l, v }) => (
                    <div key={l} className="p-2 rounded-md bg-muted/50">
                      <div className="text-[10px] text-muted-foreground">{l}</div>
                      <div className="text-xs font-medium mt-0.5">{v}</div>
                    </div>
                  ))}
                </div>

                <Separator />
                <div>
                  <h4 className="text-xs font-semibold mb-2">Parameters</h4>
                  <div className="space-y-2">
                    {selected.parameters.map(p => (
                      <div key={p.name} className="p-2 rounded-md bg-muted/30">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium">{p.name}</span>
                          <Badge variant="outline" className="text-[9px]">{p.default}</Badge>
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">Range: {p.range}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />
                <div>
                  <h4 className="text-xs font-semibold mb-2">Applications</h4>
                  <ul className="space-y-1">{selected.applications.map(a => (
                    <li key={a} className="text-xs text-muted-foreground flex items-center gap-1"><ChevronRight className="h-3 w-3 text-primary" />{a}</li>
                  ))}</ul>
                </div>

                <Separator />
                <div className="flex gap-2">
                  <Button className="flex-1" onClick={() => toggleCart(selected.id)}>
                    {cart.includes(selected.id) ? <><CheckCircle2 className="h-3 w-3 mr-1" />In Workspace</> : <><Plus className="h-3 w-3 mr-1" />Add to Workspace</>}
                  </Button>
                  <Button variant="outline" onClick={() => toast.info("Signal processor docs opened")}>
                    <Eye className="h-3 w-3 mr-1" /> Docs
                  </Button>
                </div>
              </div>
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
