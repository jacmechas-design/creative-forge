import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const SERVICES = ["uv", "laser", "3d", "otro"] as const;
const SERVICE_LABEL: Record<(typeof SERVICES)[number], string> = {
  uv: "Impresión UV",
  laser: "Corte / grabado láser",
  "3d": "Impresión 3D",
  otro: "Otro / no sé",
};

/** Files a customer may attach: logos, photos, PDFs and 3D models. */
const ALLOWED_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "application/pdf": "pdf",
  "model/stl": "stl",
  "application/sla": "stl",
  "application/vnd.ms-pki.stl": "stl",
  "application/octet-stream": "stl", // browsers often report .stl like this
};
const MAX_FILE_BYTES = 5 * 1024 * 1024;

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(160),
  phone: z.string().trim().max(60).optional().default(""),
  service: z.enum(SERVICES),
  description: z.string().trim().min(10).max(2000),
  qty: z.number().int().min(1).max(10000),
  neededBy: z.string().trim().max(20).optional().default(""),
  budget: z.string().trim().max(60).optional().default(""),
  reference: z.string().trim().max(200).optional().default(""),
  lang: z.enum(["en", "fr", "es"]).default("en"),
  /** Honeypot: real people never fill it. */
  website: z.string().max(200).optional().default(""),
  file: z
    .object({
      name: z.string().trim().min(1).max(160),
      type: z.string().max(100),
      base64: z.string().max(Math.ceil((MAX_FILE_BYTES * 4) / 3) + 16),
    })
    .optional()
    .nullable(),
});

/**
 * Stores a customer quote request (and an optional attachment) for the admin panel.
 * Runs server-side so visitors never need write access to the quotes table or storage.
 */
export const submitQuoteRequest = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => schema.parse(input))
  .handler(async ({ data }) => {
    // Bots fill hidden fields; pretend success and store nothing.
    if (data.website) return { code: "OK" };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let fileLine = "";
    let fileName: string | null = null;
    if (data.file) {
      const isStl = data.file.name.toLowerCase().endsWith(".stl");
      const ext = ALLOWED_TYPES[data.file.type];
      if (!ext || (ext === "stl" && !isStl)) throw new Error("file_type");
      let bytes: Uint8Array;
      try {
        const bin = atob(data.file.base64);
        bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
      } catch {
        throw new Error("file_type");
      }
      if (bytes.byteLength > MAX_FILE_BYTES) throw new Error("file_size");

      fileName = data.file.name;
      const path = `quote-requests/${crypto.randomUUID()}.${ext}`;
      const up = await supabaseAdmin.storage
        .from("design-files")
        .upload(path, bytes, { contentType: data.file.type, upsert: false });
      if (up.error) {
        // Keep the request even if storage is unavailable; the admin can ask for the file again.
        fileLine = `Archivo adjunto: ${data.file.name} (no se pudo guardar: ${up.error.message})`;
      } else {
        const signed = await supabaseAdmin.storage
          .from("design-files")
          .createSignedUrl(path, 60 * 60 * 24 * 60);
        fileLine = signed.data?.signedUrl
          ? `Archivo adjunto (${data.file.name}, enlace válido 60 días): ${signed.data.signedUrl}`
          : `Archivo adjunto guardado en design-files/${path}`;
      }
    }

    const extra: [string, string][] = [
      ["Teléfono / Instagram", data.phone],
      ["Lo necesita para", data.neededBy],
      ["Presupuesto", data.budget],
      ["Referencia", data.reference],
      ["Idioma", data.lang],
    ];
    const notes = [
      data.description,
      "",
      ...extra.filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`),
      ...(fileLine ? [fileLine] : []),
    ].join("\n");

    const row = await supabaseAdmin
      .from("quotes")
      .insert({
        customer_name: data.name,
        customer_email: data.email,
        material: SERVICE_LABEL[data.service],
        qty: data.qty,
        file_name: data.reference || fileName || SERVICE_LABEL[data.service],
        notes,
      })
      .select("id")
      .single();
    if (row.error) throw new Error(row.error.message);

    return { code: row.data.id.slice(0, 8).toUpperCase() };
  });
