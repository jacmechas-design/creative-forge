import type { Lang, Tri } from "@/i18n/lang";

// Fiestas & Eventos
import fiestaBackdrop from "@/assets/catalog/fiesta-backdrop.jpg";
import fiestaBalloonGarland from "@/assets/catalog/fiesta-balloon-garland.jpg";
import fiestaTableKit from "@/assets/catalog/fiesta-table-kit.jpg";
import fiestaFavorBoxes from "@/assets/catalog/fiesta-favor-boxes.jpg";
import fiestaFloralCenterpiece from "@/assets/catalog/fiesta-floral-centerpiece.jpg";

// Wood & Laser
import woodCharcuterieBoard from "@/assets/catalog/wood-charcuterie-board.jpg";
import woodKeepsakeBox from "@/assets/catalog/wood-keepsake-box.jpg";
import woodOrnamentSet from "@/assets/catalog/wood-ornament-set.jpg";
import woodWallClock from "@/assets/catalog/wood-wall-clock.jpg";
import woodGeometricCoasters from "@/assets/catalog/wood-geometric-coasters.jpg";

// 3D printing
import p3dHeadphoneStand from "@/assets/catalog/3d-headphone-stand.jpg";
import p3dLithophaneLamp from "@/assets/catalog/3d-lithophane-lamp.jpg";
import p3dVoronoiPlanter from "@/assets/catalog/3d-voronoi-planter.jpg";
import p3dDiceTower from "@/assets/catalog/3d-dice-tower.jpg";
import p3dGridfinity from "@/assets/catalog/3d-gridfinity-organizer.jpg";

// Healthy desserts
import dessertKetoBrownies from "@/assets/catalog/dessert-keto-brownies.jpg";
import dessertProteinCupcakes from "@/assets/catalog/dessert-protein-cupcakes.jpg";
import dessertRawTarts from "@/assets/catalog/dessert-raw-tarts.jpg";
import dessertBirthdayCake from "@/assets/catalog/dessert-birthday-cake.jpg";
import dessertCheesecakeJar from "@/assets/catalog/dessert-cheesecake-jar.jpg";

// 3D toys
import toyCrystalDragon from "@/assets/catalog/toy-crystal-dragon.jpg";
import toyFlexiOctopus from "@/assets/catalog/toy-flexi-octopus.jpg";
import toyPuzzleCube from "@/assets/catalog/toy-puzzle-cube.jpg";
import toyInfinityCube from "@/assets/catalog/toy-infinity-cube.jpg";
import toyKineticGyro from "@/assets/catalog/toy-kinetic-gyro.jpg";

export type Cat = "fiestas" | "madera" | "3d" | "postres" | "juguetes";
export type LeadKey = "h24" | "h48" | "d23" | "d34" | "d57" | "daily" | "reserve48";

export interface Product {
  id: string;
  cat: Cat;
  price: number;
  img: string;
  popular: boolean;
  rating: number;
  reviewCount: number;
  dimensions: string;
  lead: LeadKey;
  name: Tri;
  tag: Tri;
  desc: Tri;
  material: Tri;
}

export const CAT_LABELS: Record<"todos" | Cat, Tri> = {
  todos: { en: "All products", fr: "Tous les produits", es: "Todos los productos" },
  fiestas: { en: "Parties & Events", fr: "Fêtes et événements", es: "Fiestas y eventos" },
  madera: { en: "Wood & Laser", fr: "Bois et laser", es: "Madera y láser" },
  "3d": { en: "3D Printing", fr: "Impression 3D", es: "Impresión 3D" },
  postres: { en: "Healthy Desserts", fr: "Desserts santé", es: "Postres saludables" },
  juguetes: { en: "3D Toys & Fidgets", fr: "Jouets 3D et fidgets", es: "Juguetes 3D y fidgets" },
};

export const LEAD_LABELS: Record<LeadKey, Tri> = {
  h24: { en: "Ships in 24 h", fr: "Expédié en 24 h", es: "Envío en 24 h" },
  h48: { en: "Ships in 48 h", fr: "Expédié en 48 h", es: "Envío en 48 h" },
  d23: { en: "2–3 business days", fr: "2 à 3 jours ouvrables", es: "2-3 días hábiles" },
  d34: { en: "3–4 business days", fr: "3 à 4 jours ouvrables", es: "3-4 días hábiles" },
  d57: { en: "5–7 business days", fr: "5 à 7 jours ouvrables", es: "5-7 días hábiles" },
  daily: { en: "Baked fresh daily", fr: "Préparé chaque jour", es: "Elaboración diaria" },
  reserve48: { en: "Reserve 48 h ahead", fr: "Réservation 48 h", es: "Reserva con 48 h" },
};

export const CATS: { id: "todos" | Cat }[] = [
  { id: "todos" },
  { id: "fiestas" },
  { id: "madera" },
  { id: "3d" },
  { id: "postres" },
  { id: "juguetes" },
];

export const tr = (v: Tri, lang: Lang) => v[lang];

export const PRODUCTS: Product[] = [
  /* ── Parties & Events ─────────────────────────────── */
  {
    id: "fiesta-backdrop",
    cat: "fiestas",
    price: 389,
    img: fiestaBackdrop,
    popular: true,
    rating: 4.9,
    reviewCount: 42,
    dimensions: "210 × 180 cm",
    lead: "d34",
    name: {
      en: "Double Arch Organic Backdrop",
      fr: "Toile de fond à double arche",
      es: "Backdrop orgánico de arcos dobles",
    },
    tag: { en: "Best seller", fr: "Meilleure vente", es: "Más vendido" },
    desc: {
      en: "Modular double arch set with a pastel organic balloon garland. Delivery, on-site setup and teardown included across the Greater Toronto Area.",
      fr: "Ensemble modulaire à double arche avec guirlande de ballons organique pastel. Livraison, installation et démontage inclus.",
      es: "Set modular de arcos dobles con guirnalda orgánica de globos en tonos pastel. Entrega, montaje y desmontaje incluidos.",
    },
    material: {
      en: "Lacquered MDF frame + biodegradable latex",
      fr: "Structure MDF laqué + latex biodégradable",
      es: "Estructura de MDF lacado + látex biodegradable",
    },
  },
  {
    id: "fiesta-balloon-garland",
    cat: "fiestas",
    price: 179,
    img: fiestaBalloonGarland,
    popular: true,
    rating: 4.8,
    reviewCount: 38,
    dimensions: "3 m",
    lead: "h48",
    name: {
      en: "Chrome Balloon Garland, 3 m",
      fr: "Guirlande de ballons chromés, 3 m",
      es: "Guirnalda de globos cromados, 3 m",
    },
    tag: { en: "Trending", fr: "Tendance", es: "Tendencia" },
    desc: {
      en: "Hand-clustered garland in rose gold, pearl white and matte sage. Holds its shape for up to five days indoors.",
      fr: "Guirlande assemblée à la main en or rose, blanc perle et sauge mat. Tient jusqu'à cinq jours à l'intérieur.",
      es: "Guirnalda armada a mano en oro rosa, blanco perla y verde salvia mate. Se mantiene hasta cinco días en interiores.",
    },
    material: {
      en: "Premium chrome latex balloons",
      fr: "Ballons en latex chromé premium",
      es: "Globos de látex cromado premium",
    },
  },
  {
    id: "fiesta-table-kit",
    cat: "fiestas",
    price: 249,
    img: fiestaTableKit,
    popular: true,
    rating: 4.9,
    reviewCount: 31,
    dimensions: "90 / 75 / 60 cm",
    lead: "d34",
    name: {
      en: "Fluted Dessert Table Plinths (set of 3)",
      fr: "Trio de colonnes à desserts cannelées",
      es: "Trío de cilindros para mesa de dulces",
    },
    tag: { en: "Complete set of 3", fr: "Ensemble de 3", es: "Set completo x3" },
    desc: {
      en: "Three nesting fluted pedestals in graduated heights for cakes and dessert displays. Light, sturdy and rental-friendly.",
      fr: "Trois socles cannelés emboîtables de hauteurs graduées pour gâteaux et desserts. Légers, solides et faciles à transporter.",
      es: "Tres pedestales estriados encajables de alturas graduadas para pasteles y postres. Ligeros, resistentes y fáciles de transportar.",
    },
    material: {
      en: "Thermoformed polymer + wood tops",
      fr: "Polymère thermoformé + dessus en bois",
      es: "Polímero termoformado + tapas de madera",
    },
  },
  {
    id: "fiesta-favor-boxes",
    cat: "fiestas",
    price: 69,
    img: fiestaFavorBoxes,
    popular: false,
    rating: 4.8,
    reviewCount: 22,
    dimensions: "12 × 7 × 5 cm",
    lead: "d23",
    name: {
      en: "Laser-Cut Favour Boxes (pack of 12)",
      fr: "Boîtes-cadeaux découpées au laser (12)",
      es: "Cajas de recuerdo cortadas a láser (x12)",
    },
    tag: { en: "Pack of 12", fr: "Paquet de 12", es: "Pack x12" },
    desc: {
      en: "Filigree favour boxes with satin ribbon closure, assembled flat-pack in minutes. Choose your motif and card stock colour.",
      fr: "Boîtes ajourées avec ruban de satin, à assembler en quelques minutes. Motif et couleur du carton au choix.",
      es: "Cajitas caladas con lazo de satín, se armas en minutos. Elige el motivo y el color de la cartulina.",
    },
    material: {
      en: "Textured 250 g card stock",
      fr: "Carton texturé 250 g",
      es: "Cartulina texturizada 250 g",
    },
  },
  {
    id: "fiesta-floral-centerpiece",
    cat: "fiestas",
    price: 54,
    img: fiestaFloralCenterpiece,
    popular: false,
    rating: 4.9,
    reviewCount: 35,
    dimensions: "16 × 20 cm",
    lead: "d23",
    name: {
      en: "Geometric Wood Centrepiece",
      fr: "Centre de table géométrique en bois",
      es: "Centro de mesa geométrico en madera",
    },
    tag: { en: "Botanical collection", fr: "Collection botanique", es: "Colección botánica" },
    desc: {
      en: "Hexagonal pine base with an integrated glass tube for fresh or dried stems. Engrave table numbers or a short thank-you.",
      fr: "Base hexagonale en pin avec tube de verre intégré pour fleurs fraîches ou séchées. Gravure de numéros de table possible.",
      es: "Base hexagonal de pino con tubo de vidrio integrado para flores frescas o secas. Se puede grabar el número de mesa.",
    },
    material: {
      en: "Treated pine + borosilicate tube",
      fr: "Pin traité + tube en borosilicate",
      es: "Pino tratado + tubo de borosilicato",
    },
  },

  /* ── Wood & Laser ─────────────────────────────────── */
  {
    id: "wood-charcuterie-board",
    cat: "madera",
    price: 94,
    img: woodCharcuterieBoard,
    popular: true,
    rating: 4.9,
    reviewCount: 89,
    dimensions: "45 × 30 × 2.5 cm",
    lead: "h48",
    name: {
      en: "Engraved Walnut Charcuterie Board",
      fr: "Planche à charcuterie en noyer gravée",
      es: "Tabla de charcutería en nogal grabada",
    },
    tag: { en: "High demand", fr: "Forte demande", es: "Alta demanda" },
    desc: {
      en: "Food-safe walnut board finished with mineral oil and beeswax. Add a botanical wreath, a family name or a wedding date.",
      fr: "Planche en noyer de qualité alimentaire finie à l'huile minérale et à la cire d'abeille. Ajoutez une couronne, un nom ou une date.",
      es: "Tabla de nogal apta para alimentos con acabado de aceite mineral y cera de abejas. Añade una corona, un apellido o una fecha.",
    },
    material: { en: "Solid walnut", fr: "Noyer massif", es: "Nogal macizo" },
  },
  {
    id: "wood-keepsake-box",
    cat: "madera",
    price: 72,
    img: woodKeepsakeBox,
    popular: true,
    rating: 5.0,
    reviewCount: 44,
    dimensions: "24 × 18 × 10 cm",
    lead: "d23",
    name: {
      en: "Solid Oak Keepsake Box",
      fr: "Boîte souvenir en chêne massif",
      es: "Caja de recuerdos en roble macizo",
    },
    tag: { en: "Memorable gift", fr: "Cadeau mémorable", es: "Regalo memorable" },
    desc: {
      en: "Hinged oak box with velvet lining and high-resolution engraving inside the lid — a favourite for weddings and anniversaries.",
      fr: "Boîte en chêne à charnières, doublée de velours, avec gravure haute résolution sous le couvercle. Idéale pour mariages.",
      es: "Cofre de roble con bisagras, forro de terciopelo y grabado de alta resolución en la tapa. Ideal para bodas y aniversarios.",
    },
    material: { en: "Solid oak + velvet", fr: "Chêne massif + velours", es: "Roble macizo + terciopelo" },
  },
  {
    id: "wood-ornament-set",
    cat: "madera",
    price: 39,
    img: woodOrnamentSet,
    popular: false,
    rating: 4.7,
    reviewCount: 23,
    dimensions: "8 cm ø",
    lead: "h24",
    name: {
      en: "Birch Ornament Set (set of 8)",
      fr: "Ensemble d'ornements en bouleau (8)",
      es: "Set de adornos en abedul (x8)",
    },
    tag: { en: "Ultra-fine cut", fr: "Découpe ultra fine", es: "Corte ultrafino" },
    desc: {
      en: "Eight filigree ornaments in 3 mm Baltic birch with linen ties and recyclable gift packaging — snowflakes and maple leaves.",
      fr: "Huit ornements ajourés en bouleau baltique 3 mm, rubans de lin et emballage recyclable : flocons et feuilles d'érable.",
      es: "Ocho adornos calados en abedul báltico de 3 mm con lazos de lino y empaque reciclable: copos de nieve y hojas de maple.",
    },
    material: { en: "Baltic birch plywood", fr: "Contreplaqué de bouleau baltique", es: "Contrachapado de abedul báltico" },
  },
  {
    id: "wood-wall-clock",
    cat: "madera",
    price: 128,
    img: woodWallClock,
    popular: true,
    rating: 4.9,
    reviewCount: 37,
    dimensions: "40 cm ø",
    lead: "d34",
    name: {
      en: "Nordic Geometric Wall Clock",
      fr: "Horloge murale géométrique nordique",
      es: "Reloj de pared nórdico geométrico",
    },
    tag: { en: "Minimalist design", fr: "Design minimaliste", es: "Diseño minimalista" },
    desc: {
      en: "Layered oak and maple face with an open geometric pattern and a silent sweep quartz movement. Hangs on a single screw.",
      fr: "Cadran multicouche en chêne et érable, motif géométrique ajouré et mouvement à quartz silencieux. Se pose sur une seule vis.",
      es: "Esfera multicapa de roble y maple con patrón geométrico calado y mecanismo de cuarzo silencioso. Se cuelga con un solo tornillo.",
    },
    material: { en: "Oak + maple, hand assembled", fr: "Chêne et érable assemblés à la main", es: "Roble y maple ensamblados a mano" },
  },
  {
    id: "wood-geometric-coasters",
    cat: "madera",
    price: 46,
    img: woodGeometricCoasters,
    popular: false,
    rating: 4.8,
    reviewCount: 51,
    dimensions: "10 × 0.8 cm",
    lead: "h48",
    name: {
      en: "Mandala Coaster Set (set of 6)",
      fr: "Ensemble de sous-verres mandala (6)",
      es: "Set de posavasos mandala (x6)",
    },
    tag: { en: "6 + holder", fr: "6 + support", es: "6 + soporte" },
    desc: {
      en: "Six beech coasters engraved with intricate mandala patterns, cork backing and a matching holder.",
      fr: "Six sous-verres en hêtre gravés de mandalas complexes, endos en liège et support assorti.",
      es: "Seis posavasos de haya grabados con mandalas, base de corcho y soporte a juego.",
    },
    material: { en: "Beech + cork", fr: "Hêtre + liège", es: "Haya + corcho" },
  },

  /* ── 3D Printing ──────────────────────────────────── */
  {
    id: "3d-headphone-stand",
    cat: "3d",
    price: 52,
    img: p3dHeadphoneStand,
    popular: true,
    rating: 4.9,
    reviewCount: 95,
    dimensions: "26 × 16 cm",
    lead: "h24",
    name: {
      en: "Dual Headphone & Phone Stand",
      fr: "Support double casque et téléphone",
      es: "Soporte dual para audífonos y móvil",
    },
    tag: { en: "Top 3D seller", fr: "Top des ventes 3D", es: "Top ventas 3D" },
    desc: {
      en: "Matte-graphite desk stand with a wide padded yoke for your headset and a 60° phone cradle. Weighted base won't tip.",
      fr: "Support de bureau graphite mat avec arceau large pour le casque et berceau à 60° pour le téléphone. Base lestée.",
      es: "Soporte de escritorio en grafito mate con arco ancho para la diadema y base a 60° para el teléfono. Base con peso.",
    },
    material: { en: "Tough matte PLA", fr: "PLA mat renforcé", es: "PLA mate reforzado" },
  },
  {
    id: "3d-lithophane-lamp",
    cat: "3d",
    price: 79,
    img: p3dLithophaneLamp,
    popular: true,
    rating: 5.0,
    reviewCount: 76,
    dimensions: "14 × 20 cm",
    lead: "h48",
    name: {
      en: "360° Photo Lithophane Lamp",
      fr: "Lampe lithophane photo 360°",
      es: "Lámpara de litofanía fotográfica 360°",
    },
    tag: { en: "Fully personalized", fr: "Entièrement personnalisée", es: "100 % personalizable" },
    desc: {
      en: "Send up to four photos: they appear only when the warm dimmable LED base is switched on. The gift that surprises every time.",
      fr: "Envoyez jusqu'à quatre photos : elles apparaissent lorsque la base DEL chaude s'allume. Un cadeau qui surprend.",
      es: "Envía hasta cuatro fotos: aparecen al encender la base LED de luz cálida regulable. Un regalo que siempre sorprende.",
    },
    material: { en: "High-resolution PLA + wood base", fr: "PLA haute résolution + base en bois", es: "PLA de alta resolución + base de madera" },
  },
  {
    id: "3d-voronoi-planter",
    cat: "3d",
    price: 36,
    img: p3dVoronoiPlanter,
    popular: false,
    rating: 4.8,
    reviewCount: 52,
    dimensions: "13 × 12 cm",
    lead: "h24",
    name: {
      en: "Self-Watering Voronoi Planter",
      fr: "Pot Voronoï à réserve d'eau",
      es: "Maceta Voronoi con autorriego",
    },
    tag: { en: "Parametric design", fr: "Design paramétrique", es: "Diseño paramétrico" },
    desc: {
      en: "Cellular outer shell with a watertight inner pot and cotton wick — two weeks of hands-off watering for succulents.",
      fr: "Coque cellulaire avec pot intérieur étanche et mèche de coton : deux semaines d'arrosage automatique.",
      es: "Carcasa celular con maceta interior estanca y mecha de algodón: dos semanas de riego automático.",
    },
    material: { en: "Recyclable PETG", fr: "PETG recyclable", es: "PETG reciclable" },
  },
  {
    id: "3d-dice-tower",
    cat: "3d",
    price: 66,
    img: p3dDiceTower,
    popular: true,
    rating: 5.0,
    reviewCount: 88,
    dimensions: "18 × 14 × 22 cm",
    lead: "d23",
    name: {
      en: "RPG Fortress Dice Tower",
      fr: "Tour à dés Forteresse RPG",
      es: "Torre de dados Fortaleza RPG",
    },
    tag: { en: "Gaming & RPG", fr: "Jeux et JDR", es: "Gamer y rol" },
    desc: {
      en: "Spiral internal staircase for fair, quiet rolls, plus a magnetic felt-lined tray that never lets dice off the table.",
      fr: "Escalier interne en spirale pour des lancers justes et discrets, avec plateau feutré magnétique.",
      es: "Escalinata interna en espiral para tiradas justas y silenciosas, con bandeja imantada forrada en fieltro.",
    },
    material: { en: "Stone-textured PLA", fr: "PLA texture pierre", es: "PLA texturizado piedra" },
  },
  {
    id: "3d-gridfinity-organizer",
    cat: "3d",
    price: 48,
    img: p3dGridfinity,
    popular: true,
    rating: 4.9,
    reviewCount: 63,
    dimensions: "42 mm modules",
    lead: "h48",
    name: {
      en: "Modular Drawer Organizer System",
      fr: "Système modulaire de tiroir",
      es: "Sistema modular para cajón",
    },
    tag: { en: "Productivity", fr: "Productivité", es: "Productividad" },
    desc: {
      en: "Eight magnetic interlocking bins on the open Gridfinity standard — cables, bits, drives and desk clutter, finally sorted.",
      fr: "Huit bacs magnétiques emboîtables au standard ouvert Gridfinity : câbles, embouts et accessoires enfin rangés.",
      es: "Ocho bandejas magnéticas encajables con estándar abierto Gridfinity: cables, brocas y accesorios por fin ordenados.",
    },
    material: { en: "Impact-resistant PLA", fr: "PLA résistant aux chocs", es: "PLA resistente a impactos" },
  },

  /* ── Healthy Desserts ─────────────────────────────── */
  {
    id: "dessert-keto-brownies",
    cat: "postres",
    price: 34,
    img: dessertKetoBrownies,
    popular: true,
    rating: 5.0,
    reviewCount: 112,
    dimensions: "6 × 480 g",
    lead: "daily",
    name: {
      en: "Keto Dark Cacao Brownies (6)",
      fr: "Brownies keto cacao noir (6)",
      es: "Brownies keto de cacao puro (6)",
    },
    tag: { en: "No added sugar", fr: "Sans sucre ajouté", es: "Sin azúcar añadida" },
    desc: {
      en: "Dense, fudgy brownies made with almond flour, virgin coconut oil, 80% cacao and pecans. Sweetened with allulose: 2.5 g net carbs.",
      fr: "Brownies fondants à la farine d'amande, huile de coco vierge, cacao 80 % et pacanes. Sucrés à l'allulose : 2,5 g de glucides nets.",
      es: "Brownies densos con harina de almendras, aceite de coco virgen, cacao 80 % y nuez pecana. Endulzados con alulosa: 2,5 g de carbos netos.",
    },
    material: { en: "Keto · gluten-free", fr: "Keto · sans gluten", es: "Keto · sin gluten" },
  },
  {
    id: "dessert-protein-cupcakes",
    cat: "postres",
    price: 28,
    img: dessertProteinCupcakes,
    popular: true,
    rating: 4.9,
    reviewCount: 84,
    dimensions: "Pack of 4",
    lead: "daily",
    name: {
      en: "Berry Protein Cupcakes (4)",
      fr: "Petits gâteaux protéinés aux baies (4)",
      es: "Cupcakes proteicos de frutos rojos (4)",
    },
    tag: { en: "18 g protein each", fr: "18 g de protéines", es: "18 g de proteína" },
    desc: {
      en: "Fluffy oat-flour cupcakes with whey isolate, topped with light Greek yogurt frosting and fresh blueberries.",
      fr: "Petits gâteaux moelleux à la farine d'avoine et isolat de lactosérum, glaçage léger au yogourt grec et bleuets frais.",
      es: "Cupcakes esponjosos de harina de avena con proteína isolate, frosting ligero de yogur griego y arándanos frescos.",
    },
    material: { en: "Gluten-free oats + whey isolate", fr: "Avoine sans gluten + isolat", es: "Avena sin gluten + isolate" },
  },
  {
    id: "dessert-raw-tarts",
    cat: "postres",
    price: 32,
    img: dessertRawTarts,
    popular: false,
    rating: 4.9,
    reviewCount: 43,
    dimensions: "Pack of 4",
    lead: "h24",
    name: {
      en: "Raw Fresh Fruit Tarts (4)",
      fr: "Tartelettes crues aux fruits frais (4)",
      es: "Tartaletas raw de fruta fresca (4)",
    },
    tag: { en: "100% plant based", fr: "100 % végétal", es: "100 % vegetal" },
    desc: {
      en: "No-bake tartlets on a crunchy nut crust with cashew cream, finished with strawberries, blueberries and kiwi.",
      fr: "Tartelettes sans cuisson sur croûte de noix, crème de cajou, fraises, bleuets et kiwi.",
      es: "Tartaletas sin horno con base crujiente de frutos secos, crema de anacardo, fresas, arándanos y kiwi.",
    },
    material: { en: "Vegan · gluten-free · raw", fr: "Végane · sans gluten · cru", es: "Vegano · sin gluten · raw" },
  },
  {
    id: "dessert-birthday-cake",
    cat: "postres",
    price: 68,
    img: dessertBirthdayCake,
    popular: true,
    rating: 5.0,
    reviewCount: 78,
    dimensions: "18 cm ø · 8–10 slices",
    lead: "reserve48",
    name: {
      en: "Berry Bliss Fit Birthday Cake",
      fr: "Gâteau d'anniversaire santé aux baies",
      es: "Torta de cumpleaños fit Berry Bliss",
    },
    tag: { en: "Healthy celebration", fr: "Fête santé", es: "Celebración saludable" },
    desc: {
      en: "Three layers of bourbon-vanilla sponge with low-carb keto chantilly, finished with strawberries, blackberries and blueberries.",
      fr: "Trois étages de génoise vanille bourbon, chantilly keto faible en glucides, fraises, mûres et bleuets.",
      es: "Tres capas de bizcocho de vainilla bourbon con chantilly keto baja en carbohidratos, fresas, moras y arándanos.",
    },
    material: { en: "Low glycemic index", fr: "Faible indice glycémique", es: "Bajo índice glucémico" },
  },
  {
    id: "dessert-cheesecake-jar",
    cat: "postres",
    price: 19,
    img: dessertCheesecakeJar,
    popular: false,
    rating: 4.9,
    reviewCount: 46,
    dimensions: "250 ml",
    lead: "daily",
    name: {
      en: "Cheesecake Jar, Single Serve",
      fr: "Gâteau au fromage en pot",
      es: "Cheesecake individual en frasco",
    },
    tag: { en: "Gourmet single serve", fr: "Portion gourmande", es: "Individual gourmet" },
    desc: {
      en: "Creamy cheesecake in a reusable glass jar with an almond crust and house-made berry coulis. Perfect for corporate gifting.",
      fr: "Gâteau au fromage crémeux en pot de verre réutilisable, croûte d'amande et coulis maison. Parfait en cadeau d'entreprise.",
      es: "Cheesecake cremoso en frasco de vidrio reutilizable, base de almendra y coulis artesanal. Ideal para regalos corporativos.",
    },
    material: { en: "Reusable 250 ml glass jar", fr: "Pot en verre réutilisable 250 ml", es: "Frasco de vidrio reutilizable 250 ml" },
  },

  /* ── 3D Toys & Fidgets ────────────────────────────── */
  {
    id: "toy-crystal-dragon",
    cat: "juguetes",
    price: 62,
    img: toyCrystalDragon,
    popular: true,
    rating: 5.0,
    reviewCount: 128,
    dimensions: "35 cm",
    lead: "h24",
    name: {
      en: "Articulated Crystal Dragon, 35 cm",
      fr: "Dragon articulé Crystal, 35 cm",
      es: "Dragón articulado Crystal, 35 cm",
    },
    tag: { en: "#1 best seller", fr: "N° 1 des ventes", es: "N.º 1 en ventas" },
    desc: {
      en: "Printed in one continuous piece in emerald-and-gold silk filament, with 40+ movable vertebrae that ripple in your hand.",
      fr: "Imprimé d'une seule pièce en filament soie émeraude et or, avec plus de 40 vertèbres mobiles.",
      es: "Impreso en una sola pieza continua en filamento seda esmeralda y oro, con más de 40 vértebras móviles.",
    },
    material: { en: "Eco silk PLA", fr: "PLA soie écologique", es: "PLA seda ecológico" },
  },
  {
    id: "toy-flexi-octopus",
    cat: "juguetes",
    price: 26,
    img: toyFlexiOctopus,
    popular: true,
    rating: 4.8,
    reviewCount: 79,
    dimensions: "12 × 6 cm",
    lead: "h24",
    name: {
      en: "Flexi Octopus Fidget",
      fr: "Poulpe articulé antistress",
      es: "Pulpo fidget articulado",
    },
    tag: { en: "Sensory & tactile", fr: "Sensoriel et tactile", es: "Sensorial y táctil" },
    desc: {
      en: "Eight articulated tentacles that ripple with the smallest movement. Iridescent finish, no assembly, no small parts.",
      fr: "Huit tentacules articulés qui ondulent au moindre mouvement. Fini irisé, sans assemblage ni petites pièces.",
      es: "Ocho tentáculos articulados que ondulan con el menor movimiento. Acabado tornasolado, sin armar ni piezas pequeñas.",
    },
    material: { en: "Pearlescent silk PLA", fr: "PLA soie nacré", es: "PLA seda perlado" },
  },
  {
    id: "toy-puzzle-cube",
    cat: "juguetes",
    price: 38,
    img: toyPuzzleCube,
    popular: false,
    rating: 4.9,
    reviewCount: 44,
    dimensions: "12 × 5 cm",
    lead: "h48",
    name: {
      en: "Secret Maze Puzzle Cylinder",
      fr: "Cylindre-labyrinthe secret",
      es: "Cilindro laberinto secreto",
    },
    tag: { en: "Brain teaser", fr: "Casse-tête", es: "Desafío mental" },
    desc: {
      en: "A three-stage internal maze guards a hidden compartment — a memorable way to hand over keys, cash or a proposal ring.",
      fr: "Un labyrinthe interne à trois étapes protège un compartiment caché : idéal pour offrir clés, argent ou bague.",
      es: "Un laberinto interno de tres etapas protege un compartimento oculto: perfecto para entregar llaves, dinero o un anillo.",
    },
    material: { en: "Matte textured PLA", fr: "PLA texturé mat", es: "PLA texturizado mate" },
  },
  {
    id: "toy-infinity-cube",
    cat: "juguetes",
    price: 24,
    img: toyInfinityCube,
    popular: true,
    rating: 4.7,
    reviewCount: 68,
    dimensions: "4 × 4 × 4 cm",
    lead: "h24",
    name: {
      en: "Infinity Fidget Cube",
      fr: "Cube antistress infini",
      es: "Cubo fidget infinito",
    },
    tag: { en: "Focus & calm", fr: "Concentration et calme", es: "Enfoque y calma" },
    desc: {
      en: "Print-in-place hinges fold endlessly in the hand — quiet enough for the classroom, satisfying enough for the boardroom.",
      fr: "Charnières imprimées d'un seul tenant qui se plient à l'infini : discret en classe, satisfaisant au bureau.",
      es: "Bisagras impresas en una pieza que se pliegan sin fin: silencioso en clase y satisfactorio en la oficina.",
    },
    material: { en: "Satin-finish PLA", fr: "PLA fini satiné", es: "PLA con acabado satinado" },
  },
  {
    id: "toy-kinetic-gyro",
    cat: "juguetes",
    price: 36,
    img: toyKineticGyro,
    popular: true,
    rating: 4.9,
    reviewCount: 82,
    dimensions: "8 × 8 × 3 cm",
    lead: "h24",
    name: {
      en: "Kinetic Gimbal Spinner",
      fr: "Gyroscope cinétique cardan",
      es: "Giroscopio cinético cardánico",
    },
    tag: { en: "3-minute spin", fr: "Rotation de 3 min", es: "Giro de 3 min" },
    desc: {
      en: "Concentric rings spin on ceramic bearings across three planes for up to three minutes on a single flick.",
      fr: "Des anneaux concentriques tournent sur roulements céramiques dans trois plans, jusqu'à trois minutes.",
      es: "Aros concéntricos giran sobre rodamientos cerámicos en tres planos hasta por tres minutos.",
    },
    material: { en: "Metal alloy + ceramic bearing", fr: "Alliage métallique + roulement céramique", es: "Aleación metálica + rodamiento cerámico" },
  },
];
