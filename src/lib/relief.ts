import * as THREE from "three";

export type ReliefShape = "plaque" | "medallion";

export interface ReliefOptions {
  /** Width of the plaque (or diameter of the medallion) in millimetres. */
  widthMm: number;
  /** Maximum relief height above the base slab, in millimetres. */
  reliefMm: number;
  /** Solid base slab thickness in millimetres. */
  baseMm: number;
  /** Lithophane mode: dark pixels become thick instead of thin. */
  invert: boolean;
  shape: ReliefShape;
  /** Grid resolution along the longest axis (vertices). */
  resolution?: number;
}

export interface ReliefResult {
  geometry: any;
  /** Analytic volume in cm³ (independent from the mesh tetrahedron sum). */
  volumeCm3: number;
  widthMm: number;
  heightMm: number;
  thicknessMm: number;
  triangles: number;
}

/** Grayscale height field sampled from an image, values 0..1. */
export interface HeightField {
  data: Float32Array;
  nx: number;
  ny: number;
  aspect: number;
}

const clampRes = (n: number) => Math.max(24, Math.min(160, Math.round(n)));

/** Loads an image source (data URL / URL) into a normalized luminance height field. */
export async function sampleHeightField(src: string, resolution = 130): Promise<HeightField> {
  const img = await loadImage(src);
  const aspect = img.naturalWidth / img.naturalHeight || 1;
  const res = clampRes(resolution);
  const nx = aspect >= 1 ? res : Math.max(24, Math.round(res * aspect));
  const ny = aspect >= 1 ? Math.max(24, Math.round(res / aspect)) : res;

  const canvas = document.createElement("canvas");
  canvas.width = nx;
  canvas.height = ny;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");
  ctx.drawImage(img, 0, 0, nx, ny);
  const { data } = ctx.getImageData(0, 0, nx, ny);

  const heights = new Float32Array(nx * ny);
  for (let i = 0; i < nx * ny; i++) {
    const r = data[i * 4] ?? 0;
    const g = data[i * 4 + 1] ?? 0;
    const b = data[i * 4 + 2] ?? 0;
    const a = (data[i * 4 + 3] ?? 255) / 255;
    // Perceptual luminance, transparent pixels treated as background (white)
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    heights[i] = a * lum + (1 - a);
  }

  // Normalize contrast so the full relief depth is always used
  let min = 1;
  let max = 0;
  for (let i = 0; i < heights.length; i++) {
    const v = heights[i]!;
    if (v < min) min = v;
    if (v > max) max = v;
  }
  const span = Math.max(1e-3, max - min);
  for (let i = 0; i < heights.length; i++) heights[i] = (heights[i]! - min) / span;

  return { data: heights, nx, ny, aspect };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load the design image"));
    img.src = src;
  });
}

/**
 * Builds a watertight, non-indexed relief mesh (top surface + side walls + flat base)
 * from a height field. Height runs along +Y, footprint lies in the XZ plane, in mm.
 */
export function buildReliefGeometry(field: HeightField, opts: ReliefOptions): ReliefResult {
  const { nx, ny } = field;
  const relief = Math.max(0.2, opts.reliefMm);
  const base = Math.max(0.6, opts.baseMm);
  const width = Math.max(20, opts.widthMm);

  const h = (ix: number, iy: number) => {
    const cx = Math.min(nx - 1, Math.max(0, ix));
    const cy = Math.min(ny - 1, Math.max(0, iy));
    const v = field.data[cy * nx + cx] ?? 0;
    return opts.invert ? 1 - v : v;
  };

  const positions: number[] = [];
  const tri = (
    ax: number, ay: number, az: number,
    bx: number, by: number, bz: number,
    cx: number, cy: number, cz: number
  ) => {
    positions.push(ax, ay, az, bx, by, bz, cx, cy, cz);
  };

  let volumeMm3 = 0;
  let heightMm = width;

  if (opts.shape === "plaque") {
    heightMm = width / (field.aspect || 1);
    const dx = width / (nx - 1);
    const dz = heightMm / (ny - 1);
    const px = (i: number) => -width / 2 + i * dx;
    const pz = (j: number) => -heightMm / 2 + j * dz;
    const py = (i: number, j: number) => base + h(i, j) * relief;

    for (let j = 0; j < ny - 1; j++) {
      for (let i = 0; i < nx - 1; i++) {
        const x0 = px(i), x1 = px(i + 1), z0 = pz(j), z1 = pz(j + 1);
        const y00 = py(i, j), y01 = py(i, j + 1), y11 = py(i + 1, j + 1), y10 = py(i + 1, j);
        // Top surface (outward = +Y)
        tri(x0, y00, z0, x0, y01, z1, x1, y11, z1);
        tri(x0, y00, z0, x1, y11, z1, x1, y10, z0);
        // Bottom slab (outward = -Y)
        tri(x0, 0, z0, x1, 0, z1, x0, 0, z1);
        tri(x0, 0, z0, x1, 0, z0, x1, 0, z1);
        volumeMm3 += dx * dz * ((y00 + y01 + y11 + y10) / 4);
      }
    }

    // Side walls
    for (let i = 0; i < nx - 1; i++) {
      const x0 = px(i), x1 = px(i + 1);
      // front edge (z = -H/2), outward -Z
      const zf = pz(0);
      tri(x0, 0, zf, x0, py(i, 0), zf, x1, py(i + 1, 0), zf);
      tri(x0, 0, zf, x1, py(i + 1, 0), zf, x1, 0, zf);
      // back edge (z = +H/2), outward +Z
      const zb = pz(ny - 1);
      tri(x0, 0, zb, x1, py(i + 1, ny - 1), zb, x0, py(i, ny - 1), zb);
      tri(x0, 0, zb, x1, 0, zb, x1, py(i + 1, ny - 1), zb);
    }
    for (let j = 0; j < ny - 1; j++) {
      const z0 = pz(j), z1 = pz(j + 1);
      // left edge (x = -W/2), outward -X
      const xl = px(0);
      tri(xl, 0, z0, xl, py(0, j + 1), z1, xl, py(0, j), z0);
      tri(xl, 0, z0, xl, 0, z1, xl, py(0, j + 1), z1);
      // right edge (x = +W/2), outward +X
      const xr = px(nx - 1);
      tri(xr, 0, z0, xr, py(nx - 1, j), z0, xr, py(nx - 1, j + 1), z1);
      tri(xr, 0, z0, xr, py(nx - 1, j + 1), z1, xr, 0, z1);
    }
  } else {
    // Medallion: polar grid disc
    const radius = width / 2;
    heightMm = width;
    const rings = Math.max(24, Math.min(nx, ny));
    const segments = Math.max(48, Math.round(rings * 2));
    const sampleAt = (r: number, ang: number) => {
      // map polar point into image space (centered square crop)
      const u = 0.5 + (r / radius) * Math.cos(ang) * 0.5;
      const v = 0.5 + (r / radius) * Math.sin(ang) * 0.5;
      return base + h(Math.round(u * (nx - 1)), Math.round(v * (ny - 1))) * relief;
    };
    const step = radius / rings;
    const aStep = (Math.PI * 2) / segments;

    for (let s = 0; s < segments; s++) {
      const a0 = s * aStep;
      const a1 = (s + 1) * aStep;
      for (let r = 0; r < rings; r++) {
        const r0 = r * step;
        const r1 = (r + 1) * step;
        const p00 = [r0 * Math.cos(a0), r0 * Math.sin(a0)] as const;
        const p01 = [r0 * Math.cos(a1), r0 * Math.sin(a1)] as const;
        const p11 = [r1 * Math.cos(a1), r1 * Math.sin(a1)] as const;
        const p10 = [r1 * Math.cos(a0), r1 * Math.sin(a0)] as const;
        const y00 = sampleAt(r0, a0), y01 = sampleAt(r0, a1);
        const y11 = sampleAt(r1, a1), y10 = sampleAt(r1, a0);

        // Top (outward +Y)
        tri(p00[0], y00, p00[1], p11[0], y11, p11[1], p10[0], y10, p10[1]);
        tri(p00[0], y00, p00[1], p01[0], y01, p01[1], p11[0], y11, p11[1]);
        // Bottom (outward -Y)
        tri(p00[0], 0, p00[1], p10[0], 0, p10[1], p11[0], 0, p11[1]);
        tri(p00[0], 0, p00[1], p11[0], 0, p11[1], p01[0], 0, p01[1]);

        const cellArea = 0.5 * Math.abs(r1 * r1 - r0 * r0) * aStep;
        volumeMm3 += cellArea * ((y00 + y01 + y11 + y10) / 4);
      }
      // Outer wall
      const rw = radius;
      const w0 = [rw * Math.cos(a0), rw * Math.sin(a0)] as const;
      const w1 = [rw * Math.cos(a1), rw * Math.sin(a1)] as const;
      const yw0 = sampleAt(rw, a0);
      const yw1 = sampleAt(rw, a1);
      tri(w0[0], 0, w0[1], w0[0], yw0, w0[1], w1[0], yw1, w1[1]);
      tri(w0[0], 0, w0[1], w1[0], yw1, w1[1], w1[0], 0, w1[1]);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();

  return {
    geometry,
    volumeCm3: Math.max(0.5, Math.round((volumeMm3 / 1000) * 10) / 10),
    widthMm: Math.round(width * 10) / 10,
    heightMm: Math.round(heightMm * 10) / 10,
    thicknessMm: Math.round((base + relief) * 10) / 10,
    triangles: positions.length / 9,
  };
}

/** Exports a mesh geometry as a binary STL blob. */
export async function exportGeometryToStl(geometry: any): Promise<Blob> {
  const { STLExporter } = await import("three-stdlib");
  const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial());
  const result = new STLExporter().parse(mesh, { binary: true }) as unknown as DataView;
  return new Blob([result as unknown as BlobPart], { type: "model/stl" });
}
