// Step 1: Normalize a string for comparison, but keep spaces between words.
const normalizeForTokenization = (str: string): string => {
  if (!str) return '';
  return str
    .toLowerCase()
    .trim()
    .normalize("NFD") // Decompose accented characters
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, " ") // Replace punctuation with spaces
    .replace(/\s+/g, ' '); // Collapse multiple spaces into one
};

// This normalization is used for simpler substring searches in other parts of the app.
export const normalizeString = (str: string): string => {
  if (!str) return '';
  return normalizeForTokenization(str).replace(/\s/g, '');
};

/**
 * A more flexible "fuzzy" matching logic to handle variations in text.
 * It works by tokenizing the strings, then checking for partial or full matches
 * between tokens to calculate a similarity score.
 * This handles variations in word order, abbreviations, and extra/missing stop words.
 */
export const isFuzzyMatch = (strA: string, strB: string): boolean => {
    if (!strA || !strB) return false;

    // Normalize and tokenize strings, creating sets of unique words.
    const tokensA = new Set(normalizeForTokenization(strA).split(' ').filter(token => token.length > 0));
    const tokensB = new Set(normalizeForTokenization(strB).split(' ').filter(token => token.length > 0));

    if (tokensA.size === 0 || tokensB.size === 0) return false;

    let matches = 0;
    // Iterate through the smaller set for efficiency
    const [smallerSet, largerSet] = tokensA.size < tokensB.size ? [tokensA, tokensB] : [tokensB, tokensA];

    for (const token1 of smallerSet) {
        let bestMatchFound = false;
        for (const token2 of largerSet) {
            // Check for full or partial match (for abbreviations like 'equip' vs 'equipamentos')
            if (token1.includes(token2) || token2.includes(token1)) {
                bestMatchFound = true;
                break; // Found a match for token1, move to the next one in smallerSet
            }
        }
        if (bestMatchFound) {
            matches++;
        }
    }

    // Calculate a similarity score based on the smaller set of tokens.
    // This correctly identifies when one string is a subset of another.
    const similarity = matches / smallerSet.size;

    // A high threshold ensures that most, if not all, words from the shorter
    // string are present in the longer one.
    return similarity >= 0.8;
};

export const base64ToFile = (base64: string, filename: string, mimeType: string): File => {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: mimeType });
  return new File([blob], filename, { type: mimeType });
};