import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

type ChatHistoryMessage = {
  role: "user" | "model";
  parts: [{ text: string }];
};

type ChatCompletionsFunctionTool = {
  type: "function";
  function: {
    name: string;
    description?: string;
    parameters?: Record<string, unknown>;
  };
};

type ResponsesFunctionTool = {
  type: "function";
  name: string;
  description?: string;
  parameters: Record<string, unknown> | null;
  strict: boolean;
};

type RequestBody = {
  history: ChatHistoryMessage[];
  systemPrompt: string;
  toolsEnabled: boolean;
  forcedTool?: string | null;
  tools?: ChatCompletionsFunctionTool[] | ResponsesFunctionTool[];
  model?: string;
};

/** Match ChatGPT chat defaults (omit temperature; medium reasoning). */
const CHAT_LIKE = {
  reasoningEffort: "medium",
  maxOutputTokensTools: 32768,
  maxOutputTokensChat: 8192,
} as const;

function toOpenAiMessages(
  history: ChatHistoryMessage[]
): Array<{ role: "user" | "assistant"; content: string }> {
  return history.map((m) => ({
    role: m.role === "model" ? "assistant" : "user",
    content: m.parts.map((p) => p.text).join("\n"),
  }));
}

function toResponsesTools(
  tools: ChatCompletionsFunctionTool[] | ResponsesFunctionTool[] | undefined
): ResponsesFunctionTool[] {
  if (!Array.isArray(tools)) return [];
  return tools.map((t) => {
    if ("function" in t && t.function) {
      return {
        type: "function" as const,
        name: t.function.name,
        description: t.function.description,
        parameters: (t.function.parameters ?? null) as Record<string, unknown> | null,
        strict: false,
      };
    }
    const flat = t as ResponsesFunctionTool;
    return {
      type: "function" as const,
      name: flat.name,
      description: flat.description,
      parameters: flat.parameters ?? null,
      strict: flat.strict ?? false,
    };
  });
}

async function callOpenAi(params: {
  apiKey: string;
  model: string;
  systemPrompt: string;
  history: ChatHistoryMessage[];
  toolsEnabled: boolean;
  forcedTool?: string | null;
  tools?: ChatCompletionsFunctionTool[] | ResponsesFunctionTool[];
}): Promise<
  | { type: "text"; text: string }
  | { type: "functionCall"; name: string; args: Record<string, unknown> }
  | { type: "error"; error: string }
> {
  const { apiKey, model, systemPrompt, history, toolsEnabled, forcedTool, tools } = params;
  const messages = toOpenAiMessages(history);

  // Tool turns: Responses API so we can keep ChatGPT-like medium reasoning.
  // Chat Completions only allows function tools with reasoning_effort "none".
  if (toolsEnabled) {
    const body: Record<string, unknown> = {
      model,
      instructions: systemPrompt,
      input: messages,
      tools: toResponsesTools(tools),
      tool_choice: forcedTool
        ? { type: "function", name: forcedTool }
        : "auto",
      reasoning: { effort: CHAT_LIKE.reasoningEffort },
      max_output_tokens: CHAT_LIKE.maxOutputTokensTools,
    };

    const res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    const payload = await res.json().catch(() => null);
    if (!res.ok) {
      return {
        type: "error",
        error: `OpenAI error: HTTP ${res.status} ${payload?.error?.message ?? ""}`.trim(),
      };
    }

    const output = Array.isArray(payload?.output) ? payload.output : [];
    for (const item of output) {
      if (item?.type !== "function_call") continue;
      const name = item?.name?.toString() ?? "";
      const rawArgs = item?.arguments?.toString() ?? "";
      if (!name) {
        return { type: "error", error: "OpenAI returned a tool call without a function name." };
      }
      try {
        const parsed = JSON.parse(rawArgs) as Record<string, unknown>;
        return { type: "functionCall", name, args: parsed };
      } catch {
        return { type: "error", error: `Could not parse tool arguments JSON for ${name}.` };
      }
    }

    const content =
      typeof payload?.output_text === "string"
        ? payload.output_text.trim()
        : "";
    if (content) return { type: "text", text: content };
    return { type: "error", error: "OpenAI returned empty content and no tool call." };
  }

  // Text-only consultation: Chat Completions with ChatGPT-like defaults (no temperature).
  const body: Record<string, unknown> = {
    model,
    messages: [{ role: "system", content: systemPrompt }, ...messages],
    max_completion_tokens: CHAT_LIKE.maxOutputTokensChat,
  };

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  const payload = await res.json().catch(() => null);
  if (!res.ok) {
    return {
      type: "error",
      error: `OpenAI error: HTTP ${res.status} ${payload?.error?.message ?? ""}`.trim(),
    };
  }

  const content = (payload?.choices?.[0]?.message?.content ?? "").toString().trim();
  if (!content) {
    return { type: "error", error: "OpenAI returned empty content and no tool call." };
  }
  return { type: "text", text: content };
}

serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  try {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    if (req.method !== "POST") {
      return new Response(JSON.stringify({ type: "error", error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let body: RequestBody;
    try {
      body = (await req.json()) as RequestBody;
    } catch {
      return new Response(JSON.stringify({ type: "error", error: "Invalid JSON body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("OPENAI_API_KEY")?.trim();
    if (!apiKey) {
      return new Response(JSON.stringify({ type: "error", error: "OPENAI_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = body?.systemPrompt;
    const history = body?.history;
    if (typeof systemPrompt !== "string" || !Array.isArray(history)) {
      return new Response(
        JSON.stringify({ type: "error", error: "Missing systemPrompt or history" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const result = await callOpenAi({
      apiKey,
      model: body.model ?? "gpt-5.6",
      systemPrompt,
      history,
      toolsEnabled: Boolean(body.toolsEnabled),
      forcedTool: body.forcedTool ?? null,
      tools: body.tools,
    });

    return new Response(JSON.stringify(result), {
      status: result.type === "error" ? 400 : 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(
      JSON.stringify({ type: "error", error: `Edge handler exception: ${msg}` }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
