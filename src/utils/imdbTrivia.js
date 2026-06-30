import axios from "axios";

const cleanWikipediaText = (text) => {
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
    .replace(/\s+/g, " ")
    .trim();
};

const isGenericIntroOrSummary = (text) => {
  const lowerText = text.toLowerCase();

  const introPatterns = [
    /\bis\s+a\s+\d{4}\b/,
    /\bdirected\s+by\b/,
    /\bwritten\s+by\b/,
    /\bstars\b/,
    /\bfollows\s+the\b/,
    /\bco-written\s+by\b/,
    /\bproduced\s+by\b/,
    /\bcast\s+includes\b/,
    /\breleased\s+in\s+\d{4}\b/,
  ];

  return introPatterns.some((pattern) => pattern.test(lowerText));
};

const scoreTriviaItem = (text) => {
  const lowerText = text.toLowerCase();
  let score = 0;

  const highValueKeywords = [
    "rewrote",
    "improvised",
    "practical effects",
    "built from scratch",
    "spent years",
    "trained for",
    "learned",
    "designed",
    "constructed",
    "invented",
    "originally cast",
    "first choice",
    "custom-built",
    "painstakingly",
    "built a set",
    "re-shot",
    "reshot",
    "hand-crafted",
    "special effects",
    "miniature",
    "scale model",
    "budget",
    "costume",
    "choreography",
    "composed",
    "rehearsed",
    "built entirely",
  ];

  const lowValueKeywords = [
    "announced",
    "released",
    "screened",
    "premiered",
    "theatrical release",
    "announced in",
    "casting announcement",
    "distribution rights",
    "home media",
    "dvd",
    "blu-ray",
    "marketing",
    "promotion",
    "box office gross",
    "film festival",
    "commercial success",
    "syndication",
    "netflix",
  ];

  highValueKeywords.forEach((keyword) => {
    if (lowerText.includes(keyword)) score += 3;
  });

  lowValueKeywords.forEach((keyword) => {
    if (lowerText.includes(keyword)) score -= 4;
  });

  return score;
};

const classifyTriviaItem = (text, sectionHeader) => {
  const lowerHeader = sectionHeader.toLowerCase();
  const lowerText = text.toLowerCase();

  const devKeywords = [
    "wrote the script",
    "first draft",
    "years before",
    "development",
    "financing",
    "pitched",
    "screenplay",
  ];
  if (devKeywords.some((keyword) => lowerText.includes(keyword))) {
    return "development";
  }

  if (
    lowerHeader.includes("development") ||
    lowerHeader.includes("writing") ||
    lowerHeader.includes("screenplay") ||
    lowerHeader.includes("concept")
  ) {
    return "development";
  }

  if (lowerHeader.includes("casting") || lowerHeader.includes("cast")) {
    return "casting";
  }

  if (
    lowerHeader.includes("music") ||
    lowerHeader.includes("sound") ||
    lowerHeader.includes("soundtrack") ||
    lowerHeader.includes("score") ||
    lowerText.includes("composer") ||
    lowerText.includes("orchestra")
  ) {
    return "music";
  }

  if (
    lowerHeader.includes("filming") ||
    lowerHeader.includes("production") ||
    lowerHeader.includes("set design") ||
    lowerHeader.includes("cinematography") ||
    lowerHeader.includes("effects") ||
    lowerHeader.includes("design") ||
    lowerText.includes("filmed on") ||
    lowerText.includes("shot in")
  ) {
    return "filming";
  }

  if (
    lowerHeader.includes("reception") ||
    lowerHeader.includes("legacy") ||
    lowerHeader.includes("impact") ||
    lowerHeader.includes("release") ||
    lowerHeader.includes("accolades")
  ) {
    return "legacy";
  }

  return "filming";
};

export const fetchTriviaFromWikipedia = async (
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
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchQuery)}&format=json&origin=*`;
    const searchRes = await axios.get(searchUrl, { headers, timeout: 5000 });
    const searchResults = searchRes.data?.query?.search || [];

    if (searchResults.length === 0) {
      return [];
    }

    const bestResult =
      searchResults.find(
        (res) =>
          !res.title.startsWith("List of") &&
          !res.title.toLowerCase().includes("list of") &&
          !res.title.toLowerCase().includes("season"),
      ) || searchResults[0];

    const pageTitle = bestResult.title;

    const parseUrl = `https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(pageTitle)}&prop=text&format=json&origin=*`;
    const parseRes = await axios.get(parseUrl, { headers, timeout: 5000 });
    const htmlContent = parseRes.data?.parse?.text?.["*"] || "";

    if (!htmlContent) {
      return [];
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, "text/html");

    const triviaItems = [];
    const seenTexts = new Set();

    let currentSection = "Introduction";

    const elements = doc.querySelectorAll("h2, h3, p");
    elements.forEach((el) => {
      const tagName = el.tagName.toLowerCase();

      if (tagName === "h2" || tagName === "h3") {
        currentSection = el.textContent || "Introduction";
        return;
      }

      if (tagName === "p") {
        if (currentSection === "Introduction") return;

        const lowerSection = currentSection.toLowerCase();
        const isTargetSection =
          lowerSection.includes("production") ||
          lowerSection.includes("casting") ||
          lowerSection.includes("filming") ||
          lowerSection.includes("music") ||
          lowerSection.includes("writing") ||
          lowerSection.includes("development") ||
          lowerSection.includes("set design") ||
          lowerSection.includes("cinematography") ||
          lowerSection.includes("reception") ||
          lowerSection.includes("legacy") ||
          lowerSection.includes("release");

        if (!isTargetSection) return;

        let text = el.textContent || el.innerText || "";
        text = cleanWikipediaText(text);

        if (
          text.length < 80 ||
          text.length > 450 ||
          text.includes("Coordinates:") ||
          isGenericIntroOrSummary(text)
        ) {
          return;
        }

        const score = scoreTriviaItem(text);
        if (score < -2) {
          return;
        }

        const signature = text.slice(0, 80);
        if (seenTexts.has(signature)) return;
        seenTexts.add(signature);

        const type = classifyTriviaItem(text, currentSection);

        triviaItems.push({
          id: `wiki_trivia_${triviaItems.length}`,
          text: text,
          type: type,
          score: score,
        });
      }
    });

    triviaItems.sort((a, b) => b.score - a.score);

    return triviaItems;
  } catch (error) {
    console.error("[WIKIPEDIA TRIVIA] Error fetching trivia:", error.message);
    return [];
  }
};
