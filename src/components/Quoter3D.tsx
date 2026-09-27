"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { toast } from "sonner";
import { useI18n } from "@/i18n";
import type { Lang, Tri } from "@/i18n/lang";
import { 
  Box, 
  RotateCcw, 
  Play, 
  Pause, 
  Grid as GridIcon, 
  Layers, 
  UploadCloud, 
  Sparkles, 
  Check, 
  Clock, 
  Scale, 
  ShieldCheck, 
  ShoppingCart,
  Maximize2,
  Wand2,
  Download,
  Loader2,
  Image as ImageIcon,
  RefreshCw
} from "lucide-react";
import { streamImage } from "@/lib/streamImage";
import {
  sampleHeightField,
  buildReliefGeometry,
  exportGeometryToStl,
  type ReliefShape,
} from "@/lib/relief";

export interface QuotedItem {
  id: string;
  name: string;
  price: number;
  details?: string;
}

interface Quoter3DProps {
  onAddToCart?: (item: QuotedItem) => void;
}

// Engineering Material Specs
export const MATERIALS = [
  {
    id: "pla-eco",
    name: "PLA+ Eco Pro",
    tag: "Standard & decorative",
    density: 1.24, // g/cm³
    pricePerCm3: 0.12,
    baseCost: 3.5,
    speedFactor: 1.0,
    desc: "Biodegradable, dimensionally stable and a clean cosmetic finish with no warping.",
    properties: ["High stiffness", "Eco-friendly", "Crisp detail"],
  },
  {
    id: "petg-tough",
    name: "PETG Tough Industrial",
    tag: "Mechanical & outdoor use",
    density: 1.27,
    pricePerCm3: 0.18,
    baseCost: 4.5,
    speedFactor: 1.15,
    desc: "Heat resistant to 75 °C, strong impact absorption plus chemical and UV resistance.",
    properties: ["Heat resistant", "Impact proof", "Heavy duty"],
  },
  {
    id: "resin-12k",
    name: "Resina UV 12K Tough",
    tag: "Ultra high definition",
    density: 1.15,
    pricePerCm3: 0.35,
    baseCost: 8.0,
    speedFactor: 1.4,
    desc: "Optical resolution with imperceptible 25-50 micron layers. Ideal for miniatures.",
    properties: ["25 micron layers", "Smooth surface", "Maximum precision"],
  },
  {
    id: "nylon-pa12",
    name: "Nylon PA12 SLS",
    tag: "Industrial grade engineering",
    density: 1.01,
    pricePerCm3: 0.52,
    baseCost: 12.0,
    speedFactor: 1.6,
    desc: "Aerospace-grade polyamide with maximum toughness against cyclic fatigue.",
    properties: ["Indestructible", "Aerospace grade", "Friction resistant"],
  },
  {
    id: "tpu-flex",
    name: "TPU Flexible 95A",
    tag: "Elastomer & gaskets",
    density: 1.21,
    pricePerCm3: 0.28,
    baseCost: 6.0,
    speedFactor: 1.8,
    desc: "Rubber-like thermoplastic elastomer that absorbs vibration, impact and pressure.",
    properties: ["Flexible 95A", "Shock absorbing", "Elastic memory"],
  },
];

// Color Palette with Metallic / Roughness characteristics
export const COLOR_OPTIONS = [
  { name: "Matte carbon black", hex: "#1f2328", roughness: 0.6, metalness: 0.1 },
  { name: "Arctic white", hex: "#f8f9fa", roughness: 0.4, metalness: 0.05 },
  { name: "Sunset orange", hex: "#ff5722", roughness: 0.35, metalness: 0.1 },
  { name: "Electric cobalt blue", hex: "#1d4ed8", roughness: 0.3, metalness: 0.2 },
  { name: "Pearl silk gold", hex: "#d4af37", roughness: 0.25, metalness: 0.6 },
  { name: "Emerald silk green", hex: "#059669", roughness: 0.28, metalness: 0.4 },
  { name: "Satin titanium grey", hex: "#64748b", roughness: 0.45, metalness: 0.5 },
];

// Presets that can be generated procedurally
type PresetKey = "dice-tower" | "helical-gear" | "voronoi-vase" | "lowpoly-skull";

interface PresetItem {
  id: PresetKey;
  name: string;
  category: string;
  estimatedVolumeCm3: number;
  dimensionsMm: [number, number, number];
}

const PRESETS: PresetItem[] = [
  {
    id: "dice-tower",
    name: "RPG Fortress Dice Tower",
    category: "Gaming accessories",
    estimatedVolumeCm3: 64.5,
    dimensionsMm: [72, 72, 120],
  },
  {
    id: "helical-gear",
    name: "Mechanical Helical Gear",
    category: "Engineering & robotics",
    estimatedVolumeCm3: 38.2,
    dimensionsMm: [80, 80, 35],
  },
  {
    id: "voronoi-vase",
    name: "Parametric Sculptural Vase",
    category: "Decor & design",
    estimatedVolumeCm3: 52.8,
    dimensionsMm: [75, 75, 110],
  },
  {
    id: "lowpoly-skull",
    name: "Low-Poly Faceted Monolith",
    category: "Collectible & art",
    estimatedVolumeCm3: 41.6,
    dimensionsMm: [65, 70, 85],
  },
];


// Trilingual strings for the Maker Studio (English source keys)
const QT: Record<string, Tri> = {
  models: { en: "Models:", fr: "Modèles :", es: "Modelos:" },
  triangles: { en: "triangles", fr: "triangles", es: "triángulos" },
  pause: { en: "Pause rotation", fr: "Pauser la rotation", es: "Pausar rotación" },
  spin: { en: "Auto-rotate", fr: "Rotation auto", es: "Girar automáticamente" },
  center: { en: "Center view", fr: "Centrer la vue", es: "Centrar vista" },
  wire: { en: "Wireframe mode", fr: "Mode filaire", es: "Modo malla" },
  grid: { en: "Show/hide grid", fr: "Afficher/masquer la grille", es: "Mostrar/ocultar cuadrícula" },
  dims: { en: "Dimensions (X × Y × Z)", fr: "Dimensions (X × Y × Z)", es: "Dimensiones (X × Y × Z)" },
  volume: { en: "Actual volume", fr: "Volume réel", es: "Volumen real" },
  weight: { en: "Estimated weight", fr: "Poids estimé", es: "Peso estimado" },
  upload: { en: "Upload my STL", fr: "Téléverser mon STL", es: "Subir mi STL" },
  analyzingShort: { en: "Analyzing...", fr: "Analyse...", es: "Analizando..." },
  analyzing: { en: "Analyzing 3D geometry and computing volume...", fr: "Analyse de la géométrie 3D et du volume...", es: "Analizando geometría 3D y calculando volumen..." },
  analyzed: { en: "model analyzed successfully", fr: "modèle analysé avec succès", es: "modelo analizado con éxito" },
  loaded: { en: "Model loaded", fr: "Modèle chargé", es: "Modelo cargado" },
  errExt: { en: "Please choose a valid .STL file", fr: "Veuillez choisir un fichier .STL valide", es: "Selecciona un archivo .STL válido" },
  errEmpty: { en: "This STL file has no valid vertices.", fr: "Ce fichier STL n'a aucun sommet valide.", es: "El archivo STL no contiene vértices válidos." },
  errParse: { en: "Could not process the STL file", fr: "Impossible de traiter le fichier STL", es: "No se pudo procesar el archivo STL" },
  params: { en: "Manufacturing parameters", fr: "Paramètres de fabrication", es: "Parámetros de fabricación" },
  modelConfig: { en: "Model configuration", fr: "Configuration du modèle", es: "Configuración del modelo" },
  configHint: { en: "Adjust material, density and layer height to recalculate cost and time instantly.", fr: "Ajustez matériau, densité et hauteur de couche pour recalculer coût et durée.", es: "Ajusta material, densidad y altura de capa para recalcular costo y tiempo." },
  step1: { en: "1. Print material", fr: "1. Matériau d'impression", es: "1. Material de fabricación" },
  step2: { en: "2. Finish colour (live 3D shader)", fr: "2. Couleur du fini (rendu 3D en direct)", es: "2. Color de acabado (render 3D en vivo)" },
  infill: { en: "Infill", fr: "Remplissage", es: "Relleno (infill)" },
  light: { en: "light", fr: "léger", es: "ligero" },
  strong: { en: "strong", fr: "robuste", es: "robusto" },
  solid: { en: "solid", fr: "plein", es: "sólido" },
  layerRes: { en: "Layer resolution", fr: "Résolution de couche", es: "Resolución de capa" },
  Fine: { en: "Fine", fr: "Fine", es: "Fina" },
  Standard: { en: "Standard", fr: "Standard", es: "Estándar" },
  Fast: { en: "Fast", fr: "Rapide", es: "Rápida" },
  qty: { en: "Quantity:", fr: "Quantité :", es: "Cantidad:" },
  printTime: { en: "Estimated print time:", fr: "Temps d'impression estimé :", es: "Tiempo de impresión estimado:" },
  perPiece: { en: "per piece", fr: "par pièce", es: "por pieza" },
  qa: { en: "Geometry inspection & post-processing:", fr: "Inspection et post-traitement :", es: "Inspección geométrica y postproceso:" },
  qaIncluded: { en: "Included (±0.1 mm tolerance)", fr: "Inclus (tolérance ±0,1 mm)", es: "Incluido (tolerancia ±0,1 mm)" },
  estTotal: { en: "Estimated total quote", fr: "Devis total estimé", es: "Presupuesto total estimado" },
  each: { en: "each", fr: "ch.", es: "c/u" },
  addQuote: { en: "Add quote to cart", fr: "Ajouter le devis au panier", es: "Añadir cotización al carrito" },
  quoteAdded: { en: "Quote added", fr: "Devis ajouté", es: "Cotización añadida" },
  print3d: { en: "3D print", fr: "Impression 3D", es: "Impresión 3D" },

  // AI design step
  aiStep: { en: "Step 1 · Design your piece with AI", fr: "Étape 1 · Concevez votre pièce avec l'IA", es: "Paso 1 · Diseña tu pieza con IA" },
  aiHint: { en: "Describe the artwork you want to print. Review the image, then validate it in 3D and see the exact price before ordering.", fr: "Décrivez le visuel à imprimer. Vérifiez l'image, validez-la en 3D et voyez le prix exact avant de commander.", es: "Describe la imagen que quieres imprimir. Revísala, valídala en 3D y verás el precio exacto antes de ordenar." },
  aiPlaceholder: { en: "e.g. a mountain skyline with a maple leaf, clean high-contrast silhouette", fr: "ex. une chaîne de montagnes avec une feuille d'érable, silhouette nette", es: "ej. una cordillera con una hoja de maple, silueta nítida de alto contraste" },
  aiGenerate: { en: "Generate design", fr: "Générer le design", es: "Generar diseño" },
  aiGenerating: { en: "Generating...", fr: "Génération...", es: "Generando..." },
  aiRegenerate: { en: "Try another", fr: "Autre version", es: "Otra versión" },
  aiSample: { en: "Use sample idea", fr: "Idée d'exemple", es: "Usar idea de ejemplo" },
  aiEmpty: { en: "Your AI design preview will appear here", fr: "Votre aperçu IA apparaîtra ici", es: "Aquí aparecerá tu diseño generado" },
  aiPromptRequired: { en: "Describe your design first", fr: "Décrivez d'abord votre design", es: "Describe primero tu diseño" },
  aiValidate: { en: "Validate in 3D & quote", fr: "Valider en 3D et chiffrer", es: "Validar en 3D y cotizar" },
  aiRelief: { en: "3D relief settings", fr: "Réglages du relief 3D", es: "Ajustes del relieve 3D" },
  aiShape: { en: "Format", fr: "Format", es: "Formato" },
  plaque: { en: "Plaque", fr: "Plaque", es: "Placa" },
  medallion: { en: "Medallion", fr: "Médaillon", es: "Medallón" },
  aiWidth: { en: "Width / diameter", fr: "Largeur / diamètre", es: "Ancho / diámetro" },
  aiDepth: { en: "Relief depth", fr: "Profondeur du relief", es: "Profundidad del relieve" },
  aiBase: { en: "Base thickness", fr: "Épaisseur de base", es: "Espesor de la base" },
  aiInvert: { en: "Lithophane mode (dark = thick)", fr: "Mode lithophane (foncé = épais)", es: "Modo litofanía (oscuro = grueso)" },
  aiReady: { en: "3D relief ready — price updated", fr: "Relief 3D prêt — prix mis à jour", es: "Relieve 3D listo: precio actualizado" },
  aiFailed: { en: "Could not generate the design", fr: "Impossible de générer le design", es: "No se pudo generar el diseño" },
  aiStyle: { en: "Style", fr: "Style", es: "Estilo" },
  styleLine: { en: "Line art", fr: "Trait", es: "Línea" },
  styleRelief: { en: "Bas-relief", fr: "Bas-relief", es: "Bajorrelieve" },
  stylePhoto: { en: "Photo", fr: "Photo", es: "Foto" },
  styleLogo: { en: "Logo", fr: "Logo", es: "Logotipo" },
  downloadStl: { en: "Download STL", fr: "Télécharger le STL", es: "Descargar STL" },
  aiBuilding: { en: "Building 3D relief...", fr: "Construction du relief 3D...", es: "Construyendo relieve 3D..." },

  // Modes
  modeBasic: { en: "Easy mode", fr: "Mode simple", es: "Modo fácil" },
  modePro: { en: "Advanced", fr: "Avancé", es: "Avanzado" },
  modeBasicHint: { en: "Three steps: describe it, see it in 3D, get your price. We choose the technical settings for you.", fr: "Trois étapes : décrivez, visualisez en 3D, obtenez le prix. Nous choisissons les réglages techniques.", es: "Tres pasos: descríbelo, míralo en 3D y recibe el precio. Nosotros elegimos los ajustes técnicos." },
  modeProHint: { en: "Full control: materials, infill, layer height, presets and your own STL files.", fr: "Contrôle total : matériaux, remplissage, hauteur de couche, modèles et vos fichiers STL.", es: "Control total: materiales, relleno, altura de capa, modelos y tus propios archivos STL." },
  stepDesignLabel: { en: "Describe", fr: "Décrire", es: "Describir" },
  stepViewLabel: { en: "See in 3D", fr: "Voir en 3D", es: "Ver en 3D" },
  stepQuoteLabel: { en: "Price", fr: "Prix", es: "Precio" },
  sizeLabel: { en: "Size", fr: "Taille", es: "Tamaño" },
  sizeS: { en: "Small · 70 mm", fr: "Petit · 70 mm", es: "Pequeño · 70 mm" },
  sizeM: { en: "Medium · 110 mm", fr: "Moyen · 110 mm", es: "Mediano · 110 mm" },
  sizeL: { en: "Large · 160 mm", fr: "Grand · 160 mm", es: "Grande · 160 mm" },
  qualityLabel: { en: "Finish quality", fr: "Qualité de finition", es: "Calidad del acabado" },
  qualityEco: { en: "Economy", fr: "Économique", es: "Económico" },
  qualityBalanced: { en: "Recommended", fr: "Recommandé", es: "Recomendado" },
  qualityPremium: { en: "Premium detail", fr: "Détail premium", es: "Detalle premium" },
  qualityEcoHint: { en: "Lighter piece, lowest price", fr: "Pièce légère, prix minimal", es: "Pieza ligera, precio mínimo" },
  qualityBalancedHint: { en: "Best balance of detail and price", fr: "Meilleur équilibre détail/prix", es: "Mejor equilibrio entre detalle y precio" },
  qualityPremiumHint: { en: "Sharpest detail, sturdier part", fr: "Détail maximal, pièce plus solide", es: "Máximo detalle, pieza más resistente" },
  matEveryday: { en: "Everyday", fr: "Quotidien", es: "Uso diario" },
  matStrong: { en: "Extra strong", fr: "Très résistant", es: "Extra resistente" },
  matDetail: { en: "Fine detail", fr: "Détail fin", es: "Detalle fino" },
  autoTuned: { en: "Technical settings tuned automatically", fr: "Réglages techniques ajustés automatiquement", es: "Ajustes técnicos configurados automáticamente" },
  seeAllOptions: { en: "Need more control? Switch to Advanced", fr: "Besoin de plus de contrôle ? Passez en Avancé", es: "¿Quieres más control? Cambia a Avanzado" },
  ready: { en: "Ready", fr: "Prêt", es: "Listo" },


  // Materials
  "Standard & decorative": { en: "Standard & decorative", fr: "Standard et décoratif", es: "Estándar y decorativo" },
  "Biodegradable, dimensionally stable and a clean cosmetic finish with no warping.": { en: "Biodegradable, dimensionally stable and a clean cosmetic finish with no warping.", fr: "Biodégradable, stable et fini soigné sans gauchissement.", es: "Biodegradable, estable y con acabado limpio sin alabeo." },
  "High stiffness": { en: "High stiffness", fr: "Grande rigidité", es: "Rigidez alta" },
  "Eco-friendly": { en: "Eco-friendly", fr: "Écologique", es: "Ecológico" },
  "Crisp detail": { en: "Crisp detail", fr: "Détail net", es: "Detalle limpio" },
  "Mechanical & outdoor use": { en: "Mechanical & outdoor use", fr: "Usage mécanique et extérieur", es: "Uso mecánico y exterior" },
  "Heat resistant to 75 °C, strong impact absorption plus chemical and UV resistance.": { en: "Heat resistant to 75 °C, strong impact absorption plus chemical and UV resistance.", fr: "Résiste à 75 °C, absorbe les chocs, résistant aux produits chimiques et aux UV.", es: "Resiste 75 °C, absorbe impactos y resiste químicos y rayos UV." },
  "Heat resistant": { en: "Heat resistant", fr: "Résistant à la chaleur", es: "Resistente al calor" },
  "Impact proof": { en: "Impact proof", fr: "Antichoc", es: "Anti-impacto" },
  "Heavy duty": { en: "Heavy duty", fr: "Usage intensif", es: "Uso rudo" },
  "Ultra high definition": { en: "Ultra high definition", fr: "Ultra haute définition", es: "Ultra alta definición" },
  "Optical resolution with imperceptible 25-50 micron layers. Ideal for miniatures.": { en: "Optical resolution with imperceptible 25-50 micron layers. Ideal for miniatures.", fr: "Résolution optique avec couches de 25 à 50 microns. Idéal pour les miniatures.", es: "Resolución óptica con capas de 25 a 50 micras. Ideal para miniaturas." },
  "25 micron layers": { en: "25 micron layers", fr: "Couches de 25 µm", es: "Capas de 25 micras" },
  "Smooth surface": { en: "Smooth surface", fr: "Surface lisse", es: "Superficie lisa" },
  "Maximum precision": { en: "Maximum precision", fr: "Précision maximale", es: "Máxima precisión" },
  "Industrial grade engineering": { en: "Industrial grade engineering", fr: "Ingénierie de grade industriel", es: "Ingeniería de grado industrial" },
  "Aerospace-grade polyamide with maximum toughness against cyclic fatigue.": { en: "Aerospace-grade polyamide with maximum toughness against cyclic fatigue.", fr: "Polyamide de grade aérospatial, ténacité maximale à la fatigue cyclique.", es: "Poliamida de grado aeroespacial con máxima tenacidad a la fatiga cíclica." },
  Indestructible: { en: "Indestructible", fr: "Indestructible", es: "Indestructible" },
  "Aerospace grade": { en: "Aerospace grade", fr: "Grade aérospatial", es: "Grado aeroespacial" },
  "Friction resistant": { en: "Friction resistant", fr: "Résistant à la friction", es: "Resistente a la fricción" },
  "Elastomer & gaskets": { en: "Elastomer & gaskets", fr: "Élastomère et joints", es: "Elastómero y sellos" },
  "Rubber-like thermoplastic elastomer that absorbs vibration, impact and pressure.": { en: "Rubber-like thermoplastic elastomer that absorbs vibration, impact and pressure.", fr: "Élastomère thermoplastique qui absorbe vibrations, chocs et pression.", es: "Elastómero termoplástico que absorbe vibraciones, impactos y presión." },
  "Flexible 95A": { en: "Flexible 95A", fr: "Flexible 95A", es: "Flexible 95A" },
  "Shock absorbing": { en: "Shock absorbing", fr: "Amortisseur de chocs", es: "Antichoque" },
  "Elastic memory": { en: "Elastic memory", fr: "Mémoire élastique", es: "Memoria elástica" },

  // Colours
  "Matte carbon black": { en: "Matte carbon black", fr: "Noir carbone mat", es: "Negro carbón mate" },
  "Arctic white": { en: "Arctic white", fr: "Blanc arctique", es: "Blanco ártico" },
  "Sunset orange": { en: "Sunset orange", fr: "Orange coucher de soleil", es: "Naranja atardecer" },
  "Electric cobalt blue": { en: "Electric cobalt blue", fr: "Bleu cobalt électrique", es: "Azul cobalto eléctrico" },
  "Pearl silk gold": { en: "Pearl silk gold", fr: "Or soie perlé", es: "Oro seda perlado" },
  "Emerald silk green": { en: "Emerald silk green", fr: "Vert émeraude soie", es: "Verde esmeralda seda" },
  "Satin titanium grey": { en: "Satin titanium grey", fr: "Gris titane satiné", es: "Gris titanio satinado" },
};

const qFor = (lang: Lang) => (key: string) => QT[key]?.[lang] ?? key;

export function Quoter3D({ onAddToCart }: Quoter3DProps) {
  const { lang } = useI18n();
  const q = React.useMemo(() => qFor(lang), [lang]);

  // Model & File state
  const [selectedPreset, setSelectedPreset] = useState<PresetKey>("dice-tower");
  const [fileName, setFileName] = useState<string>("RPG_Fortress_Dice_Tower.stl");
  const [triangleCount, setTriangleCount] = useState<number>(18420);
  const [dimensions, setDimensions] = useState<{ x: number; y: number; z: number }>({ x: 72, y: 72, z: 120 });
  const [volumeCm3, setVolumeCm3] = useState<number>(64.5);
  const [isCustomUpload, setIsCustomUpload] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  // Print Configuration state
  const [materialId, setMaterialId] = useState<string>("pla-eco");
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[2]!); // Sunset orange
  const [infillPercent, setInfillPercent] = useState<number>(20);
  const [layerHeight, setLayerHeight] = useState<number>(0.20);
  const [quantity, setQuantity] = useState<number>(1);

  // AI design state (step 1: design the artwork, then validate it in 3D)
  const [designPrompt, setDesignPrompt] = useState<string>("");
  const [designStyle, setDesignStyle] = useState<string>("styleRelief");
  const [designImage, setDesignImage] = useState<string | null>(null);
  const [designIsFinal, setDesignIsFinal] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isBuildingRelief, setIsBuildingRelief] = useState<boolean>(false);
  const [reliefShape, setReliefShape] = useState<ReliefShape>("plaque");
  const [reliefWidth, setReliefWidth] = useState<number>(90);
  const [reliefDepth, setReliefDepth] = useState<number>(3);
  const [reliefBase, setReliefBase] = useState<number>(2);
  const [reliefInvert, setReliefInvert] = useState<boolean>(false);
  const [hasRelief, setHasRelief] = useState<boolean>(false);
  const reliefGeoRef = useRef<any>(null);

  // Studio mode: basic (guided) or pro (full control)
  const [mode, setMode] = useState<"basic" | "pro">("basic");
  useEffect(() => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem("jd-studio-mode") : null;
    if (saved === "pro" || saved === "basic") setMode(saved);
  }, []);
  const changeMode = (next: "basic" | "pro") => {
    setMode(next);
    if (typeof window !== "undefined") window.localStorage.setItem("jd-studio-mode", next);
  };
  const isBasic = mode === "basic";

  // Viewport toggles
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [wireframe, setWireframe] = useState<boolean>(false);
  const [showGrid, setShowGrid] = useState<boolean>(true);

  // Canvas Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<any>(null);
  const rendererRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const controlsRef = useRef<any>(null);
  const currentMeshRef = useRef<any>(null);
  const gridHelperRef = useRef<any>(null);
  const animationFrameIdRef = useRef<number | null>(null);

  // Active Material Info
  const activeMaterial = useMemo(() => {
    return MATERIALS.find((m) => m.id === materialId) || MATERIALS[0]!;
  }, [materialId]);

  // Pricing & Metrics Formula
  const { partWeightGrams, printTimeMinutes, unitPrice, totalPrice } = useMemo(() => {
    // Effective volume factoring in infill percentage
    // Shell is ~25% of solid volume at 100%, interior volume scales with infill
    const shellVolumeRatio = 0.30;
    const coreVolumeRatio = 0.70;
    const effectiveVolumeCm3 = volumeCm3 * (shellVolumeRatio + coreVolumeRatio * (infillPercent / 100));

    // Weight in grams = Volume (cm³) * Density (g/cm³)
    const weightGrams = Math.round(effectiveVolumeCm3 * activeMaterial.density);

    // Height in layers
    const totalLayers = Math.round(dimensions.z / layerHeight);
    
    // Print time estimate (minutes): base calibration + volume extrusion + layer transitions
    const baseMinutes = 20;
    const extrusionMinutes = effectiveVolumeCm3 * 1.8 * activeMaterial.speedFactor;
    const layerMinutes = totalLayers * 0.08 * activeMaterial.speedFactor;
    const timeMinutes = Math.round(baseMinutes + extrusionMinutes + layerMinutes);

    // Cost Breakdown:
    // 1. Material cost
    const materialCost = effectiveVolumeCm3 * activeMaterial.pricePerCm3;
    // 2. Machine operating cost ($2.20/hour)
    const machineCost = (timeMinutes / 60) * 2.20;
    // 3. Setup & QA inspect
    const setupCost = activeMaterial.baseCost;

    const rawUnitPrice = Math.max(8.0, materialCost + machineCost + setupCost);
    const unit = Math.round(rawUnitPrice * 100) / 100;
    const total = Math.round(unit * quantity * 100) / 100;

    return {
      partWeightGrams: weightGrams,
      printTimeMinutes: timeMinutes,
      unitPrice: unit,
      totalPrice: total,
    };
  }, [volumeCm3, infillPercent, activeMaterial, layerHeight, dimensions.z, quantity]);

  // Format print time humanly
  const formattedTime = useMemo(() => {
    const hours = Math.floor(printTimeMinutes / 60);
    const minutes = printTimeMinutes % 60;
    if (hours === 0) return `${minutes} min`;
    return `${hours}h ${minutes}m`;
  }, [printTimeMinutes]);

  // Compute exact volume of a BufferGeometry using signed tetrahedrons
  const calculateGeometryVolume = (geo: any): number => {
    let position = geo.attributes.position;
    let faces = position.count / 3;
    let totalVolume = 0;
    const p1 = new THREE.Vector3();
    const p2 = new THREE.Vector3();
    const p3 = new THREE.Vector3();

    for (let i = 0; i < faces; i++) {
      p1.fromBufferAttribute(position, i * 3 + 0);
      p2.fromBufferAttribute(position, i * 3 + 1);
      p3.fromBufferAttribute(position, i * 3 + 2);
      // Signed volume of tetrahedron from origin: (1/6) * (p1 . (p2 x p3))
      totalVolume += p1.dot(p2.cross(p3)) / 6.0;
    }

    // Convert from mm³ to cm³
    const volumeCm3 = Math.abs(totalVolume) / 1000.0;
    return Math.max(1.0, Math.round(volumeCm3 * 10) / 10);
  };

  // Build Procedural Geometries
  const createPresetGeometry = (key: PresetKey): any => {
    switch (key) {
      case "dice-tower": {
        // Multi-level fortress tower
        const baseGeo = new THREE.CylinderGeometry(28, 34, 40, 8);
        baseGeo.translate(0, 20, 0);
        const shaftGeo = new THREE.CylinderGeometry(24, 28, 60, 8);
        shaftGeo.translate(0, 70, 0);
        const crownGeo = new THREE.CylinderGeometry(30, 24, 20, 8);
        crownGeo.translate(0, 110, 0);
        
        // Simple composite via merging geometries
        const group = new THREE.Group();
        group.add(new THREE.Mesh(baseGeo));
        group.add(new THREE.Mesh(shaftGeo));
        group.add(new THREE.Mesh(crownGeo));
        
        // Return cylinder for clean single buffer
        const geo = new THREE.CylinderGeometry(26, 32, 120, 16, 8);
        // Twist slightly
        const pos = geo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
          const y = pos.getY(i);
          const angle = (y / 120) * 0.8;
          const x = pos.getX(i);
          const z = pos.getZ(i);
          pos.setX(i, x * Math.cos(angle) - z * Math.sin(angle));
          pos.setZ(i, x * Math.sin(angle) + z * Math.cos(angle));
        }
        geo.computeVertexNormals();
        return geo;
      }
      case "helical-gear": {
        // High-detail gear with helical teeth
        const geo = new THREE.CylinderGeometry(38, 38, 30, 32, 12);
        const pos = geo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
          const y = pos.getY(i);
          const x = pos.getX(i);
          const z = pos.getZ(i);
          const radius = Math.sqrt(x * x + z * z);
          if (radius > 30) {
            const angle = Math.atan2(z, x) + (y / 30) * 0.6;
            const tooth = Math.sin(angle * 14) * 4.5;
            pos.setX(i, (radius + tooth) * Math.cos(angle));
            pos.setZ(i, (radius + tooth) * Math.sin(angle));
          }
        }
        geo.computeVertexNormals();
        return geo;
      }
      case "voronoi-vase": {
        // Fluted sculpted vase
        const geo = new THREE.CylinderGeometry(26, 34, 110, 24, 32);
        const pos = geo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
          const y = pos.getY(i);
          const x = pos.getX(i);
          const z = pos.getZ(i);
          const angle = Math.atan2(z, x);
          const flute = Math.sin(angle * 8 + (y / 110) * 4) * 4.0;
          const waist = Math.sin((y / 110 + 0.5) * Math.PI) * 6.0;
          const r = Math.sqrt(x * x + z * z) + flute - waist;
          pos.setX(i, r * Math.cos(angle));
          pos.setZ(i, r * Math.sin(angle));
        }
        geo.computeVertexNormals();
        return geo;
      }
      case "lowpoly-skull": {
        // Faceted collectible polygonal form
        const geo = new THREE.DodecahedronGeometry(35, 1);
        const pos = geo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
          const y = pos.getY(i);
          if (y < 0) {
            // Taper bottom jaw
            pos.setX(i, pos.getX(i) * 0.75);
            pos.setZ(i, pos.getZ(i) * 0.85);
          }
        }
        // Force flat faceted shading
        return geo.toNonIndexed();
      }
    }
  };

  // Apply geometry to scene
  const applyGeometryToScene = (geo: any, title: string) => {
    if (!sceneRef.current) return;

    geo.computeBoundingBox();
    const bbox = geo.boundingBox!;
    const size = new THREE.Vector3();
    bbox.getSize(size);

    // Update state dimensions (rounded to mm)
    setDimensions({
      x: Math.round(size.x * 10) / 10 || 50,
      y: Math.round(size.y * 10) / 10 || 50,
      z: Math.round(size.z * 10) / 10 || 50,
    });

    const triCount = geo.attributes.position.count / 3;
    setTriangleCount(Math.round(triCount));

    // Center geometry around origin
    geo.center();
    // Lift so it sits directly on top of the grid plane (y=0)
    geo.computeBoundingBox();
    const newBox = geo.boundingBox!;
    const minY = newBox.min.y;
    geo.translate(0, -minY, 0);

    // Calculate volume
    const calculatedVol = calculateGeometryVolume(geo);
    setVolumeCm3(calculatedVol);

    // Remove previous mesh
    if (currentMeshRef.current) {
      sceneRef.current.remove(currentMeshRef.current);
      currentMeshRef.current.geometry.dispose();
    }

    // Material with high-end PBR reflections
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(selectedColor.hex),
      roughness: selectedColor.roughness,
      metalness: selectedColor.metalness,
      wireframe: wireframe,
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    sceneRef.current.add(mesh);
    currentMeshRef.current = mesh;

    // Adjust camera distance nicely
    if (cameraRef.current && controlsRef.current) {
      const maxDim = Math.max(size.x, size.y, size.z, 50);
      cameraRef.current.position.set(maxDim * 1.5, maxDim * 1.2, maxDim * 1.8);
      controlsRef.current.target.set(0, size.y * 0.45, 0);
      controlsRef.current.update();
    }
  };

  // Mount Three.js Viewport
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight || 480;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color("#0c1117");

    // Camera
    const camera = new THREE.PerspectiveCamera(42, width / height, 1, 2000);
    camera.position.set(120, 100, 150);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.replaceChildren(renderer.domElement);
    rendererRef.current = renderer;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 + 0.05; // don't go below floor
    controls.minDistance = 30;
    controls.maxDistance = 600;
    controlsRef.current = controls;

    // Studio Lighting
    const ambientLight = new THREE.AmbientLight("#e2e8f0", 0.65);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight("#ffffff", 1.8);
    mainLight.position.set(80, 140, 90);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    mainLight.shadow.camera.near = 10;
    mainLight.shadow.camera.far = 400;
    mainLight.shadow.bias = -0.0005;
    const d = 100;
    mainLight.shadow.camera.left = -d;
    mainLight.shadow.camera.right = d;
    mainLight.shadow.camera.top = d;
    mainLight.shadow.camera.bottom = -d;
    scene.add(mainLight);

    const rimLight = new THREE.DirectionalLight("#38bdf8", 1.2);
    rimLight.position.set(-100, 60, -90);
    scene.add(rimLight);

    const warmFill = new THREE.DirectionalLight("#f59e0b", 0.8);
    warmFill.position.set(0, -50, 80);
    scene.add(warmFill);

    // Floor Grid Helper & Shadow receiver
    const grid = new THREE.GridHelper(220, 22, "#334155", "#1e293b");
    grid.position.y = 0;
    scene.add(grid);
    gridHelperRef.current = grid;

    const floorPlaneGeo = new THREE.PlaneGeometry(300, 300);
    const floorMat = new THREE.ShadowMaterial({ opacity: 0.35 });
    const floorMesh = new THREE.Mesh(floorPlaneGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.y = -0.1;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    // Load initial preset
    const initialGeo = createPresetGeometry(selectedPreset);
    applyGeometryToScene(initialGeo, PRESETS[0]!.name);

    // Animation Loop
    let clock = new THREE.Clock();
    const animate = () => {
      animationFrameIdRef.current = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      if (controlsRef.current) {
        controlsRef.current.autoRotate = autoRotate;
        controlsRef.current.autoRotateSpeed = 2.0;
        controlsRef.current.update();
      }

      renderer.render(scene, camera);
    };
    animate();

    // Resize Observer
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight || 480;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // Cleanup
    return () => {
      resizeObserver.disconnect();
      if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
      renderer.dispose();
    };
  }, []);

  // Sync Color / Wireframe Changes
  useEffect(() => {
    if (!currentMeshRef.current) return;
    const mat = currentMeshRef.current.material as any;
    if (mat) {
      mat.color.set(selectedColor.hex);
      mat.roughness = selectedColor.roughness;
      mat.metalness = selectedColor.metalness;
      mat.wireframe = wireframe;
      mat.needsUpdate = true;
    }
  }, [selectedColor, wireframe]);

  // Sync Grid Toggle
  useEffect(() => {
    if (gridHelperRef.current) {
      gridHelperRef.current.visible = showGrid;
    }
  }, [showGrid]);

  // Preset Selection Handler
  const handleSelectPreset = (key: PresetKey) => {
    setSelectedPreset(key);
    setIsCustomUpload(false);
    const preset = PRESETS.find((p) => p.id === key);
    if (preset) {
      setFileName(`${preset.name.replace(/\s+/g, "_")}.stl`);
      const geo = createPresetGeometry(key);
      applyGeometryToScene(geo, preset.name);
      toast.success(`${q("loaded")}: ${preset.name}`);
    }
  };

  // Parse & Load Custom STL File
  const processSTLFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".stl")) {
      toast.error(q("errExt"));
      return;
    }

    setIsAnalyzing(true);
    const toastId = toast.loading(q("analyzing"));

    try {
      const buffer = await file.arrayBuffer();
      const loader = new STLLoader();
      const geometry = loader.parse(buffer);

      if (!geometry || geometry.attributes.position.count === 0) {
        throw new Error(q("errEmpty"));
      }

      setFileName(file.name);
      setIsCustomUpload(true);
      applyGeometryToScene(geometry, file.name);

      toast.dismiss(toastId);
      toast.success(`${file.name} — ${q("analyzed")}`);
    } catch (err: any) {
      toast.dismiss(toastId);
      toast.error(err?.message || q("errParse"));
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ---- AI design flow: prompt -> image -> 3D relief -> instant quote ----
  const STYLE_HINTS: Record<string, string> = {
    styleLine: "bold clean line art, pure black lines on white, no shading, no text",
    styleRelief: "grayscale bas-relief sculpture depth map, smooth gradients, centered subject, plain background, no text",
    stylePhoto: "high contrast grayscale photographic subject, centered, plain light background, no text",
    styleLogo: "minimal emblem silhouette, solid black shape on white, no lettering",
  };

  const SAMPLE_PROMPTS = [
    "Rocky Mountain skyline with a maple leaf, bas-relief medallion",
    "Family portrait silhouette inside a heart frame",
    "Geometric bear head emblem for a wall plaque",
  ];

  const handleGenerateDesign = async () => {
    const base = designPrompt.trim();
    if (!base) {
      toast.error(q("aiPromptRequired"));
      return;
    }
    setIsGenerating(true);
    setDesignIsFinal(false);
    setDesignImage(null);
    const fullPrompt = `${base}. ${STYLE_HINTS[designStyle]}. Square composition suitable for a 3D printed relief: strong depth separation, no text or watermarks.`;
    try {
      await streamImage("/api/design-image", fullPrompt, (dataUrl, isFinal) => {
        setDesignImage(dataUrl);
        setDesignIsFinal(isFinal);
      });
    } catch (err: any) {
      toast.error(err?.message || q("aiFailed"));
    } finally {
      setIsGenerating(false);
    }
  };

  const buildReliefFromDesign = async (src: string, notify: boolean) => {
    setIsBuildingRelief(true);
    try {
      const field = await sampleHeightField(src, 130);
      const result = buildReliefGeometry(field, {
        widthMm: reliefWidth,
        reliefMm: reliefDepth,
        baseMm: reliefBase,
        invert: reliefInvert,
        shape: reliefShape,
      });
      reliefGeoRef.current = result.geometry;
      setHasRelief(true);
      setIsCustomUpload(true);
      const name = `JacDesign_AI_${reliefShape}.stl`;
      setFileName(name);
      applyGeometryToScene(result.geometry, name);
      if (notify) toast.success(q("aiReady"));
    } catch (err: any) {
      toast.error(err?.message || q("aiFailed"));
    } finally {
      setIsBuildingRelief(false);
    }
  };

  // Easy mode: the moment the AI image is ready, show it in 3D automatically
  useEffect(() => {
    if (!isBasic || !designImage || !designIsFinal || isBuildingRelief) return;
    void buildReliefFromDesign(designImage, !hasRelief);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isBasic, designImage, designIsFinal]);

  const handleValidateIn3D = () => {
    if (!designImage) return;
    void buildReliefFromDesign(designImage, true);
  };

  // Live re-build when relief parameters change
  useEffect(() => {
    if (!hasRelief || !designImage) return;
    const t = setTimeout(() => void buildReliefFromDesign(designImage, false), 220);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reliefShape, reliefWidth, reliefDepth, reliefBase, reliefInvert]);

  const handleDownloadStl = async () => {
    const geo = reliefGeoRef.current;
    if (!geo) return;
    const blob = await exportGeometryToStl(geo);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName || "jac-design.stl";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Easy-mode presets that drive the technical parameters
  const QUALITY_PRESETS = [
    { id: "eco", label: "qualityEco", hint: "qualityEcoHint", infill: 15, layer: 0.28 },
    { id: "balanced", label: "qualityBalanced", hint: "qualityBalancedHint", infill: 25, layer: 0.2 },
    { id: "premium", label: "qualityPremium", hint: "qualityPremiumHint", infill: 40, layer: 0.12 },
  ] as const;
  const activeQuality =
    QUALITY_PRESETS.find((p) => p.infill === infillPercent && p.layer === layerHeight)?.id ?? null;
  const applyQuality = (preset: (typeof QUALITY_PRESETS)[number]) => {
    setInfillPercent(preset.infill);
    setLayerHeight(preset.layer);
  };

  const SIZE_PRESETS = [
    { id: "s", label: "sizeS", width: 70 },
    { id: "m", label: "sizeM", width: 110 },
    { id: "l", label: "sizeL", width: 160 },
  ] as const;

  const BASIC_MATERIALS = [
    { id: "pla-eco", label: "matEveryday" },
    { id: "petg-tough", label: "matStrong" },
    { id: "resin-12k", label: "matDetail" },
  ];

  // Camera Reset
  const handleResetCamera = () => {
    if (!cameraRef.current || !controlsRef.current) return;
    const maxDim = Math.max(dimensions.x, dimensions.y, dimensions.z, 50);
    cameraRef.current.position.set(maxDim * 1.5, maxDim * 1.2, maxDim * 1.8);
    controlsRef.current.target.set(0, dimensions.y * 0.45, 0);
    controlsRef.current.update();
  };

  // Add Quote to Cart
  const handleAddToCart = () => {
    const item: QuotedItem = {
      id: `quote-3d-${Date.now()}`,
      name: `${q("print3d")}: ${fileName.replace(/\.stl$/i, "")} (${activeMaterial.name})`,
      price: totalPrice,
      details: `${dimensions.x}×${dimensions.y}×${dimensions.z} mm · ${infillPercent}% infill · ${q(selectedColor.name)} × ${quantity}`,
    };

    if (onAddToCart) {
      onAddToCart(item);
    } else {
      toast.success(`${q("quoteAdded")}: $${totalPrice.toFixed(2)} CAD`);
    }
  };

  return (
    <div className="w-full rounded-3xl bg-card border border-border/80 shadow-2xl overflow-hidden text-card-foreground">
      {/* Top Studio Bar */}
      <div className="px-6 py-4 border-b border-border/60 bg-muted/40 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber/10 border border-amber/20 flex items-center justify-center text-amber-600">
            <Box className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight">{fileName}</span>
              {isCustomUpload ? (
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 border border-blue-500/20">
                  Custom STL
                </span>
              ) : (
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20">
                  Preset Demo
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {dimensions.x} × {dimensions.y} × {dimensions.z} mm · {volumeCm3} cm³ · {triangleCount.toLocaleString()} {q("triangles")}
            </p>
          </div>
        </div>

        {/* Mode switch */}
        <div className="flex items-center gap-1 rounded-2xl border border-border/60 bg-background/80 p-1">
          {(["basic", "pro"] as const).map((m) => (
            <button
              key={m}
              onClick={() => changeMode(m)}
              className={`px-3 py-1.5 text-[11px] font-bold rounded-xl transition-colors ${
                mode === m ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {q(m === "basic" ? "modeBasic" : "modePro")}
            </button>
          ))}
        </div>

        {/* Preset Selector */}
        <div className={`items-center gap-2 overflow-x-auto py-1 ${isBasic ? "hidden" : "flex"}`}>
          <span className="text-xs font-semibold text-muted-foreground mr-1 hidden sm:inline">{q("models")}</span>
          {PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => handleSelectPreset(p.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-xl transition-all ${
                !isCustomUpload && selectedPreset === p.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-background/80 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/60"
              }`}
            >
              {p.name.split(" ")[0]} {p.name.split(" ")[1]}
            </button>
          ))}
        </div>
      </div>

      {/* ---------- Guided steps ---------- */}
      <div className="px-5 sm:px-6 py-3 border-b border-border/60 flex flex-wrap items-center gap-x-4 gap-y-2">
        {[
          { n: 1, label: "stepDesignLabel", done: Boolean(designImage && designIsFinal) },
          { n: 2, label: "stepViewLabel", done: hasRelief },
          { n: 3, label: "stepQuoteLabel", done: hasRelief },
        ].map((st) => (
          <div key={st.n} className="flex items-center gap-2">
            <span
              className={`grid h-6 w-6 place-items-center rounded-full text-[11px] font-black ${
                st.done ? "bg-amber-500 text-white" : "bg-muted text-muted-foreground"
              }`}
            >
              {st.done ? <Check className="h-3.5 w-3.5" /> : st.n}
            </span>
            <span className={`text-xs font-bold ${st.done ? "text-foreground" : "text-muted-foreground"}`}>{q(st.label)}</span>
          </div>
        ))}
        <p className="text-[11px] text-muted-foreground sm:ml-auto max-w-md">
          {q(isBasic ? "modeBasicHint" : "modeProHint")}
        </p>
      </div>

      {/* ---------- Step 1: AI design studio ---------- */}
      <div className="px-5 sm:px-6 py-6 border-b border-border/60 bg-gradient-to-br from-amber-500/5 via-transparent to-rose-500/5">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 shrink-0">
            <Wand2 className="w-4.5 h-4.5" />
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base tracking-tight">{q("aiStep")}</h3>
            <p className="text-xs text-muted-foreground max-w-2xl mt-0.5">{q("aiHint")}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Prompt column */}
          <div className="space-y-3">
            <textarea
              value={designPrompt}
              onChange={(e) => setDesignPrompt(e.target.value)}
              rows={3}
              placeholder={q("aiPlaceholder")}
              className="w-full rounded-2xl border border-border/70 bg-background p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            />

            <div className="space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{q("aiStyle")}</span>
              <div className="grid grid-cols-4 gap-1.5">
                {["styleLine", "styleRelief", "stylePhoto", "styleLogo"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setDesignStyle(s)}
                    className={`py-1.5 text-[11px] font-bold rounded-xl border transition-colors ${
                      designStyle === s
                        ? "bg-rose-500 border-rose-500 text-white"
                        : "bg-background border-border/60 text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {q(s)}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleGenerateDesign}
                disabled={isGenerating}
                className="flex-1 min-w-[150px] py-3 px-4 rounded-2xl bg-rose-500 hover:bg-rose-600 disabled:opacity-60 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-500/20 transition-all active:scale-[0.99]"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>{isGenerating ? q("aiGenerating") : designImage ? q("aiRegenerate") : q("aiGenerate")}</span>
              </button>
              <button
                onClick={() => setDesignPrompt(SAMPLE_PROMPTS[Math.floor(Math.random() * SAMPLE_PROMPTS.length)]!)}
                className="py-3 px-4 rounded-2xl bg-background border border-border/60 hover:bg-muted text-xs font-bold text-muted-foreground flex items-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                {q("aiSample")}
              </button>
            </div>

            {/* Relief controls */}
            <div className="rounded-2xl border border-border/60 bg-muted/30 p-3 space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{q("aiRelief")}</span>

              <div className="grid grid-cols-2 gap-1.5">
                {(["plaque", "medallion"] as ReliefShape[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setReliefShape(s)}
                    className={`py-1.5 text-[11px] font-bold rounded-xl transition-colors ${
                      reliefShape === s ? "bg-amber-500 text-white" : "bg-background text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {q(s)}
                  </button>
                ))}
              </div>

              {isBasic && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-muted-foreground">{q("sizeLabel")}</span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {SIZE_PRESETS.map((sp) => (
                      <button
                        key={sp.id}
                        onClick={() => setReliefWidth(sp.width)}
                        className={`py-2 text-[11px] font-bold rounded-xl border transition-colors ${
                          reliefWidth === sp.width
                            ? "bg-amber-500 border-amber-500 text-white"
                            : "bg-background border-border/60 text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        {q(sp.label)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {!isBasic && [
                { label: "aiWidth", value: reliefWidth, set: setReliefWidth, min: 40, max: 200, step: 5, unit: "mm" },
                { label: "aiDepth", value: reliefDepth, set: setReliefDepth, min: 1, max: 8, step: 0.5, unit: "mm" },
                { label: "aiBase", value: reliefBase, set: setReliefBase, min: 1, max: 6, step: 0.5, unit: "mm" },
              ].map((ctrl) => (
                <div key={ctrl.label} className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="font-semibold text-muted-foreground">{q(ctrl.label)}</span>
                    <span className="font-bold">{ctrl.value} {ctrl.unit}</span>
                  </div>
                  <input
                    type="range"
                    min={ctrl.min}
                    max={ctrl.max}
                    step={ctrl.step}
                    value={ctrl.value}
                    onChange={(e) => ctrl.set(Number(e.target.value))}
                    className="w-full accent-amber-500"
                  />
                </div>
              ))}

              <label className={`items-center gap-2 text-[11px] font-semibold text-muted-foreground cursor-pointer ${isBasic ? "hidden" : "flex"}`}>
                <input
                  type="checkbox"
                  checked={reliefInvert}
                  onChange={(e) => setReliefInvert(e.target.checked)}
                  className="accent-amber-500 w-3.5 h-3.5"
                />
                {q("aiInvert")}
              </label>
            </div>
          </div>

          {/* Preview column */}
          <div className="space-y-3">
            <div className="relative aspect-square w-full rounded-2xl overflow-hidden border border-border/60 bg-muted/40 flex items-center justify-center">
              {designImage ? (
                <img
                  src={designImage}
                  alt={designPrompt || "AI design preview"}
                  className={`w-full h-full object-cover transition-[filter] duration-500 ${designIsFinal ? "blur-0" : "blur-xl"}`}
                />
              ) : (
                <div className="text-center px-6 text-muted-foreground">
                  <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">{q("aiEmpty")}</p>
                </div>
              )}
              {isGenerating && (
                <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-xl bg-background/85 backdrop-blur-md text-[11px] font-bold flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-500" />
                  {q("aiGenerating")}
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleValidateIn3D}
                disabled={!designImage || !designIsFinal || isBuildingRelief}
                hidden={isBasic && hasRelief}
                className="flex-1 min-w-[160px] py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all active:scale-[0.99]"
              >
                {isBuildingRelief ? <Loader2 className="w-4 h-4 animate-spin" /> : <Box className="w-4 h-4" />}
                <span>{isBuildingRelief ? q("aiBuilding") : q("aiValidate")}</span>
              </button>
              {hasRelief && (
                <button
                  onClick={handleDownloadStl}
                  className="py-3 px-4 rounded-2xl bg-background border border-border/60 hover:bg-muted text-xs font-bold text-muted-foreground flex items-center gap-2"
                >
                  <Download className="w-3.5 h-3.5" />
                  {q("downloadStl")}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Studio Grid: Viewport + Configurator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[620px]">
        {/* Left / Center: Interactive 3D Canvas (7 cols) */}
        <div className="lg:col-span-7 relative bg-[#0c1117] flex flex-col justify-between overflow-hidden border-b lg:border-b-0 lg:border-r border-border/60">
          {/* 3D WebGL Canvas Container */}
          <div ref={containerRef} className="w-full h-[400px] sm:h-[480px] lg:h-full cursor-grab active:cursor-grabbing" />

          {/* Floating Viewport Quick Controls */}
          <div className="absolute top-4 left-4 flex items-center gap-1.5 p-1 rounded-2xl bg-background/80 backdrop-blur-md border border-border/60 shadow-lg z-10">
            <button
              onClick={() => setAutoRotate((v) => !v)}
              title={autoRotate ? q("pause") : q("spin")}
              className={`p-2 rounded-xl text-xs transition-colors ${
                autoRotate ? "bg-amber-500/20 text-amber-500 font-semibold" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {autoRotate ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button
              onClick={handleResetCamera}
              title={q("center")}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted text-xs transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setWireframe((v) => !v)}
              title={q("wire")}
              hidden={isBasic}
              className={`p-2 rounded-xl text-xs transition-colors ${
                wireframe ? "bg-amber-500/20 text-amber-500 font-semibold" : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Layers className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowGrid((v) => !v)}
              title={q("grid")}
              hidden={isBasic}
              className={`p-2 rounded-xl text-xs transition-colors ${
                showGrid ? "bg-amber-500/20 text-amber-500 font-semibold" : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <GridIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Live Dimension HUD Overlay */}
          <div className="absolute bottom-4 left-4 p-3 rounded-2xl bg-background/85 backdrop-blur-md border border-border/60 shadow-lg text-xs space-y-1.5 max-w-[260px] pointer-events-none">
            <div className="flex items-center justify-between text-muted-foreground font-semibold">
              <span>{q("dims")}</span>
              <span className="text-foreground">{dimensions.x} × {dimensions.y} × {dimensions.z} mm</span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>{q("volume")}</span>
              <span className="font-semibold text-foreground">{volumeCm3.toFixed(1)} cm³</span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>{q("weight")}</span>
              <span className="font-semibold text-amber-600 dark:text-amber-400">~{partWeightGrams} g</span>
            </div>
          </div>

          {/* Floating STL Drag & Drop Bar at Bottom Right */}
          <div className={`absolute bottom-4 right-4 z-10 ${isBasic ? "hidden" : ""}`}>
            <label className="cursor-pointer flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-lg transition-transform hover:scale-105 active:scale-95">
              <UploadCloud className="w-4 h-4" />
              <span>{isAnalyzing ? q("analyzingShort") : q("upload")}</span>
              <input
                type="file"
                accept=".stl"
                className="hidden"
                disabled={isAnalyzing}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) processSTLFile(f);
                }}
              />
            </label>
          </div>
        </div>

        {/* Right: Technical Parameters & Live Instant Quote (5 cols) */}
        <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between space-y-6 overflow-y-auto max-h-[720px]">
          <div className="space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                {q("params")}
              </span>
              <h3 className="text-2xl font-black tracking-tight mt-1">{q("modelConfig")}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {q("configHint")}
              </p>
            </div>

            {/* Material Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                {q("step1")}
              </label>
              <div className="space-y-2">
                {(isBasic ? MATERIALS.filter((m) => BASIC_MATERIALS.some((b) => b.id === m.id)) : MATERIALS).map((mat) => (
                  <div
                    key={mat.id}
                    onClick={() => setMaterialId(mat.id)}
                    className={`cursor-pointer p-3 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                      materialId === mat.id
                        ? "border-amber-500 bg-amber-500/10 shadow-sm"
                        : "border-border/60 bg-muted/20 hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">{mat.name}</span>
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/40">
                          {q(isBasic ? (BASIC_MATERIALS.find((b) => b.id === mat.id)?.label ?? mat.tag) : mat.tag)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{q(mat.desc)}</p>
                      <div className={`items-center gap-2 mt-1.5 ${isBasic ? "hidden" : "flex"}`}>
                        {mat.properties.map((prop, idx) => (
                          <span key={idx} className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                            ✓ {q(prop)}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-sm text-foreground">${mat.pricePerCm3.toFixed(2)}</span>
                      <span className="text-[10px] text-muted-foreground block">/cm³</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Color Palette Selector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  {q("step2")}
                </label>
                <span className="text-xs font-medium text-amber-600 dark:text-amber-400">{q(selectedColor.name)}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c.name}
                    onClick={() => setSelectedColor(c)}
                    title={q(c.name)}
                    className={`w-8 h-8 rounded-full border-2 transition-all relative flex items-center justify-center ${
                      selectedColor.name === c.name
                        ? "border-amber-500 scale-110 shadow-md ring-2 ring-amber-500/30"
                        : "border-border/80 hover:scale-105"
                    }`}
                    style={{ backgroundColor: c.hex }}
                  >
                    {selectedColor.name === c.name && (
                      <Check className={`w-4 h-4 ${c.hex === "#f8f9fa" ? "text-dark" : "text-white"}`} />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Easy mode: one single quality decision */}
            {isBasic && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{q("qualityLabel")}</label>
                <div className="grid gap-2 sm:grid-cols-3">
                  {QUALITY_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => applyQuality(preset)}
                      className={`rounded-2xl border p-3 text-left transition-all ${
                        activeQuality === preset.id
                          ? "border-amber-500 bg-amber-500/10 shadow-sm"
                          : "border-border/60 bg-muted/20 hover:bg-muted/50"
                      }`}
                    >
                      <span className="block text-xs font-bold">{q(preset.label)}</span>
                      <span className="mt-0.5 block text-[10px] leading-snug text-muted-foreground">{q(preset.hint)}</span>
                    </button>
                  ))}
                </div>
                <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <ShieldCheck className="h-3.5 w-3.5 text-amber-500" />
                  {q("autoTuned")}
                </p>
                <button
                  onClick={() => changeMode("pro")}
                  className="text-[11px] font-bold text-amber-600 underline decoration-dotted hover:text-amber-700 dark:text-amber-400"
                >
                  {q("seeAllOptions")}
                </button>
              </div>
            )}

            {/* Infill & Layer Height Sliders */}
            <div className={`grid-cols-1 sm:grid-cols-2 gap-4 pt-2 ${isBasic ? "hidden" : "grid"}`}>
              {/* Infill Density Slider */}
              <div className="space-y-2 p-3 rounded-2xl bg-muted/30 border border-border/60">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-muted-foreground">{q("infill")}</span>
                  <span className="font-bold text-foreground bg-card px-2 py-0.5 rounded-md border border-border/40">
                    {infillPercent}%
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  value={infillPercent}
                  onChange={(e) => setInfillPercent(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>10% · {q("light")}</span>
                  <span>40% · {q("strong")}</span>
                  <span>100% · {q("solid")}</span>
                </div>
              </div>

              {/* Layer Resolution */}
              <div className="space-y-2 p-3 rounded-2xl bg-muted/30 border border-border/60">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-muted-foreground">{q("layerRes")}</span>
                  <span className="font-bold text-foreground bg-card px-2 py-0.5 rounded-md border border-border/40">
                    {layerHeight} mm
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1 pt-1">
                  {[
                    { val: 0.12, label: "Fine" },
                    { val: 0.20, label: "Standard" },
                    { val: 0.28, label: "Fast" },
                  ].map((res) => (
                    <button
                      key={res.val}
                      onClick={() => setLayerHeight(res.val)}
                      className={`py-1 text-[11px] font-bold rounded-lg transition-colors ${
                        layerHeight === res.val
                          ? "bg-amber-500 text-white"
                          : "bg-background hover:bg-muted text-muted-foreground"
                      }`}
                    >
                      {q(res.label)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-muted/30 border border-border/60">
              <span className="text-xs font-bold text-muted-foreground">{q("qty")}</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-7 h-7 rounded-lg bg-card border border-border/60 flex items-center justify-center font-bold text-sm hover:bg-muted"
                >
                  -
                </button>
                <span className="font-bold text-sm w-6 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  className="w-7 h-7 rounded-lg bg-card border border-border/60 flex items-center justify-center font-bold text-sm hover:bg-muted"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Live Quote Breakdown & Cart Action */}
          <div className="pt-4 border-t border-border/60 space-y-4">
            <div className="space-y-1.5 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>{q("printTime")}</span>
                <span className="font-semibold text-foreground flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  {formattedTime} / {q("perPiece")}
                </span>
              </div>
              <div className="flex justify-between">
                <span>{q("qa")}</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {q("qaIncluded")}
                </span>
              </div>
              <div className="flex justify-between items-baseline pt-2">
                <div>
                  <span className="text-xs font-medium text-muted-foreground block">{q("estTotal")}</span>
                  <span className="text-3xl font-black tracking-tight text-foreground">
                    ${totalPrice.toFixed(2)}{" "}
                    <span className="text-xs font-semibold text-muted-foreground">CAD</span>
                  </span>
                </div>
                {quantity > 1 && (
                  <span className="text-xs text-muted-foreground font-medium">
                    (${unitPrice.toFixed(2)} {q("each")})
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={handleAddToCart}
              className="w-full py-4 px-6 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-[0.99] text-white font-extrabold text-sm shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2.5 transition-all"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>{q("addQuote")}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
