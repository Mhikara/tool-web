import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

type Provider = "openrouter" | "groq" | "openai" | "anthropic";

type Body = {
  provider: Provider;
  apiKey: string;
  model?: string;
  messages: { role: string; content: string }[];
  system?: string;
};

const DEFAULT_MODEL: Record<Provider, string> = {
  openrouter: "openai/gpt-4o-mini",
  groq: "llama-3.3-70b-versatile",
  openai: "gpt-4o-mini",
  anthropic: "claude-3-5-haiku-latest",
};

async function callOpenAICompat(
  base: string,
  apiKey: string,
  model: string,
  messages: { role: string; content: string }[],
  extraHeaders?: Record<string, string>
) {
  const res = await fetch(base + "/chat/completions", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + apiKey,
      "Content-Type": "application/json",
      ...(extraHeaders || {}),
    },
    body: JSON.stringify({ model, messages, temperature: 0.6 }),
  });
  const text = await res.text();
  let json: any = {};
  try {
    json = JSON.parse(text);
  } catch {
    json = {};
  }
  if (!res.ok) {
    const err =
      json?.error?.message ||
      json?.message ||
      text.slice(0, 240) ||
      "HTTP " + res.status;
    const retryable =
      res.status === 429 ||
      res.status === 401 ||
      res.status === 402 ||
      res.status === 403 ||
      /quota|rate|limit|billing|invalid api key|insufficient/i.test(err);
    return { ok: false as const, error: err, retryable, status: res.status };
  }
  const content =
    json?.choices?.[0]?.message?.content ||
    json?.choices?.[0]?.text ||
    "";
  return { ok: true as const, content: String(content) };
}

async function callAnthropic(
  apiKey: string,
  model: string,
  messages: { role: string; content: string }[],
  system?: string
) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: 2048,
      system: system || undefined,
      messages: messages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({ role: m.role, content: m.content })),
    }),
  });
  const text = await res.text();
  let json: any = {};
  try {
    json = JSON.parse(text);
  } catch {
    json = {};
  }
  if (!res.ok) {
    const err = json?.error?.message || text.slice(0, 240) || "HTTP " + res.status;
    const retryable =
      res.status === 429 ||
      res.status === 401 ||
      /rate|quota|credit|invalid/i.test(err);
    return { ok: false as const, error: err, retryable, status: res.status };
  }
  const content = (json?.content || [])
    .map((c: any) => c?.text || "")
    .join("\n");
  return { ok: true as const, content: String(content) };
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body;
    const provider = body.provider;
    const apiKey = String(body.apiKey || "").trim();
    if (!apiKey) {
      return NextResponse.json({ error: "apiKey wajib" }, { status: 400 });
    }
    if (!body.messages?.length) {
      return NextResponse.json({ error: "messages kosong" }, { status: 400 });
    }

    const model = body.model || DEFAULT_MODEL[provider] || DEFAULT_MODEL.openrouter;
    const msgs = [...body.messages];
    if (body.system) {
      msgs.unshift({ role: "system", content: body.system });
    }

    let result;
    if (provider === "anthropic") {
      result = await callAnthropic(apiKey, model, body.messages, body.system);
    } else if (provider === "groq") {
      result = await callOpenAICompat(
        "https://api.groq.com/openai/v1",
        apiKey,
        model,
        msgs
      );
    } else if (provider === "openai") {
      result = await callOpenAICompat(
        "https://api.openai.com/v1",
        apiKey,
        model,
        msgs
      );
    } else {
      result = await callOpenAICompat(
        "https://openrouter.ai/api/v1",
        apiKey,
        model,
        msgs,
        {
          "HTTP-Referer": "https://tool-web.vercel.app",
          "X-Title": "tool-web multi-agent",
        }
      );
    }

    if (!result.ok) {
      return NextResponse.json(
        {
          error: result.error,
          retryable: result.retryable,
          status: result.status,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ content: result.content, model });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Server error", retryable: true },
      { status: 500 }
    );
  }
}
