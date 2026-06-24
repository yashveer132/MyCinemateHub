import axios from "axios";

const cleanQuoteText = (text) => {
  if (!text) return "";
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&#160;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&#91;/g, "[")
    .replace(/&#93;/g, "]")
    .replace(/\[\d+\]/g, "")
    .replace(/\([^)]*\)/g, "")
    .replace(/\[[^\]]*\]/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

const extractQuotesFromHtml = (htmlContent) => {
  if (!htmlContent) return [];

  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, "text/html");

  const quotes = [];
  const seenQuotes = new Set();
  let currentCharacter = "Unknown";

  const elements = doc.querySelectorAll("h2, h3, h4, li");

  const noiseHeaders = new Set([
    "cast",
    "dialogue",
    "about",
    "external links",
    "see also",
    "references",
    "trivia",
    "notes",
    "production",
    "reception",
    "slogan",
    "taglines",
  ]);

  elements.forEach((el) => {
    const tagName = el.tagName.toLowerCase();

    if (tagName === "h2" || tagName === "h3" || tagName === "h4") {
      const headline = el.textContent || el.innerText || "";
      const cleanHeadline = headline.replace(/\[[^\]]*\]/g, "").trim();
      const lowerHeadline = cleanHeadline.toLowerCase();

      if (cleanHeadline && !noiseHeaders.has(lowerHeadline)) {
        currentCharacter = cleanHeadline;
      }
      return;
    }

    if (tagName === "li") {
      const text = el.textContent || el.innerText || "";

      if (
        text.includes(" - ") ||
        text.includes(" – ") ||
        text.includes(" — ")
      ) {
        const parts = text.split(/[-–—]/);
        if (
          parts[0].trim().split(" ").length <= 3 &&
          parts[1].trim().split(" ").length <= 4
        ) {
          return;
        }
      }

      let quoteText = text.trim();
      let character = currentCharacter;

      if (quoteText.includes(":")) {
        const parts = quoteText.split(":");
        const possibleChar = parts[0].trim();
        if (
          possibleChar.split(" ").length <= 3 &&
          possibleChar.match(/^[A-Za-z\s.'"-]+$/)
        ) {
          character = possibleChar;
          quoteText = parts.slice(1).join(":").trim();
        }
      }

      quoteText = cleanQuoteText(quoteText);

      if (quoteText.startsWith('"') && quoteText.endsWith('"'))
        quoteText = quoteText.slice(1, -1);
      if (quoteText.startsWith("“") && quoteText.endsWith("”"))
        quoteText = quoteText.slice(1, -1);
      quoteText = quoteText.trim();

      const minLength = 15;
      const maxLength = 400;
      const normalizedSignature = quoteText
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");

      if (
        quoteText.length >= minLength &&
        quoteText.length <= maxLength &&
        !seenQuotes.has(normalizedSignature) &&
        character !== "Cast" &&
        character !== "About" &&
        character !== "External links" &&
        character !== "References" &&
        character !== "Unknown"
      ) {
        seenQuotes.add(normalizedSignature);
        quotes.push({
          quote: quoteText,
          character: character,
          source: "Wikiquote",
          verified: true,
        });
      }
    }
  });

  return quotes;
};

export const fetchQuotesFromWikiquote = async (
  title,
  year,
  mediaType = "movie",
) => {
  if (!title) return [];

  const searchQuery =
    mediaType === "tv"
      ? `${title} ${year} television series`
      : `${title} ${year} film`;

  console.log(`[WIKIQUOTE] Searching for: "${searchQuery}"`);

  const headers = {
    "User-Agent": "CinemateApp/1.0 (contact: support@cinemate.com) Mozilla/5.0",
  };

  try {
    const wikipediaSearchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchQuery)}&format=json&origin=*`;
    const wikiSearchRes = await axios.get(wikipediaSearchUrl, {
      headers,
      timeout: 5000,
    });
    const wikipediaResults = wikiSearchRes.data?.query?.search || [];

    if (wikipediaResults.length === 0) {
      console.log(
        `[WIKIQUOTE] No article page found on Wikipedia for: "${searchQuery}"`,
      );
      return [];
    }

    const verifiedTitle = wikipediaResults[0].title;
    console.log(
      `[WIKIQUOTE] Verified title from Wikipedia: "${verifiedTitle}"`,
    );

    const wikiquoteSearchUrl = `https://en.wikiquote.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(verifiedTitle)}&format=json&origin=*`;
    const wqSearchRes = await axios.get(wikiquoteSearchUrl, {
      headers,
      timeout: 5000,
    });
    const wqResults = wqSearchRes.data?.query?.search || [];

    if (wqResults.length === 0) {
      console.log(
        `[WIKIQUOTE] No Wikiquote page matching verified title: "${verifiedTitle}"`,
      );
      return [];
    }

    const wqPageTitle = wqResults[0].title;
    console.log(`[WIKIQUOTE] Found Wikiquote page: "${wqPageTitle}"`);

    const parseUrl = `https://en.wikiquote.org/w/api.php?action=parse&page=${encodeURIComponent(wqPageTitle)}&prop=text&format=json&origin=*`;
    const parseRes = await axios.get(parseUrl, { headers, timeout: 5000 });
    const htmlContent = parseRes.data?.parse?.text?.["*"] || "";

    if (!htmlContent) {
      console.log(
        `[WIKIQUOTE] Empty page content returned for: "${wqPageTitle}"`,
      );
      return [];
    }

    const extractedQuotes = extractQuotesFromHtml(htmlContent);
    console.log(
      `[WIKIQUOTE] Successfully extracted ${extractedQuotes.length} quotes for "${wqPageTitle}"`,
    );

    return extractedQuotes;
  } catch (error) {
    console.error("[WIKIQUOTE] Error fetching quotes:", error.message);
    return [];
  }
};
