/**
 * Formats a caption to ensure hashtags appear on new lines
 * If the caption contains hashtags at the end, they will be separated by \n\n
 */
export const formatCaptionWithHashtags = (caption: string): string => {
  if (!caption.trim()) return caption;

  // Match hashtags that appear at the end of the caption or after existing content
  // This regex finds all hashtags (starting with #) in the caption
  const hashtagRegex = /(\s*(?:#\w+\s*)+)$/;
  const match = caption.match(hashtagRegex);

  if (match && match[1]) {
    // Remove the hashtags from the original position
    const captionWithoutHashtags = caption.replace(hashtagRegex, "").trim();
    const hashtagsPart = match[1].trim();

    // If there's content before hashtags and it doesn't already end with newlines, add them
    if (captionWithoutHashtags) {
      return `${captionWithoutHashtags}\n\n${hashtagsPart}`;
    }
    return hashtagsPart;
  }

  // If no hashtags found at the end, but caption has multiple hashtags scattered
  // Split by hashtag and reorganize
  const hashtagMatches = caption.match(/#\w+/g) || [];
  if (hashtagMatches.length > 0) {
    // Get unique hashtags and remove them from caption
    const uniqueHashtags = [...new Set(hashtagMatches)];
    const captionWithoutHashtags = caption
      .replace(/#\w+/g, "")
      .trim()
      .replace(/\s+/g, " ");

    if (captionWithoutHashtags) {
      return `${captionWithoutHashtags}\n\n${uniqueHashtags.join(" ")}`;
    }
    return uniqueHashtags.join(" ");
  }

  return caption;
};
