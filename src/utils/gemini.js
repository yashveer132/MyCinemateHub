import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  throw new Error("Missing VITE_GEMINI_API_KEY in environment variables");
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const GENRE_MAP = {
  action: 28,
  adventure: 12,
  animation: 16,
  comedy: 35,
  crime: 80,
  documentary: 99,
  drama: 18,
  family: 10751,
  fantasy: 14,
  history: 36,
  horror: 27,
  music: 10402,
  mystery: 9648,
  romance: 10749,
  "science fiction": 878,
  "sci-fi": 878,
  scifi: 878,
  "tv movie": 10770,
  thriller: 53,
  war: 10752,
  western: 37,
};

const validateModel = async (model) => {
  try {
    await model.generateContent("test");
    return true;
  } catch (error) {
    return false;
  }
};

const cleanJsonResponse = (text) => {
  const jsonMatch = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  return jsonMatch ? jsonMatch[0] : text;
};

const correctSpelling = async (query) => {
  const model = genAI.getGenerativeModel({
    model: "models/gemini-2.0-flash",
    safetySettings: [
      {
        category: "HARM_CATEGORY_HARASSMENT",
        threshold: "BLOCK_NONE",
      },
    ],
  });

  try {
    const isValid = await validateModel(model);
    if (!isValid) {
      return query;
    }
  } catch (error) {
    return query;
  }

  const prompt = `Correct any spelling mistakes in this movie/TV search query: "${query}". 
  If there are no spelling mistakes, return the original query exactly as is.
  Return only the corrected query text, nothing else.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const corrected = response.text().trim();
    return corrected || query;
  } catch (error) {
    return query;
  }
};

const convertToTMDBParams = (geminiResponse) => {
  const genreIds = geminiResponse.genres
    .map((genre) => GENRE_MAP[genre.toLowerCase()])
    .filter((id) => id);

  return {
    query: geminiResponse.keywords.join(" "),
    with_genres: genreIds.join(","),
    ...(geminiResponse.year && {
      primary_release_date_gte: `${geminiResponse.year.start}-01-01`,
      primary_release_date_lte: `${geminiResponse.year.end}-12-31`,
    }),
    sort_by:
      geminiResponse.sort === "rating"
        ? "vote_average.desc"
        : geminiResponse.sort === "date"
        ? "primary_release_date.desc"
        : "popularity.desc",
  };
};

const extractSearchParams = async (query) => {
  const model = genAI.getGenerativeModel({
    model: "models/gemini-2.0-flash",
    safetySettings: [
      {
        category: "HARM_CATEGORY_HARASSMENT",
        threshold: "BLOCK_NONE",
      },
    ],
  });

  try {
    const isValid = await validateModel(model);
    if (!isValid) {
      throw new Error(
        "Model validation failed - Check if you're using Gemini 2.0 Flash API key"
      );
    }
  } catch (error) {
    return null;
  }

  const prompt = `
    Analyze this movie/TV search query: "${query}"
    Return a JSON object with these exact fields:
    {
      "mediaType": either "movie" or "tv" or "all",
      "year": null or {"start": YYYY, "end": YYYY},
      "genres": array of genre names from [action, adventure, animation, comedy, crime, documentary, drama, family, fantasy, history, horror, music, mystery, romance, science fiction, thriller, war, western],
      "sort": either "popularity", "rating", or "date",
      "keywords": array of relevant search terms,
      "isSimilarity": true if the query is asking for similar movies/TV shows (e.g., "like", "similar to"),
      "similarTitles": array of titles mentioned after "like" or "similar to" (empty if not similarity),
      "person": the name of the person (director, actor, etc.) if the query is about their movies/TV shows (e.g., "Christopher Nolan movies", "movies by Tarantino") or null,
      "role": "director", "actor", or "producer" if person is set, based on context (e.g., "starring X" = actor, "movies by X" = director)
    }
    
    For example: "action movies from 2020" would return:
    {
      "mediaType": "movie",
      "year": {"start": 2020, "end": 2020},
      "genres": ["action"],
      "sort": "popularity",
      "keywords": ["action", "2020"],
      "isSimilarity": false,
      "similarTitles": [],
      "person": null
    }
    
    For "Christopher Nolan top movies" would return:
    {
      "mediaType": "movie",
      "year": null,
      "genres": [],
      "sort": "rating",
      "keywords": ["sci-fi", "thriller"],
      "isSimilarity": false,
      "similarTitles": [],
      "person": "Christopher Nolan",
      "role": "director"
    }
    
    For "movies starring Leonardo DiCaprio" would return:
    {
      "mediaType": "movie",
      "year": null,
      "genres": [],
      "sort": "popularity",
      "keywords": ["drama"],
      "isSimilarity": false,
      "similarTitles": [],
      "person": "Leonardo DiCaprio",
      "role": "actor"
    }`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const cleanedResponse = cleanJsonResponse(response.text());
    const parsedResponse = JSON.parse(cleanedResponse);

    if (
      !parsedResponse ||
      !parsedResponse.mediaType ||
      !parsedResponse.genres
    ) {
      throw new Error("Invalid response structure");
    }

    const tmdbParams = convertToTMDBParams(parsedResponse);

    return {
      aiParams: parsedResponse,
      tmdbParams: tmdbParams,
    };
  } catch (error) {
    return {
      mediaType: "all",
      genres: [],
      sort: "popularity",
      keywords: [query],
      isSimilarity: false,
      similarTitles: [],
      person: null,
      role: null,
    };
  }
};

const generateTrivia = async (movieTitle, movieOverview) => {
  const model = genAI.getGenerativeModel({
    model: "models/gemini-2.0-flash",
    safetySettings: [
      {
        category: "HARM_CATEGORY_HARASSMENT",
        threshold: "BLOCK_NONE",
      },
    ],
  });

  try {
    const isValid = await validateModel(model);
    if (!isValid) {
      throw new Error(
        "Model validation failed - Check if you're using Gemini 2.0 Flash API key"
      );
    }
  } catch (error) {
    return null;
  }

  const prompt = `
    Generate 3-5 interesting trivia facts or fun facts about the movie "${movieTitle}".
    Movie overview: "${movieOverview}"
    
    Return ONLY a JSON array with this exact structure, no additional text:
    [
      {
        "id": "unique_id_1",
        "text": "The trivia fact text here",
        "spoiler": false,
        "type": "trivia"
      },
      {
        "id": "unique_id_2", 
        "text": "Another interesting fact",
        "spoiler": false,
        "type": "fun_fact"
      }
    ]
    
    Make sure the facts are accurate, interesting, and not spoilers.
    Use "trivia" or "fun_fact" for the type.
    Generate unique IDs for each fact.
    Return only the JSON array, nothing else.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text().trim();

    const cleanedResponse = cleanJsonResponse(text);

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(cleanedResponse);
    } catch (parseError) {
      const jsonStart = text.indexOf("[");
      const jsonEnd = text.lastIndexOf("]") + 1;
      if (jsonStart !== -1 && jsonEnd > jsonStart) {
        const jsonText = text.substring(jsonStart, jsonEnd);
        parsedResponse = JSON.parse(jsonText);
      } else {
        throw parseError;
      }
    }

    if (!Array.isArray(parsedResponse)) {
      throw new Error("Invalid response structure");
    }

    return {
      id: Date.now(),
      results: parsedResponse,
    };
  } catch (error) {
    console.error("Error generating trivia:", error);
    return null;
  }
};

const generateMemorableQuotes = async (
  movieTitle,
  movieOverview,
  genres = []
) => {
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
  });

  try {
    const isValid = await validateModel(model);
    if (!isValid) {
      throw new Error("Model validation failed");
    }

    const genreNames = genres.map((g) => g.name).join(", ");

    const prompt = `
Generate 5-8 memorable and iconic quotes from the movie "${movieTitle}".
Consider the movie's overview: "${movieOverview}"
Genres: ${genreNames}

For each quote, provide:
1. The exact quote text
2. The character who said it (if known/applicable)
3. Brief context about when/why it's memorable
4. Why it's significant to the movie's themes or plot

Format the response as a JSON array of objects with this structure:
[
  {
    "quote": "Exact quote text here",
    "character": "Character name or 'Unknown'",
    "context": "Brief explanation of the scene and significance",
    "significance": "Why this quote is important to the movie"
  }
]

Ensure quotes are authentic and actually memorable from the movie. If you're not certain about specific quotes, generate plausible but contextually appropriate ones based on the movie's themes and overview. Focus on quotes that capture the essence of the movie's message, character development, or key plot moments.

Response must be valid JSON array only.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(text);
    } catch (parseError) {
      const jsonStart = text.indexOf("[");
      const jsonEnd = text.lastIndexOf("]") + 1;
      if (jsonStart !== -1 && jsonEnd > jsonStart) {
        const jsonText = text.substring(jsonStart, jsonEnd);
        parsedResponse = JSON.parse(jsonText);
      } else {
        throw parseError;
      }
    }

    if (!Array.isArray(parsedResponse)) {
      throw new Error("Invalid response structure");
    }

    return {
      id: Date.now(),
      results: parsedResponse,
    };
  } catch (error) {
    console.error("Error generating memorable quotes:", error);
    return null;
  }
};

const generateAwards = async (title, overview, genres = []) => {
  const model = genAI.getGenerativeModel({
    model: "models/gemini-2.0-flash",
    safetySettings: [
      {
        category: "HARM_CATEGORY_HARASSMENT",
        threshold: "BLOCK_NONE",
      },
    ],
  });

  try {
    const isValid = await validateModel(model);
    if (!isValid) {
      throw new Error(
        "Model validation failed - Check if you're using Gemini 2.0 Flash API key"
      );
    }
  } catch (error) {
    return null;
  }

  const genreNames = genres.map((g) => g.name).join(", ");

  const prompt = `
    Generate information about major awards WON by the movie/TV show "${title}".
    Movie/TV overview: "${overview}"
    Genres: ${genreNames}
    
    Return ONLY a JSON object with this exact structure, no additional text:
    {
      "awards": [
        {
          "id": "unique_id_1",
          "award": "Academy Awards (Oscars)",
          "category": "Best Picture",
          "result": "Won",
          "year": 2023,
          "nominees": ["Movie Title"]
        },
        {
          "id": "unique_id_2",
          "award": "Golden Globes",
          "category": "Best Director",
          "result": "Won",
          "year": 2023,
          "nominees": ["Director Name"]
        }
      ],
      "summary": "Brief summary of the movie's major award wins"
    }
    
    IMPORTANT: Only include awards that were ACTUALLY WON, not nominations.
    Focus on major awards like Oscars, Golden Globes, Emmys (for TV), BAFTAs, Cannes, etc.
    If no major awards were won, return an empty awards array and appropriate summary.
    Make sure the information is accurate based on real knowledge.
    Generate unique IDs for each award entry.
    Return only the JSON object, nothing else.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text().trim();

    const cleanedResponse = cleanJsonResponse(text);

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(cleanedResponse);
    } catch (parseError) {
      const jsonStart = text.indexOf("{");
      const jsonEnd = text.lastIndexOf("}") + 1;
      if (jsonStart !== -1 && jsonEnd > jsonStart) {
        const jsonText = text.substring(jsonStart, jsonEnd);
        parsedResponse = JSON.parse(jsonText);
      } else {
        throw parseError;
      }
    }

    if (!parsedResponse || typeof parsedResponse !== "object") {
      throw new Error("Invalid response structure");
    }

    return {
      id: Date.now(),
      ...parsedResponse,
    };
  } catch (error) {
    console.error("Error generating awards:", error);
    return null;
  }
};

const generateAIReview = async (
  title,
  overview,
  tmdbReviews = [],
  redditPosts = []
) => {
  const model = genAI.getGenerativeModel({
    model: "models/gemini-2.0-flash",
    safetySettings: [
      {
        category: "HARM_CATEGORY_HARASSMENT",
        threshold: "BLOCK_NONE",
      },
    ],
  });

  try {
    const isValid = await validateModel(model);
    if (!isValid) {
      throw new Error(
        "Model validation failed - Check if you're using Gemini 2.0 Flash API key"
      );
    }
  } catch (error) {
    return null;
  }

  const tmdbSnippets = (tmdbReviews || []).slice(0, 4).map((r) => ({
    author: r?.author,
    rating: r?.author_details?.rating ?? null,
    content: (r?.content || "").slice(0, 500),
  }));

  const redditSnippets = (redditPosts || []).slice(0, 6).map((p) => ({
    title: p?.title,
    score: p?.score,
    comments: p?.num_comments,
    text: (p?.selftext || "").slice(0, 300),
    subreddit: p?.subreddit,
    type: p?.reviewType,
  }));

  const prompt = `
You are a seasoned film/TV critic. Synthesize a concise, balanced, and accurate review for the title "${title}" using:
- Official overview: ${overview ? JSON.stringify(overview) : ""}
- Up to ${tmdbSnippets.length} TMDB critic/user snippets: ${JSON.stringify(
    tmdbSnippets
  )}
- Up to ${redditSnippets.length} Reddit discussion snippets: ${JSON.stringify(
    redditSnippets
  )}

Rules:
- Be neutral and evidence-based; avoid spoilers.
- If sources conflict, reflect nuance and indicate mixed reception.
- Prefer widely-agreed themes over isolated opinions.
- Keep it helpful for someone deciding whether to watch.

Return ONLY a JSON object with this exact schema:
{
  "headline": string,
  "summary": string,
  "highlights": string[],
  "lowlights": string[],
  "verdict": string,
  "score": number,
  "confidence": "low"|"medium"|"high",
  "sourcesUsed": { "tmdbCount": number, "redditCount": number }
}

Do not include any additional commentary outside the JSON.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();
    const cleaned = cleanJsonResponse(text);
    const parsed = JSON.parse(cleaned);

    if (!parsed || typeof parsed !== "object") {
      throw new Error("Invalid AI review structure");
    }

    const score = Math.max(1, Math.min(10, Number(parsed.score) || 0));
    const highlights = Array.isArray(parsed.highlights)
      ? parsed.highlights
      : [];
    const lowlights = Array.isArray(parsed.lowlights) ? parsed.lowlights : [];

    return {
      headline: parsed.headline || `${title} — Review`,
      summary: parsed.summary || "",
      highlights,
      lowlights,
      verdict: parsed.verdict || "",
      score,
      confidence: parsed.confidence || "medium",
      sourcesUsed: {
        tmdbCount: parsed.sourcesUsed?.tmdbCount ?? tmdbSnippets.length,
        redditCount: parsed.sourcesUsed?.redditCount ?? redditSnippets.length,
      },
    };
  } catch (error) {
    console.error("Error generating AI review:", error);
    return null;
  }
};

export {
  extractSearchParams,
  correctSpelling,
  generateTrivia,
  generateMemorableQuotes,
  generateAwards,
  generateAIReview,
};
