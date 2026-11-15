import { supabase } from "@/integrations/supabase/client";

/** Reads one JSON document from the `app_content` table (not in the generated DB types). */
type ContentClient = {
  from: (table: string) => {
    select: (cols: string) => {
      eq: (
        col: string,
        v: string,
      ) => { maybeSingle: () => PromiseLike<{ data: { data: unknown } | null }> };
    };
  };
};

export async function loadContent<T>(id: string): Promise<T | null> {
  const client = supabase as unknown as ContentClient;
  const { data } = await client.from("app_content").select("data").eq("id", id).maybeSingle();
  return (data?.data as T) ?? null;
}

/** Brand and contact details edited in Admin › Editor Web. */
export interface SiteSettings {
  brand_name: string;
  hero_title: string;
  hero_subtitle: string;
  primary_color: string;
  contact_email: string;
  contact_phone: string;
  location: string;
  instagram_url: string;
  facebook_url: string;
}

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  brand_name: "JTP",
  hero_title: "Custom pieces, made in Edmonton",
  hero_subtitle: "UV printing, laser engraving and 3D printing for gifts, events and businesses.",
  primary_color: "#1e3a8a",
  contact_email: "",
  contact_phone: "",
  location: "Edmonton, AB",
  instagram_url: "",
  facebook_url: "",
};
