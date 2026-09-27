import { createFileRoute } from "@tanstack/react-router";

/**
 * AI concept designer for the Maker Studio.
 * Streams an image so the customer watches the design appear, then that image
 * is turned into printable 3D relief on the client.
 */
export const Route = createFileRoute("/api/design-image")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { prompt, stream = true } = (await request.json()) as {
          prompt?: string;
          stream?: boolean;
        };
        if (!prompt || !prompt.trim()) {
          return new Response(JSON.stringify({ error: "Missing prompt" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        const key = process.env["LOVABLE_API_KEY"];
        if (!key) {
          return new Response(JSON.stringify({ error: "Missing LOVABLE_API_KEY" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }

        const upstream = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
          method: "POST",
          headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-3-pro-image",
            messages: [{ role: "user", content: prompt }],
            modalities: ["image", "text"],
            ...(stream ? { stream: true } : {}),
          }),
        });

        if (!upstream.ok || !upstream.body) {
          const text = await upstream.text().catch(() => "");
          return new Response(text || JSON.stringify({ error: "Generation failed" }), {
            status: upstream.status,
            headers: { "Content-Type": "application/json" },
          });
        }

        if (!stream) {
          return new Response(upstream.body, { headers: { "Content-Type": "application/json" } });
        }

        return new Response(upstream.body, {
          headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
        });
      },
    },
  },
});
