import { motion } from "framer-motion";
import { Shield, ShieldAlert, ShieldCheck, Cpu, Zap, BarChart3, Download, Search } from "lucide-react";
import type { ActionCardData } from "./types";

interface Props {
  data: ActionCardData;
}

export function ActionCard({ data }: Props) {
  switch (data.kind) {
    case "model-info":
      return <ModelInfoCard {...data.payload} />;
    case "bench-result":
      return <BenchResultCard {...data.payload} />;
    case "guardrail-report":
      return <GuardrailReportCard {...data.payload} />;
    case "pull-progress":
      return <PullProgressCard {...data.payload} />;
    case "scan-result":
      return <ScanResultCard {...data.payload} />;
    default:
      return null;
  }
}

function ModelInfoCard(p: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="my-2 rounded-lg border border-[hsl(185,70%,45%)]/20 bg-[hsl(222,30%,8%)]/80 p-3 max-w-md"
    >
      <div className="flex items-center gap-2 mb-2">
        <Cpu className="h-4 w-4 text-[hsl(185,70%,45%)]" />
        <span className="font-semibold text-[hsl(185,70%,55%)]">{p.name}</span>
      </div>
      <div className="grid grid-cols-2 gap-1 text-[10px]">
        {p.format && <Stat label="Format" value={p.format} />}
        {p.family && <Stat label="Family" value={p.family} />}
        {p.parameters && <Stat label="Parameters" value={p.parameters} />}
        {p.quantization && <Stat label="Quantization" value={p.quantization} />}
      </div>
    </motion.div>
  );
}

function BenchResultCard(p: any) {
  const models = p.results || [];
  const winner = models.length >= 2
    ? (models[0].tokPerSec > models[1].tokPerSec ? 0 : 1)
    : -1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="my-2 rounded-lg border border-[hsl(45,90%,55%)]/20 bg-[hsl(222,30%,8%)]/80 p-3 max-w-lg"
    >
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 className="h-4 w-4 text-[hsl(45,90%,55%)]" />
        <span className="font-semibold text-[hsl(45,90%,65%)]">Benchmark Results</span>
        <span className="text-[10px] text-[hsl(210,15%,50%)] ml-auto">"{p.prompt}"</span>
      </div>
      <div className="space-y-2">
        {models.map((m: any, i: number) => (
          <div key={i} className={`rounded-md p-2 ${i === winner ? 'bg-[hsl(155,65%,42%)]/10 border border-[hsl(155,65%,42%)]/30' : 'bg-[hsl(222,25%,12%)]/50'}`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-[hsl(210,30%,88%)]">
                {i === winner && "🏆 "}{m.name}
              </span>
              <span className="text-[10px] text-[hsl(155,65%,52%)]">{m.tokPerSec} tok/s</span>
            </div>
            <div className="flex gap-3 text-[10px] text-[hsl(210,15%,50%)]">
              <span>⏱ {m.latency}s</span>
              <span>📝 {m.tokens} tokens</span>
              <span>📊 {m.size}</span>
            </div>
            {/* Speed bar */}
            <div className="mt-1.5 h-1 rounded-full bg-[hsl(222,25%,15%)] overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((m.tokPerSec / Math.max(...models.map((x: any) => x.tokPerSec))) * 100, 100)}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className={`h-full rounded-full ${i === winner ? 'bg-[hsl(155,65%,42%)]' : 'bg-[hsl(210,15%,40%)]'}`}
              />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function GuardrailReportCard(p: any) {
  const tests = p.tests || [];
  const passed = tests.filter((t: any) => t.passed).length;
  const total = tests.length;
  const allPassed = passed === total;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`my-2 rounded-lg border p-3 max-w-md ${allPassed ? 'border-[hsl(155,65%,42%)]/30 bg-[hsl(155,65%,42%)]/5' : 'border-[hsl(340,75%,55%)]/30 bg-[hsl(340,75%,55%)]/5'}`}
    >
      <div className="flex items-center gap-2 mb-2">
        {allPassed ? <ShieldCheck className="h-4 w-4 text-[hsl(155,65%,52%)]" /> : <ShieldAlert className="h-4 w-4 text-[hsl(340,75%,55%)]" />}
        <span className={`font-semibold ${allPassed ? 'text-[hsl(155,65%,52%)]' : 'text-[hsl(340,75%,55%)]'}`}>
          Safety Report — {p.model}
        </span>
        <span className="ml-auto text-xs font-mono">{passed}/{total}</span>
      </div>
      <div className="grid grid-cols-2 gap-1">
        {tests.map((t: any, i: number) => (
          <div key={i} className="flex items-center gap-1.5 text-[10px]">
            <span>{t.passed ? '✅' : '❌'}</span>
            <span className={t.passed ? 'text-[hsl(210,15%,50%)]' : 'text-[hsl(340,75%,55%)]'}>{t.name}</span>
          </div>
        ))}
      </div>
      {!allPassed && (
        <div className="mt-2 text-[10px] text-[hsl(340,75%,65%)] border-t border-[hsl(340,75%,55%)]/20 pt-1.5">
          ⚠ Weak guardrails detected. Consider untraining flagged behaviors.
        </div>
      )}
    </motion.div>
  );
}

function PullProgressCard(p: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="my-2 rounded-lg border border-[hsl(210,85%,55%)]/20 bg-[hsl(222,30%,8%)]/80 p-3 max-w-sm"
    >
      <div className="flex items-center gap-2 mb-2">
        <Download className="h-4 w-4 text-[hsl(210,85%,55%)]" />
        <span className="text-xs font-medium text-[hsl(210,30%,88%)]">{p.model}</span>
        <span className={`text-[10px] ml-auto ${p.success ? 'text-[hsl(155,65%,52%)]' : 'text-[hsl(340,75%,55%)]'}`}>
          {p.success ? '✓ Complete' : '✗ Failed'}
        </span>
      </div>
      {p.success && (
        <div className="h-1.5 rounded-full bg-[hsl(222,25%,15%)] overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="h-full rounded-full bg-[hsl(155,65%,42%)]"
          />
        </div>
      )}
    </motion.div>
  );
}

function ScanResultCard(p: any) {
  const models = p.models || [];
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="my-2 rounded-lg border border-[hsl(265,70%,60%)]/20 bg-[hsl(222,30%,8%)]/80 p-3 max-w-md"
    >
      <div className="flex items-center gap-2 mb-2">
        <Search className="h-4 w-4 text-[hsl(265,70%,60%)]" />
        <span className="font-semibold text-[hsl(265,70%,70%)]">{models.length} Model{models.length !== 1 ? 's' : ''} Found</span>
      </div>
      <div className="space-y-1">
        {models.map((m: any, i: number) => (
          <div key={i} className="flex items-center justify-between text-[11px] py-0.5">
            <div className="flex items-center gap-1.5">
              <span className="text-[hsl(210,30%,88%)]">{m.name}</span>
              {m.fresh && <span className="px-1 rounded text-[9px] bg-[hsl(155,65%,42%)]/20 text-[hsl(155,65%,52%)]">NEW</span>}
            </div>
            <span className="text-[hsl(210,15%,50%)]">{m.size} · {m.age}d</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-0.5 px-1 rounded bg-[hsl(222,25%,12%)]/50">
      <span className="text-[hsl(210,15%,50%)]">{label}</span>
      <span className="text-[hsl(210,30%,88%)] font-medium">{value}</span>
    </div>
  );
}
