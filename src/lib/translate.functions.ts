import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({
  source: z.enum(["en", "fr", "es"]),
  cat: z.string().trim().max(40).optional(),
  name: z.string().trim().max(200).default(""),
  tag: z.string().trim().max(200).default(""),
  desc: z.string().trim().max(2000).default(""),
  material: z.string().trim().max(400).default(""),
});

export type ProductCopy = {
  name: { en: string; fr: string; es: string };
  tag: { en: string; fr: string; es: string };
  desc: { en: string; fr: string; es: string };
  material: { en: string; fr: string; es: string };
  slug: string;
};

const LANGS = { en: "English (Canada)", fr: "Canadian French", es: "Latin American Spanish" } as const;

/**
 * Takes product copy written in one language and returns polished, premium
 * e-commerce copy in all three store languages plus a URL-safe slug.
 */
export const translateProductCopy = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => schema.parse(input))
  .handler(async ({ data }): Promise<ProductCopy> => {
    const key = process.env['LOVABLE_API_KEY'];
    if (!key) throw new Error("AI is not configured on this project.");
    if (!data.name && !data.desc) throw new Error("Escribe al menos el nombre o la descripción.");

    const prompt = [
      `You write product copy for Jac Design, a Canadian maker studio (3D printing, laser-cut wood, party decor, foam signs, healthy desserts).`,
      `The source copy is written in ${LANGS[data.source]}${data.cat ? ` for the "${data.cat}" category` : ""}:`,
      `name: ${data.name}`,
      `tag (short badge, max 4 words): ${data.tag}`,
      `description: ${data.desc}`,
      `material: ${data.material}`,
      ``,
      `Return JSON only, no markdown, with this exact shape:`,
      `{"name":{"en":"","fr":"","es":""},"tag":{"en":"","fr":"","es":""},"desc":{"en":"","fr":"","es":""},"material":{"en":"","fr":"","es":""},"slug":""}`,
      `Rules: keep the source-language field as written unless it has typos; write natural native copy for the other two languages (never literal translation); descriptions are 1-2 persuasive sentences of premium retail copy; tags stay under 4 words; material lists materials/finish only; slug is lowercase a-z, 0-9 and hyphens derived from the English name; empty input fields stay empty strings in all languages.`,
    ].join("\n");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: "google/gemini-3.8-flash",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      if (res.status === 402) throw new Error("Los créditos de IA se agotaron. Recárgalos para seguir traduciendo.");
      if (res.status === 429) throw new Error("Demasiadas solicitudes de IA. Intenta de nuevo en unos segundos.");
      throw new Error(`La traducción automática falló (${res.status}). ${body.slice(0, 180)}`);
    }

    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const raw = json.choices?.[0]?.message?.content ?? "";
    const cleaned = raw.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
    let parsed: unknown;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      throw new Error("La IA devolvió un formato inesperado. Vuelve a intentarlo.");
    }

    const tri = z.object({ en: z.string().default(""), fr: z.string().default(""), es: z.string().default("") });
    const out = z
      .object({ name: tri, tag: tri, desc: tri, material: tri, slug: z.string().default("") })
      .parse(parsed);

    const slug = (out.slug || out.name.en)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60);

    return { ...out, slug };
  });
