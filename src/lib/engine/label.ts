/** The small "label card" that travels with a SoupyLab model file. */
export interface SoupyModelLabel {
  format: "soupylab-model/1";
  name: string;
  file: string;
  baseModel?: string;
  systemPrompt?: string;
  temperature?: number;
  createdAt: string;
}

export function modelSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "my-model";
}

export function buildModelLabel(input: { name: string; baseModel?: string; systemPrompt?: string; temperature?: number }): SoupyModelLabel {
  const slug = modelSlug(input.name);
  return {
    format: "soupylab-model/1",
    name: input.name,
    file: `${slug}.Q4_K_M.gguf`,
    baseModel: input.baseModel,
    systemPrompt: input.systemPrompt?.trim() || undefined,
    temperature: input.temperature,
    createdAt: new Date().toISOString(),
  };
}

/** Returns null for anything that is not a valid label card. */
export function parseModelLabel(text: string): SoupyModelLabel | null {
  try {
    const raw = JSON.parse(text);
    if (raw?.format !== "soupylab-model/1" || typeof raw.name !== "string" || !raw.name.trim()) return null;
    return {
      format: raw.format,
      name: raw.name.slice(0, 120),
      file: typeof raw.file === "string" ? raw.file : "",
      baseModel: typeof raw.baseModel === "string" ? raw.baseModel : undefined,
      systemPrompt: typeof raw.systemPrompt === "string" ? raw.systemPrompt.slice(0, 8000) : undefined,
      temperature: typeof raw.temperature === "number" && raw.temperature >= 0 && raw.temperature <= 2 ? raw.temperature : undefined,
      createdAt: typeof raw.createdAt === "string" ? raw.createdAt : new Date().toISOString(),
    };
  } catch { return null; }
}

export function buildModelfile(label: SoupyModelLabel): string {
  const prompt = (label.systemPrompt || "").replace(/"""/g, '"');
  return `# SoupyLab model — ${label.name}
# Import with: ollama create ${modelSlug(label.name)} -f Modelfile
FROM ./${label.file}
${prompt ? `\nSYSTEM """${prompt}"""\n` : ""}
PARAMETER temperature ${label.temperature ?? 0.4}
PARAMETER num_ctx 2048
`;
}

/** Sort split parts (name-00001-of-00003.gguf) into load order. */
export function sortModelParts<T extends { name: string }>(files: T[]): T[] {
  return [...files].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
}
