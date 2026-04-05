/**
 * Angle suffix conventions for product image filenames.
 * Pattern: {SKU}_{ANGLE}.{ext}
 * e.g., TRP-001-BLK_000.jpg = main image
 */
export const ANGLE_SUFFIXES: Record<string, string> = {
  "000": "main",
  "045": "angle45",
  "180": "side",
  "270": "back",
  "OUT": "outsole",
};

export interface ImageMatch {
  file: File;
  objectUrl: string;
  sku: string;
  angle: string;  // "main" | "angle45" | "side" | "back" | "outsole" | "unknown"
  matched: boolean;
  matchedProductId?: string;
  matchedProductName?: string;
}

/**
 * Given a list of image files and existing SKUs, attempt to match each image
 * to a product by filename convention: {SKU}_{ANGLE}.{ext}
 */
export function matchImagesToProducts(
  files: File[],
  products: { id: string; name: string; sku: string }[]
): ImageMatch[] {
  const skuMap = new Map(products.map(p => [p.sku.toUpperCase(), p]));

  return files.map(file => {
    const objectUrl = URL.createObjectURL(file);
    const baseName  = file.name.replace(/\.[^.]+$/, ""); // strip extension
    const parts     = baseName.split("_");

    // Try to extract angle from last segment
    const lastPart = parts[parts.length - 1].toUpperCase();
    const angle    = ANGLE_SUFFIXES[lastPart] ?? "unknown";
    const skuPart  = angle !== "unknown"
      ? parts.slice(0, -1).join("_").toUpperCase()
      : baseName.toUpperCase();

    const product = skuMap.get(skuPart);

    return {
      file,
      objectUrl,
      sku:   skuPart,
      angle,
      matched: !!product,
      matchedProductId:   product?.id,
      matchedProductName: product?.name,
    };
  });
}

/** Revoke object URLs when no longer needed */
export function revokeImageMatches(matches: ImageMatch[]): void {
  matches.forEach(m => URL.revokeObjectURL(m.objectUrl));
}

/** Filter to only image files */
export function filterImageFiles(files: FileList | File[]): File[] {
  return Array.from(files).filter(f => f.type.startsWith("image/"));
}
