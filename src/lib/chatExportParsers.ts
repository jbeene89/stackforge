// Parsers for chat export files from major AI providers
// Each returns an array of { title, messages: string } ready for the pipeline

export interface ParsedConversation {
  title: string;
  text: string; // flattened conversation text
  messageCount: number;
}

export type Provider = "openai" | "anthropic" | "xai" | "google";

export const PROVIDER_INFO: Record<Provider, { label: string; emoji: string; color: string; exportGuide: string; acceptedFiles: string }> = {
  openai: {
    label: "ChatGPT / OpenAI",
    emoji: "🟢",
    color: "text-emerald-400",
    exportGuide: "Settings → Data Controls → Export Data → Download",
    acceptedFiles: "conversations.json",
  },
  anthropic: {
    label: "Claude / Anthropic",
    emoji: "🟠",
    color: "text-orange-400",
    exportGuide: "Settings → Account → Export Data",
    acceptedFiles: ".json export file",
  },
  xai: {
    label: "Grok / xAI",
    emoji: "⚡",
    color: "text-blue-400",
    exportGuide: "Settings → Data → Export conversations",
    acceptedFiles: ".json export file",
  },
  google: {
    label: "Gemini / Google AI",
    emoji: "🔵",
    color: "text-sky-400",
    exportGuide: "Google Takeout → Gemini Apps → Download",
    acceptedFiles: ".json export file",
  },
};

function flattenMessages(messages: Array<{ role?: string; author?: string; content?: any }>): string {
  return messages
    .map(m => {
      const role = m.role || m.author || "unknown";
      let content = "";
      if (typeof m.content === "string") {
        content = m.content;
      } else if (Array.isArray(m.content)) {
        content = m.content
          .map((part: any) => (typeof part === "string" ? part : part?.text || part?.value || ""))
          .filter(Boolean)
          .join("\n");
      } else if (m.content?.parts) {
        content = m.content.parts.filter((p: any) => typeof p === "string").join("\n");
      }
      if (!content.trim()) return "";
      return `[${role.toUpperCase()}]: ${content.trim()}`;
    })
    .filter(Boolean)
    .join("\n\n");
}

// ── OpenAI (conversations.json) ──
export function parseOpenAI(raw: any): ParsedConversation[] {
  const conversations: ParsedConversation[] = [];
  const data = Array.isArray(raw) ? raw : [raw];

  for (const conv of data) {
    try {
      const title = conv.title || "Untitled Chat";
      let messages: Array<{ role: string; content: string }> = [];

      if (conv.mapping) {
        // Standard ChatGPT export format with mapping tree
        const nodes = Object.values(conv.mapping) as any[];
        const sorted = nodes
          .filter((n: any) => n.message?.content?.parts?.length > 0)
          .sort((a: any, b: any) => (a.message?.create_time || 0) - (b.message?.create_time || 0));

        messages = sorted.map((n: any) => ({
          role: n.message.author?.role || "unknown",
          content: n.message.content.parts.filter((p: any) => typeof p === "string").join("\n"),
        }));
      } else if (conv.messages) {
        messages = conv.messages;
      }

      if (messages.length < 2) continue;

      const text = flattenMessages(messages);
      if (text.length < 100) continue;

      conversations.push({ title, text, messageCount: messages.length });
    } catch {
      continue;
    }
  }
  return conversations;
}

// ── Anthropic (Claude export) ──
function extractAnthropicContent(m: any): string {
  // Handle plain text field
  if (typeof m.text === "string" && m.text.trim()) return m.text;
  // Handle content as array of parts (newer Claude format)
  if (Array.isArray(m.content)) {
    return m.content
      .map((c: any) => {
        if (typeof c === "string") return c;
        if (c?.type === "text" && typeof c.text === "string") return c.text;
        return c?.text || c?.value || "";
      })
      .filter(Boolean)
      .join("\n");
  }
  // Handle content as string
  if (typeof m.content === "string") return m.content;
  // Handle message field
  if (typeof m.message === "string") return m.message;
  return "";
}

export function parseAnthropic(raw: any): ParsedConversation[] {
  const conversations: ParsedConversation[] = [];

  // Try multiple top-level shapes: array, or object with various keys
  let data: any[];
  if (Array.isArray(raw)) {
    data = raw;
  } else {
    // Try every known wrapper key
    const found = raw.conversations || raw.chats || raw.chat_conversations || raw.data || raw.items;
    data = found ? (Array.isArray(found) ? found : [found]) : [raw];
  }

  for (const conv of data) {
    try {
      const title = conv.name || conv.title || conv.uuid?.slice(0, 8) || conv.conversation_id?.slice(0, 8) || "Untitled";
      const messages = conv.chat_messages || conv.messages || conv.turns || conv.history || [];

      if (messages.length < 1) continue;

      const formatted = messages.map((m: any) => {
        let role = m.sender || m.role || m.author || "unknown";
        if (role === "human") role = "user";
        return { role, content: extractAnthropicContent(m) };
      }).filter((m: any) => m.content.trim().length > 0);

      if (formatted.length < 1) continue;

      const text = flattenMessages(formatted);
      if (text.length < 20) continue;

      conversations.push({ title, text, messageCount: formatted.length });
    } catch {
      continue;
    }
  }
  return conversations;
}

// ── xAI / Grok ──
export function parseXAI(raw: any): ParsedConversation[] {
  const conversations: ParsedConversation[] = [];
  const data = Array.isArray(raw) ? raw : raw.conversations || raw.chats || [raw];

  for (const conv of data) {
    try {
      const title = conv.title || conv.name || "Grok Chat";
      const messages = conv.messages || conv.turns || [];

      if (messages.length < 2) continue;

      const formatted = messages.map((m: any) => ({
        role: m.role || m.sender || m.author || "unknown",
        content: typeof m.content === "string" ? m.content : m.text || m.message || "",
      }));

      const text = flattenMessages(formatted);
      if (text.length < 100) continue;

      conversations.push({ title, text, messageCount: messages.length });
    } catch {
      continue;
    }
  }
  return conversations;
}

// ── Google AI / Gemini (Takeout format) ──
export function parseGoogleAI(raw: any): ParsedConversation[] {
  const conversations: ParsedConversation[] = [];
  const data = Array.isArray(raw) ? raw : raw.conversations || [raw];

  for (const conv of data) {
    try {
      const title = conv.title || conv.name || "Gemini Chat";
      const messages = conv.messages || conv.turns || conv.entries || [];

      if (messages.length < 2) continue;

      const formatted = messages.map((m: any) => {
        let role = m.role || m.author || "unknown";
        if (role === "model" || role === "MODEL") role = "assistant";
        let content = "";
        if (typeof m.content === "string") content = m.content;
        else if (m.text) content = m.text;
        else if (m.parts) content = m.parts.map((p: any) => p.text || "").join("\n");
        else if (Array.isArray(m.content)) content = m.content.map((c: any) => c.text || c).join("\n");
        return { role, content };
      });

      const text = flattenMessages(formatted);
      if (text.length < 100) continue;

      conversations.push({ title, text, messageCount: messages.length });
    } catch {
      continue;
    }
  }
  return conversations;
}

export function parseExport(provider: Provider, raw: any): ParsedConversation[] {
  switch (provider) {
    case "openai": return parseOpenAI(raw);
    case "anthropic": return parseAnthropic(raw);
    case "xai": return parseXAI(raw);
    case "google": return parseGoogleAI(raw);
    default: return [];
  }
}
