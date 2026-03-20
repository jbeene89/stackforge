export interface TerminalLine {
  id: number;
  type: "input" | "output" | "error" | "system" | "card";
  content: string;
  timestamp: Date;
  cardData?: ActionCardData;
}

export interface ActionCardData {
  kind: "model-info" | "bench-result" | "guardrail-report" | "pull-progress" | "scan-result";
  payload: Record<string, any>;
}

export type AddOutput = (content: string, type?: TerminalLine["type"], cardData?: ActionCardData) => void;
export type CmdHandler = (args: string[], addOutput: AddOutput, streamLine?: StreamLine) => Promise<void>;

export type StreamLine = (id: number, content: string) => void;

export interface TerminalTheme {
  name: string;
  bg: string;
  text: string;
  prompt: string;
  input: string;
  output: string;
  error: string;
  system: string;
  accent: string;
  border: string;
  selection: string;
}
