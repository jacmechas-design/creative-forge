# JTP

JTP is a dark, industrial digital fabrication storefront for on-demand 3D printing, laser engraving, and laser cutting. The current app is a TanStack Start React site with a conversion-focused landing page, instant estimate configurator, file picker, and authentication page.

This project is connected to [Lovable](https://lovable.dev). Continue developing it in the [Lovable editor](https://lovable.dev/projects/68cb54f3-94cf-4a08-9fac-f417de6fa818) or locally from this repository. Pushed commits on the connected branch sync back into Lovable, so avoid rewriting published git history.

## Product Context

- Brand: `JTP`
- Positioning: precision fabrication on demand for designers, engineers, and makers.
- Services: 3D Printing, Laser Engraving, Laser Cutting.
- Core page: `/` with hero, service cards, instant estimate configurator, material library, process section, CTA, and footer.
- Auth page: `/auth` with email/password sign-in and sign-up plus Google OAuth through Lovable auth.
- Current quote flow is front-end only: users can choose service, material, quantity, and a local file; the submit button is gated by file selection but does not yet persist the quote.

## Tech Stack

- React 19
- TanStack Start and TanStack Router file-based routing
- Vite
- TypeScript
- Tailwind CSS v4
- shadcn/ui-style Radix components in `src/components/ui`
- Lucide React icons
- Supabase client/auth integration
- Drizzle migrations for Supabase database/storage policy setup

## Project Structure

- `src/routes/__root.tsx`: root HTML shell, global metadata, error/not-found UI, React Query provider, and required `<Outlet />`.
- `src/routes/index.tsx`: JTP landing page and instant estimate UI.
- `src/routes/auth.tsx`: authentication page.
- `src/styles.css`: Tailwind v4 design system, dark theme tokens, typography, and utilities.
- `src/assets/`: local bitmap assets used by the landing page.
- `src/integrations/supabase/`: Supabase clients, auth helpers, and generated database types.
- `src/integrations/lovable/`: Lovable integration.
- `drizzle/migrations/`: SQL migrations for `quotes`, `profiles`, auth profile trigger, and `design-files` storage policies.
- `drizzle/schema.ts`: currently generated/placeholder and intentionally blank.

## Data Context

Supabase types currently describe:

- `profiles`: user profile rows keyed by auth user id with optional `full_name` and `company`.
- `quotes`: quote records with `user_id`, `service`, `material`, `quantity`, `estimated_price`, optional file metadata, `status`, and timestamps.

Implemented migrations:

- `0000_create_quotes_and_orders.sql`: creates `quotes`, `profiles`, row-level security policies, and a trigger to create profiles for new auth users.
- `0001_storage_policies_design_files.sql`: adds authenticated storage policies for a `design-files` bucket path scoped by user id.

## Design Context

The visual direction is dark-mode-first, technical, and manufacturing-focused:

- Background and surfaces use deep blue-black OKLCH tokens.
- Primary accent is currently electric blue/cyan, not the older orange prompt color.
- Typography uses Space Grotesk for display, Manrope for body, and IBM Plex Mono for technical labels.
- UI favors squared industrial panels, thin borders, compact controls, and real manufacturing imagery.

## Development

Use Node.js and npm.

```sh
npm i
npm run dev
```

Useful scripts:

```sh
npm run build
npm run lint
npm run format
```

## Notes For Future Work

- Wire the quote configurator to authenticated Supabase inserts and file uploads.
- Confirm/create the `design-files` storage bucket before relying on storage policies.
- Keep route files under `src/routes`; do not add Next.js-style `pages`, `app`, or `_app` files.
- Regenerate generated route artifacts through the framework tooling instead of editing `src/routeTree.gen.ts` by hand.
