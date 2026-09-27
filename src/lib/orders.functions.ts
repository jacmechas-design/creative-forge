import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(160),
  phone: z.string().trim().max(40).optional().nullable(),
  lang: z.enum(["en", "fr", "es"]).default("en"),
  items: z
    .array(
      z.object({
        slug: z.string().trim().min(1).max(120),
        name: z.string().trim().min(1).max(200),
        price: z.number().finite().min(0).max(100000),
        qty: z.number().int().min(1).max(99).default(1),
      })
    )
    .min(1)
    .max(50),
});

/**
 * Creates a customer order plus its line items and returns the public order code.
 * Runs server-side so the storefront never needs read access to the orders table.
 */
export const createOrder = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => schema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const total = data.items.reduce((sum, i) => sum + i.price * i.qty, 0);

    const order = await supabaseAdmin
      .from("orders")
      .insert({
        customer_name: data.name,
        customer_email: data.email,
        customer_phone: data.phone?.trim() ? data.phone.trim() : null,
        lang: data.lang,
        total_cad: total,
      })
      .select("id, code")
      .single();
    if (order.error) throw new Error(order.error.message);

    const items = await supabaseAdmin.from("order_items").insert(
      data.items.map((i) => ({
        order_id: order.data.id,
        product_slug: i.slug,
        name: i.name,
        unit_price_cad: i.price,
        qty: i.qty,
      }))
    );
    if (items.error) {
      await supabaseAdmin.from("orders").delete().eq("id", order.data.id);
      throw new Error(items.error.message);
    }

    return { code: order.data.code, total };
  });
