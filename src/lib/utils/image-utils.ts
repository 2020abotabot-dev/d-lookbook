/**
 * Image matching utilities for product image import.
 *
 * Matching strategy (in order of precedence):
 * 1. Exact SKU match after normalisation
 * 2. J-code extraction — find a J-code pattern anywhere in the filename and
 *    match against all product SKUs that contain that J-code
 * 3. Prefix / longest-common-prefix match
 *
 * Confidence levels:
 *   "exact"   — normalised filename equals normalised SKU
 *   "jcode"   — J-code extracted from filename matched a product SKU
 *   "prefix"  — filename starts with product SKU (or vice-versa)
 *   "none"    — no match found
 */

export const ANGLE_SUFFIXES: Record<string, string> = {
  "000": "main",
  "001": "main",
  "045": "angle45",
  "180": "side",
  "270": "back",
  "OUT": "outsole",
  "TOP": "top",
  "DTL": "detail",
};

export type MatchConfidence = "exact" | "jcode" | "prefix" | "none";

export interface ImageMatch {
  file:                File;
  objectUrl:           string;
  /** Raw SKU extracted from filename (best guess) */
  sku:                 string;
  angle:               string;
  matched:             boolean;
  confidence:          MatchConfidence;
  matchedProductId?:   string;
  matchedProductName?: string;
}

/** Normalise a string for comparison: uppercase, strip spaces/hyphens/dots */
function norm(s: string): string {
  return s.toUpperCase().replace(/[\s\-_.]/g, "");
}

/**
 * Extract all J-code candidates from a string.
 * Merrell J-codes follow patterns like:  J068225,  J067824ECW,  J500315W
 * We match:  J  followed by 5–7 digits  optionally followed by letters
 */
function extractJCodes(s: string): string[] {
  const matches = s.toUpperCase().match(/J\d{5,7}[A-Z]*/g) ?? [];
  return [...new Set(matches)];
}

export function matchImagesToProducts(
  files: File[],
  products: { id: string; name: string; sku: string }[]
): ImageMatch[] {
  // Build lookup maps
  const exactMap   = new Map(products.map(p => [norm(p.sku), p]));
  const prefixMap  = products.map(p => ({ ...p, normSku: norm(p.sku) }));

  return files.map(file => {
    const objectUrl = URL.createObjectURL(file);
    const baseName  = file.name.replace(/\.[^.]+$/, ""); // strip extension
    const parts     = baseName.split(/[_\-]/);

    // Detect angle suffix from last segment
    const lastPart  = parts[parts.length - 1].toUpperCase();
    const angle     = ANGLE_SUFFIXES[lastPart] ?? "unknown";
    // SKU candidate = everything before the angle suffix (if recognised)
    const skuRaw    = angle !== "unknown"
      ? parts.slice(0, -1).join("_")
      : baseName;
    const skuNorm   = norm(skuRaw);

    // ── Strategy 1: exact normalised match ──────────────────────────────────
    const exactHit = exactMap.get(skuNorm);
    if (exactHit) {
      return {
        file, objectUrl,
        sku: skuRaw, angle,
        matched: true, confidence: "exact",
        matchedProductId: exactHit.id, matchedProductName: exactHit.name,
      };
    }

    // ── Strategy 2: J-code extraction ───────────────────────────────────────
    const jCodes = extractJCodes(baseName);
    if (jCodes.length > 0) {
      for (const jcode of jCodes) {
        // Try exact J-code as full SKU
        const jHit = exactMap.get(norm(jcode));
        if (jHit) {
          return {
            file, objectUrl,
            sku: jcode, angle,
            matched: true, confidence: "jcode",
            matchedProductId: jHit.id, matchedProductName: jHit.name,
          };
        }
        // Try: product SKU contains the J-code, or J-code contains the product SKU
        const jNorm = norm(jcode);
        const partialHit = prefixMap.find(p =>
          p.normSku.includes(jNorm) || jNorm.includes(p.normSku)
        );
        if (partialHit) {
          return {
            file, objectUrl,
            sku: jcode, angle,
            matched: true, confidence: "jcode",
            matchedProductId: partialHit.id, matchedProductName: partialHit.name,
          };
        }
      }
    }

    // ── Strategy 3: prefix match ─────────────────────────────────────────────
    const prefixHit = prefixMap.find(p =>
      skuNorm.startsWith(p.normSku) || p.normSku.startsWith(skuNorm)
    );
    if (prefixHit) {
      return {
        file, objectUrl,
        sku: skuRaw, angle,
        matched: true, confidence: "prefix",
        matchedProductId: prefixHit.id, matchedProductName: prefixHit.name,
      };
    }

    // ── No match ─────────────────────────────────────────────────────────────
    return {
      file, objectUrl,
      sku: skuRaw, angle,
      matched: false, confidence: "none",
    };
  });
}

/** Revoke object URLs when no longer needed */
export function revokeImageMatches(matches: ImageMatch[]): void {
  matches.forEach(m => URL.revokeObjectURL(m.objectUrl));
}

/** Filter to only image files */
export function filterImageFiles(files: FileList | File[]): File[] {
  return Array.from(files).filter(f =>
    f.type.startsWith("image/") ||
    /\.(jpg|jpeg|png|gif|webp|avif|heic)$/i.test(f.name)
  );
}
