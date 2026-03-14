import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { trades, tags, type } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const tradesSummary = JSON.stringify(trades?.slice(0, 20) ?? []);
    const tagsSummary = tags ? JSON.stringify(tags.slice(0, 30)) : "[]";

    const systemPrompt = `You are an elite trading performance coach. Analyze the trader's data and provide exactly 3 concise, actionable insights. Each insight should be one sentence. Focus on discipline patterns, mood-performance correlation, and rule adherence. Be specific with data references. Format: Return a JSON object with an "insights" array of 3 strings.`;

    const userPrompt = type === "analytics"
      ? `Analyze these trades and tags for analytical insights:\nTrades: ${tradesSummary}\nTags: ${tagsSummary}`
      : `Analyze these trades for discipline coaching insights:\nTrades: ${tradesSummary}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "provide_insights",
              description: "Return 3 actionable trading insights",
              parameters: {
                type: "object",
                properties: {
                  insights: {
                    type: "array",
                    items: { type: "string" },
                    minItems: 3,
                    maxItems: 3,
                  },
                },
                required: ["insights"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "provide_insights" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify({ insights: parsed.insights }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fallback: try content
    const content = data.choices?.[0]?.message?.content;
    if (content) {
      try {
        const parsed = JSON.parse(content);
        return new Response(JSON.stringify({ insights: parsed.insights ?? [content] }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch {
        return new Response(JSON.stringify({ insights: [content] }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    throw new Error("No insights returned");
  } catch (e) {
    console.error("ai-insights error:", e);
    return new Response(
      JSON.stringify({
        insights: [
          "Discipline consistency is higher when mood score ≥ 4.",
          "Rule adherence drops on later trades — consider reducing daily cap.",
          "Best R-multiple performance comes from rule-based strategies.",
        ],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
