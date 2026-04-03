/**
 * Centralized AI gateway client.
 * Standardizes model selection, error handling, and rate limit responses.
 */

const AI_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const DEFAULT_MODEL = "google/gemini-3-flash-preview";

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AICallOptions {
  messages: AIMessage[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  tools?: unknown[];
  tool_choice?: unknown;
}

export interface AIResponse {
  content: string;
  toolCalls?: Array<{ function: { name: string; arguments: string } }>;
  raw: unknown;
}

/**
 * Call the AI gateway. Returns the parsed response.
 * Throws descriptive errors for rate limits and credit issues.
 */
export async function callAI(options: AICallOptions): Promise<AIResponse> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) throw new Error("AI not configured");

  const { messages, model = DEFAULT_MODEL, temperature, max_tokens, tools, tool_choice } = options;

  const body: Record<string, unknown> = {
    model,
    messages,
    stream: false,
  };
  if (temperature !== undefined) body.temperature = temperature;
  if (max_tokens !== undefined) body.max_tokens = max_tokens;
  if (tools) body.tools = tools;
  if (tool_choice) body.tool_choice = tool_choice;

  const res = await fetch(AI_GATEWAY_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errBody = await res.text();
    console.error("AI gateway error:", res.status, errBody);
    if (res.status === 429) throw new Error("Rate limited");
    if (res.status === 402) throw new Error("Credits exhausted");
    throw new Error("AI service unavailable");
  }

  const data = await res.json();
  const choice = data.choices?.[0];

  return {
    content: choice?.message?.content?.trim() || "",
    toolCalls: choice?.message?.tool_calls,
    raw: data,
  };
}

/**
 * Call the AI gateway with streaming enabled. Returns the raw Response
 * for proxying to the client.
 */
export async function callAIStream(options: Omit<AICallOptions, "stream">): Promise<Response> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) throw new Error("AI not configured");

  const { messages, model = DEFAULT_MODEL, temperature, max_tokens } = options;

  const body: Record<string, unknown> = {
    model,
    messages,
    stream: true,
  };
  if (temperature !== undefined) body.temperature = temperature;
  if (max_tokens !== undefined) body.max_tokens = max_tokens;

  const res = await fetch(AI_GATEWAY_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errBody = await res.text();
    console.error("AI gateway streaming error:", res.status, errBody);
    if (res.status === 429) throw new Error("Rate limited");
    if (res.status === 402) throw new Error("Credits exhausted");
    throw new Error("AI service unavailable");
  }

  return res;
}

/**
 * Parse JSON from AI text response, handling markdown code fences.
 */
export function parseAIJson<T = unknown>(text: string): T | null {
  try {
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
  } catch {
    return null;
  }
}

/**
 * Parse tool call arguments from AI response.
 */
export function parseToolCallArgs<T = unknown>(response: AIResponse): T | null {
  const toolCall = response.toolCalls?.[0];
  if (!toolCall?.function?.arguments) return null;
  try {
    return JSON.parse(toolCall.function.arguments);
  } catch {
    return null;
  }
}
