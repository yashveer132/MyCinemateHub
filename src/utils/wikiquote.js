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

  const noiseHeaders = [
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
    "critic",
    "review",
    "contents",
  ];

  const isCharacterNoise = (char) => {
    const lower = char.toLowerCase();
    return (
      lower === "skip" ||
      lower === "contents" ||
      /^\d+/.test(lower) ||
      noiseHeaders.some((noise) => lower === noise || lower.includes(noise)) ||
      lower.includes("unknown")
    );
  };

  elements.forEach((el) => {
    if (el.closest(".toc") || el.closest("#toc") || el.closest(".toclimit"))
      return;

    const tagName = el.tagName.toLowerCase();

    if (tagName === "h2" || tagName === "h3" || tagName === "h4") {
      const headline = el.textContent || el.innerText || "";
      const cleanHeadline = headline.replace(/\[[^\]]*\]/g, "").trim();
      const lowerHeadline = cleanHeadline.toLowerCase();

      if (cleanHeadline) {
        const isNoise = noiseHeaders.some(
          (noise) => lowerHeadline === noise || lowerHeadline.includes(noise),
        );
        if (isNoise || isCharacterNoise(cleanHeadline)) {
          currentCharacter = "Skip";
        } else {
          currentCharacter = cleanHeadline;
        }
      }
      return;
    }

    if (tagName === "li") {
      if (currentCharacter === "Skip") return;

      const text = el.textContent || el.innerText || "";

      const lowerText = text.toLowerCase().trim();
      if (
        lowerText.startsWith("interview ") ||
        lowerText.startsWith("cited ") ||
        lowerText.startsWith("review ") ||
        lowerText.includes("external links") ||
        lowerText.includes("contents") ||
        /^\d+/.test(lowerText)
      ) {
        return;
      }

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
        !isCharacterNoise(character)
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
      ? `intitle:"${title}" television series`
      : `intitle:"${title}" film`;


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
     
      return [];
    }

    const bestWikiResult =
      wikipediaResults.find(
        (res) =>
          !res.title.startsWith("List of") &&
          !res.title.toLowerCase().includes("list of") &&
          !res.title.toLowerCase().includes("season"),
      ) || wikipediaResults[0];

    const verifiedTitle = bestWikiResult.title;

    const wikiquoteSearchUrl = `https://en.wikiquote.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent('intitle:"' + verifiedTitle + '"')}&format=json&origin=*`;
    const wqSearchRes = await axios.get(wikiquoteSearchUrl, {
      headers,
      timeout: 5000,
    });
    const wqResults = wqSearchRes.data?.query?.search || [];

    if (wqResults.length === 0) {
      return [];
    }

    const cleanStr = (str) =>
      str
        .toLowerCase()
        .replace(/\s*\([^)]*\)/g, "")
        .replace(/[^a-z0-9]/g, "")
        .trim();

    const cleanSearchTitle = cleanStr(title);

    const bestWqResult = wqResults.find((res) => {
      const cleanWqTitle = cleanStr(res.title);
      return (
        cleanWqTitle === cleanSearchTitle ||
        cleanWqTitle.includes(cleanSearchTitle) ||
        cleanSearchTitle.includes(cleanWqTitle)
      );
    });

    if (!bestWqResult) {
      return [];
    }

    const wqPageTitle = bestWqResult.title;

    const parseUrl = `https://en.wikiquote.org/w/api.php?action=parse&page=${encodeURIComponent(wqPageTitle)}&prop=text&format=json&origin=*`;
    const parseRes = await axios.get(parseUrl, { headers, timeout: 5000 });
    const htmlContent = parseRes.data?.parse?.text?.["*"] || "";

    if (!htmlContent) {
     
      return [];
    }

    const extractedQuotes = extractQuotesFromHtml(htmlContent);
   

    return extractedQuotes;
  } catch (error) {
    console.error("[WIKIQUOTE] Error fetching quotes:", error.message);
    return [];
  }
};
