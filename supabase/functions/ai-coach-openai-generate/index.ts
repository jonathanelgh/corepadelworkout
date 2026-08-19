import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

type ChatHistoryMessage = {
  role: "user" | "model";
  parts: [{ text: string }];
};

type RequestBody = {
  history: ChatHistoryMessage[];
  systemPrompt: string;
  toolsEnabled: boolean;
  forcedTool?: string | null;
  tools?: unknown[];
  model?: string;
};

function toOpenAiMessages(history: ChatHistoryMessage[]): Array<{ role: "user" | "assistant"; content: string }> {
  return history.map((m) => ({
    role: m.role === "model" ? "assistant" : "user",
    content: m.parts.map((p) => p.text).join("\n"),
  }));
}

async function callOpenAiTools(params: {
  apiKey: string;
  model: string;
  systemPrompt: string;
  history: ChatHistoryMessage[];
  toolsEnabled: boolean;
  forcedTool?: string | null;
  tools?: unknown[];
}): Promise<
  | { type: "text"; text: string }
  | { type: "functionCall"; name: string; args: Record<string, unknown> }
  | { type: "error"; error: string }
> {
  const { apiKey, model, systemPrompt, history, toolsEnabled, forcedTool, tools } = params;

  const messages = [{ role: "system", content: systemPrompt }, ...toOpenAiMessages(history).map((m) => ({ role: m.role, content: m.content }))];

  const body: Record<string, unknown> = {
    model,
    messages,
    max_completion_tokens: toolsEnabled ? 32768 : 8192,
  };

  if (toolsEnabled) {
    body["tools"] = tools ?? [];
    body["reasoning_effort"] = "none";
    if (forcedTool) {
      body["tool_choice"] = { type: "function", function: { name: forcedTool } };
    } else {
      body["tool_choice"] = "auto";
    }
  }

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
    return { type: "error", error: `OpenAI error: HTTP ${res.status} ${payload?.error?.message ?? ""}`.trim() };
  }

  const message = payload?.choices?.[0]?.message;
  const content = (message?.content ?? "").toString().trim();
  const toolCalls = message?.tool_calls ?? [];

  if (Array.isArray(toolCalls) && toolCalls.length > 0) {
    const first = toolCalls[0];
    const name = first?.function?.name?.toString() ?? "";
    const rawArgs = first?.function?.arguments?.toString() ?? "";
    if (!name) return { type: "error", error: "OpenAI returned a tool call without a function name." };
    try {
      const parsed = JSON.parse(rawArgs) as Record<string, unknown>;
      return { type: "functionCall", name, args: parsed };
    } catch {
      return { type: "error", error: `Could not parse tool arguments JSON for ${name}.` };
    }
  }

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

    const result = await callOpenAiTools({
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

