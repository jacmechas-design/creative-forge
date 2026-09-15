# ForgeLab commerce experience

## Goal
Build a polished, dark industrial storefront for ForgeLab that lets visitors understand the three fabrication services, explore materials and example products, and start an instant quote flow.

## What I’ll build
- A compact sticky header with ForgeLab branding, service navigation, cart access, and a strong “Get a quote” action.
- A high-impact first screen centered on the ForgeLab name, fabrication imagery, trust indicators, and one primary upload/quote action.
- A service selector for 3D printing, laser engraving, and laser cutting with distinct details, pricing cues, and turnaround times.
- A practical quote configurator where visitors choose a service, material, quantity, and upload a design file; the interface will produce an illustrative live estimate.
- A curated product/material section, production-process timeline, proof points, and concise customer testimonials.
- A focused footer with contact and service links.

## Visual direction
- Industrial control-panel aesthetic: deep slate surfaces, crisp white/gray type, neon orange for laser and hotend signals, fine grid texture, restrained metallic borders, and technical labels.
- Strong editorial typography paired with a compact monospaced accent for measurements and status text.
- Generated workshop imagery showing real fabrication equipment and finished parts, integrated as bold full-width visual anchors.
- Responsive composition for desktop and mobile, with subtle motion and clear focus states.

## Technical details
- React and Tailwind CSS v4 using semantic tokens in the global design system.
- Existing Shadcn button, input, tabs, and badge patterns where appropriate; Lucide icons throughout controls.
- Client-side quote calculations and file-selection feedback only; checkout, payments, persistent cart, and production ordering are outside this first build.
- Unique page metadata for ForgeLab and accessibility essentials, including semantic landmarks, labels, contrast, and reduced-motion support.
- Validate the finished page in the browser at desktop and mobile widths and correct any visible layout or runtime issues.
