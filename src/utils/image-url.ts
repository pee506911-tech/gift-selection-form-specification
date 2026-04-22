/**
 * Utility function to construct image URLs from image keys
 * Handles both formats: '1.png' and 'images/1.png'
 */
export function getImageUrl(imageKey: string | null): string | null {
  if (!imageKey) return null;
  
  // Remove 'images/' prefix if present
  const cleanKey = imageKey.replace(/^images\//, '');
  return `/images/${cleanKey}`;
}

/**
 * Alternative: Get image URL with fallback
 */
export function getImageUrlWithFallback(
  imageKey: string | null, 
  fallback: string = '/placeholder.png'
): string {
  const url = getImageUrl(imageKey);
  return url || fallback;
}