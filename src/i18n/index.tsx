import * as React from "react";
import { LANGS, type Lang, type Tri } from "./lang";

export type { Lang, Tri };
export { LANGS };

const STORAGE_KEY = "jac-lang";

type Dict = Record<string, Tri>;

export const UI: Dict = {
  // nav
  navHome: { en: "Home", fr: "Accueil", es: "Inicio" },
  navCatalog: { en: "Shop", fr: "Boutique", es: "Tienda" },
  navCustomizer: { en: "Live customizer", fr: "Personnalisation", es: "Personalizador" },
  navQuoter: { en: "3D quote", fr: "Devis 3D", es: "Cotizador 3D" },
  navReviews: { en: "Reviews", fr: "Avis", es: "Reseñas" },
  navContact: { en: "Contact", fr: "Contact", es: "Contacto" },
  cart: { en: "Cart", fr: "Panier", es: "Carrito" },
  wishlist: { en: "Wishlist", fr: "Favoris", es: "Favoritos" },
  language: { en: "Language", fr: "Langue", es: "Idioma" },
  tagline: { en: "3D • Parties • Laser • Foam • Desserts", fr: "3D • Fêtes • Laser • Mousse • Desserts", es: "3D • Fiestas • Láser • Foam • Postres" },

  // hero
  heroBadge: { en: "Designed & made in Canada", fr: "Conçu et fabriqué au Canada", es: "Diseñado y fabricado en Canadá" },
  heroTitle1: { en: "Custom design for your", fr: "Design sur mesure pour vos", es: "Diseño a medida para tus" },
  heroTitle2: { en: "ideas and celebrations", fr: "idées et célébrations", es: "ideas y celebraciones" },
  heroText: {
    en: "3D printing, laser-cut wood, event styling and healthy desserts — one studio, one invoice, delivered across Canada.",
    fr: "Impression 3D, bois découpé au laser, décor d'événements et desserts santé — un seul atelier, partout au Canada.",
    es: "Impresión 3D, madera cortada a láser, decoración de eventos y postres saludables — un solo taller, envíos en todo Canadá.",
  },
  ctaShop: { en: "Shop the catalogue", fr: "Voir la boutique", es: "Ver el catálogo" },
  ctaCustomize: { en: "Customize yours", fr: "Personnaliser", es: "Personalizar el mío" },
  statProducts: { en: "products in stock", fr: "produits en stock", es: "productos en stock" },
  statRating: { en: "average rating", fr: "note moyenne", es: "calificación promedio" },
  statShip: { en: "24 h dispatch", fr: "expédition 24 h", es: "envío en 24 h" },

  trustShipping: { en: "Free shipping over $150 CAD", fr: "Livraison gratuite dès 150 $ CA", es: "Envío gratis desde $150 CAD" },
  trustSecure: { en: "Secure checkout", fr: "Paiement sécurisé", es: "Pago seguro" },
  trustGuarantee: { en: "Happiness guarantee", fr: "Satisfaction garantie", es: "Satisfacción garantizada" },
  trustLocal: { en: "Local workshop, fast support", fr: "Atelier local, soutien rapide", es: "Taller local, soporte rápido" },

  // catalog
  catalogKicker: { en: "Catalogue", fr: "Boutique", es: "Catálogo" },
  catalogTitle: { en: "Curated best sellers", fr: "Nos meilleures ventes", es: "Los más vendidos" },
  catalogText: {
    en: "Five hand-picked pieces per category, every one made to order in our workshop.",
    fr: "Cinq pièces sélectionnées par catégorie, toutes fabriquées sur commande.",
    es: "Cinco piezas seleccionadas por categoría, todas hechas por encargo.",
  },
  addToCart: { en: "Add to cart", fr: "Ajouter", es: "Añadir" },
  quickView: { en: "Quick view", fr: "Aperçu", es: "Vista rápida" },
  buyNow: { en: "Add to cart", fr: "Ajouter au panier", es: "Añadir al carrito" },
  popular: { en: "Popular", fr: "Populaire", es: "Popular" },
  reviewsWord: { en: "reviews", fr: "avis", es: "reseñas" },
  material: { en: "Material", fr: "Matériau", es: "Material" },
  size: { en: "Size", fr: "Dimensions", es: "Medidas" },
  delivery: { en: "Delivery", fr: "Livraison", es: "Entrega" },
  category: { en: "Category", fr: "Catégorie", es: "Categoría" },

  // customizer
  customKicker: { en: "Live customizer", fr: "Personnalisation en direct", es: "Personalizador en vivo" },
  customTitle: { en: "See it before you buy it", fr: "Voyez-le avant d'acheter", es: "Míralo antes de comprarlo" },
  customText: {
    en: "Type your text, pick a typeface and a finish — the preview updates instantly.",
    fr: "Écrivez votre texte, choisissez la police et le fini : l'aperçu se met à jour instantanément.",
    es: "Escribe tu texto, elige tipografía y acabado: la vista previa se actualiza al instante.",
  },
  baseProduct: { en: "Base product", fr: "Produit de base", es: "Producto base" },
  yourText: { en: "Your text", fr: "Votre texte", es: "Tu texto" },
  textPlaceholder: { en: "Name, date or dedication", fr: "Nom, date ou dédicace", es: "Nombre, fecha o dedicatoria" },
  typeface: { en: "Typeface", fr: "Police", es: "Tipografía" },
  finish: { en: "Finish", fr: "Fini", es: "Acabado" },
  livePreview: { en: "Live preview", fr: "Aperçu en direct", es: "Vista previa" },
  totalPrice: { en: "Total price", fr: "Prix total", es: "Precio total" },
  addCustom: { en: "Add customized item", fr: "Ajouter la personnalisation", es: "Añadir personalizado" },
  prodSign: { en: "Custom sign", fr: "Enseigne personnalisée", es: "Letrero personalizado" },
  prodMug: { en: "Ceramic mug", fr: "Tasse en céramique", es: "Pocillo de cerámica" },
  prodBox: { en: "Fit dessert box", fr: "Boîte de desserts santé", es: "Caja de postres fit" },
  fontSans: { en: "Modern sans", fr: "Sans moderne", es: "Moderna sans" },
  fontSerif: { en: "Elegant serif", fr: "Serif élégant", es: "Elegante serif" },
  fontMono: { en: "Technical mono", fr: "Mono technique", es: "Técnica mono" },
  colAmber: { en: "Amber wood", fr: "Bois ambré", es: "Ámbar madera" },
  colRose: { en: "Party rose", fr: "Rose fête", es: "Rosa fiesta" },
  colGreen: { en: "Healthy green", fr: "Vert santé", es: "Verde healthy" },
  colBlack: { en: "Graphite black", fr: "Noir graphite", es: "Negro grafito" },

  // reviews
  reviewsKicker: { en: "Client stories", fr: "Témoignages", es: "Testimonios" },
  reviewsTitle: { en: "Loved across Canada", fr: "Apprécié partout au Canada", es: "Nos aman en todo Canadá" },

  // contact
  contactKicker: { en: "Contact", fr: "Contact", es: "Contacto" },
  contactTitle: { en: "Tell us about your project", fr: "Parlez-nous de votre projet", es: "Cuéntanos tu proyecto" },
  contactText: {
    en: "Send the brief and we answer with a quote within one business day.",
    fr: "Envoyez votre brief : nous répondons avec un devis en un jour ouvrable.",
    es: "Envía tu idea y respondemos con una cotización en un día hábil.",
  },
  fieldName: { en: "Full name", fr: "Nom complet", es: "Nombre completo" },
  fieldEmail: { en: "Email", fr: "Courriel", es: "Correo" },
  fieldPhone: { en: "Phone", fr: "Téléphone", es: "Teléfono" },
  fieldMessage: { en: "Your message", fr: "Votre message", es: "Tu mensaje" },
  send: { en: "Send message", fr: "Envoyer le message", es: "Enviar mensaje" },
  phoneLabel: { en: "Phone", fr: "Téléphone", es: "Teléfono" },
  emailLabel: { en: "Email", fr: "Courriel", es: "Correo" },
  hoursLabel: { en: "Opening hours", fr: "Heures d'ouverture", es: "Horario de atención" },
  hoursValue: {
    en: "Mon–Fri 9 a.m.–6 p.m. · Sat 10 a.m.–2 p.m. (ET)",
    fr: "Lun–ven 9 h–18 h · sam 10 h–14 h (HE)",
    es: "Lun-vie 9:00-18:00 · sáb 10:00-14:00 (ET)",
  },
  contactSent: { en: "Message sent! We reply within one business day.", fr: "Message envoyé ! Réponse en un jour ouvrable.", es: "¡Mensaje enviado! Respondemos en un día hábil." },
  contactIncomplete: { en: "Please fill in name, email and message.", fr: "Veuillez remplir nom, courriel et message.", es: "Completa nombre, correo y mensaje." },
  placeholderNote: {
    en: "Sample contact details — send us yours and we will publish them.",
    fr: "Coordonnées d'exemple — envoyez les vôtres et nous les publierons.",
    es: "Datos de contacto de ejemplo: envíanos los reales y los publicamos.",
  },

  // cart
  cartTitle: { en: "Your cart", fr: "Votre panier", es: "Tu carrito" },
  cartEmpty: { en: "Your cart is empty.", fr: "Votre panier est vide.", es: "Tu carrito está vacío." },
  remove: { en: "Remove", fr: "Retirer", es: "Eliminar" },
  subtotal: { en: "Subtotal", fr: "Sous-total", es: "Subtotal" },
  total: { en: "Total", fr: "Total", es: "Total" },
  checkout: { en: "Secure checkout", fr: "Paiement sécurisé", es: "Proceder al pago seguro" },
  checkoutDone: { en: "Order confirmed! Check your email for tracking.", fr: "Commande confirmée ! Vérifiez votre courriel.", es: "¡Pedido confirmado! Revisa tu correo." },
  saveError: { en: "We couldn't save that. Please try again.", fr: "Enregistrement impossible. Réessayez.", es: "No se pudo guardar. Inténtalo de nuevo." },
  adminAccess: { en: "Business panel", fr: "Panneau de gestion", es: "Panel de gestión" },
  addedToCart: { en: "added to cart", fr: "ajouté au panier", es: "añadido al carrito" },
  addedToWishlist: { en: "saved to wishlist", fr: "ajouté aux favoris", es: "guardado en favoritos" },
  removedFromWishlist: { en: "removed from wishlist", fr: "retiré des favoris", es: "quitado de favoritos" },
  close: { en: "Close", fr: "Fermer", es: "Cerrar" },
  free: { en: "Free shipping unlocked", fr: "Livraison gratuite débloquée", es: "Envío gratis desbloqueado" },
  awayFromFree: { en: "away from free shipping", fr: "avant la livraison gratuite", es: "para el envío gratis" },

  // footer
  footerText: {
    en: "Digital fabrication studio: 3D printing, laser-cut wood, event styling and healthy pastry.",
    fr: "Atelier de fabrication numérique : impression 3D, bois au laser, décor d'événements et pâtisserie santé.",
    es: "Estudio de fabricación digital: impresión 3D, madera láser, decoración de eventos y repostería saludable.",
  },
  rights: { en: "All rights reserved.", fr: "Tous droits réservés.", es: "Todos los derechos reservados." },
  pricesCad: { en: "All prices in CAD", fr: "Tous les prix en $ CA", es: "Precios en CAD" },
};

const I18nCtx = React.createContext<{
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
  tr: (v: Tri) => string;
  money: (n: number) => string;
}>({ lang: "en", setLang: () => {}, t: (k) => k, tr: (v) => v.en, money: (n) => `$${n}` });

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = React.useState<Lang>("en");

  React.useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Lang | null;
    if (stored && LANGS.some((l) => l.id === stored)) setLangState(stored);
  }, []);

  React.useEffect(() => {
    document.documentElement.lang = lang === "fr" ? "fr-CA" : lang;
  }, [lang]);

  const setLang = React.useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* ignore */
    }
  }, []);

  const value = React.useMemo(() => {
    const locale = lang === "fr" ? "fr-CA" : lang === "es" ? "es-CA" : "en-CA";
    return {
      lang,
      setLang,
      t: (key: string) => UI[key]?.[lang] ?? key,
      tr: (v: Tri) => v[lang],
      money: (n: number) =>
        new Intl.NumberFormat(locale, {
          style: "currency",
          currency: "CAD",
          maximumFractionDigits: 0,
        }).format(n),
    };
  }, [lang, setLang]);

  return <I18nCtx.Provider value={value}>{children}</I18nCtx.Provider>;
}

export const useI18n = () => React.useContext(I18nCtx);
