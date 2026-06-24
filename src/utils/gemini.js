import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

let geminiAvailable = true;
let lastErrorTime = 0;
const ERROR_COOLDOWN = 60000;

if (!GEMINI_API_KEY) {
  console.warn(
    "⚠️ VITE_GEMINI_API_KEY not found - AI features will be limited",
  );
  geminiAvailable = false;
}

const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

export const GENRE_MAP = {
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

const cleanJsonResponse = (text) => {
  const jsonMatch = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  return jsonMatch ? jsonMatch[0] : text;
};

const correctSpelling = async (query) => {
  if (!geminiAvailable || !genAI) {
    return query;
  }

  const model = genAI.getGenerativeModel({
    model: "models/gemini-2.5-flash",
    safetySettings: [
      {
        category: "HARM_CATEGORY_HARASSMENT",
        threshold: "BLOCK_NONE",
      },
    ],
  });

  const prompt = `Correct any spelling mistakes in this movie/TV search query: "${query}". 
  If there are no spelling mistakes, return the original query exactly as is.
  Return only the corrected query text, nothing else.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const corrected = response.text().trim();
    return corrected || query;
  } catch (error) {
    console.error("AI Spelling correction error:", error);
    if (
      error?.message?.includes("API key") ||
      error?.status === 403 ||
      error?.status === 400
    ) {
      geminiAvailable = false;
    }
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
  if (!geminiAvailable || !genAI) {
    throw new Error("VITE_GEMINI_API_KEY not configured");
  }

  const now = Date.now();
  if (now - lastErrorTime < ERROR_COOLDOWN) {
    throw new Error("AI temporarily unavailable due to recent errors");
  }

  const model = genAI.getGenerativeModel({
    model: "models/gemini-2.5-flash",
    safetySettings: [
      {
        category: "HARM_CATEGORY_HARASSMENT",
        threshold: "BLOCK_NONE",
      },
    ],
  });

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
    
    For "shows like money heist" would return:
    {
      "mediaType": "tv",
      "year": null,
      "genres": ["crime", "thriller"],
      "sort": "popularity",
      "keywords": ["heist", "crime", "thriller"],
      "isSimilarity": true,
      "similarTitles": ["Money Heist"],
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
    lastErrorTime = now;
    console.error("AI extraction error:", error);
    if (
      error?.message?.includes("API key") ||
      error?.status === 403 ||
      error?.status === 400
    ) {
      geminiAvailable = false;
    }

    return {
      aiParams: {
        mediaType: "all",
        genres: [],
        sort: "popularity",
        keywords: [query],
        isSimilarity: false,
        similarTitles: [],
        person: null,
        role: null,
      },
      tmdbParams: {
        query: query,
        sort_by: "popularity.desc",
      },
      fallback: true,
    };
  }
};

const generateTrivia = async (movieTitle, movieOverview) => {
  if (!geminiAvailable || !genAI) {
    return null;
  }

  const model = genAI.getGenerativeModel({
    model: "models/gemini-2.5-flash",
    safetySettings: [
      {
        category: "HARM_CATEGORY_HARASSMENT",
        threshold: "BLOCK_NONE",
      },
    ],
  });

  const prompt = `
    Generate 5-8 interesting trivia facts, fun facts, and easter eggs about the movie/TV show "${movieTitle}".
    Movie overview: "${movieOverview}"
    
    Include:
    - Behind-the-scenes trivia
    - Hidden details and easter eggs (references to other movies, hidden messages, cameos)
    - Production facts
    - Fun facts about cast or crew
    - Visual easter eggs and hidden details in scenes
    
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
        "text": "An easter egg or hidden detail",
        "spoiler": false,
        "type": "easter_egg"
      },
      {
        "id": "unique_id_3", 
        "text": "Another interesting fun fact",
        "spoiler": false,
        "type": "fun_fact"
      }
    ]
    
    Make sure the facts are accurate, interesting, and not spoilers.
    Use "trivia", "fun_fact", or "easter_egg" for the type.
    Generate at least 5 items.
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
    if (
      error?.message?.includes("API key") ||
      error?.status === 403 ||
      error?.status === 400
    ) {
      geminiAvailable = false;
    }
    return null;
  }
};

const generateMemorableQuotes = async (
  movieTitle,
  movieOverview,
  genres = [],
) => {
  if (!geminiAvailable || !genAI) {
    return null;
  }

  const model = genAI.getGenerativeModel({
    model: "models/gemini-2.5-flash",
  });

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

  try {
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
    if (
      error?.message?.includes("API key") ||
      error?.status === 403 ||
      error?.status === 400
    ) {
      geminiAvailable = false;
    }
    return null;
  }
};

const generateAwards = async (
  title,
  overview,
  genres = [],
  omdbAwardsSummary = null,
) => {
  if (!geminiAvailable || !genAI) {
    return null;
  }

  const model = genAI.getGenerativeModel({
    model: "models/gemini-2.5-flash",
    safetySettings: [
      {
        category: "HARM_CATEGORY_HARASSMENT",
        threshold: "BLOCK_NONE",
      },
    ],
  });

  const genreNames = genres.map((g) => g.name).join(", ");

  const prompt = `
    Generate information about major awards WON by the movie/TV show "${title}".
    Movie/TV overview: "${overview}"
    Genres: ${genreNames}
    ${
      omdbAwardsSummary
        ? `REAL AWARDS DATA FROM IMDb: "${omdbAwardsSummary}"`
        : ""
    }
    
    ${
      omdbAwardsSummary
        ? "IMPORTANT: Use the REAL AWARDS DATA above as your foundation. Generate detailed award information that matches and expands upon this verified data. Do not contradict the real awards summary."
        : "IMPORTANT: Research and provide ACCURATE information about awards ACTUALLY WON by this movie/TV show. Only include verified wins from major awards like Oscars, Golden Globes, Emmys (for TV), BAFTAs, Cannes, etc. Do not invent awards or nominations."
    }
    
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
    
    ${
      omdbAwardsSummary
        ? "Generate unique IDs for each award entry. Return only the JSON object, nothing else."
        : "If no major awards were won, return an empty awards array and appropriate summary. Make sure the information is accurate based on real knowledge. Generate unique IDs for each award entry. Return only the JSON object, nothing else."
    }
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
    if (
      error?.message?.includes("API key") ||
      error?.status === 403 ||
      error?.status === 400
    ) {
      geminiAvailable = false;
    }
    return null;
  }
};

const generateActorTimeline = async (actorName, biography, credits) => {
  if (!geminiAvailable || !genAI) {
    return null;
  }

  const model = genAI.getGenerativeModel({
    model: "models/gemini-2.5-flash",
    safetySettings: [
      {
        category: "HARM_CATEGORY_HARASSMENT",
        threshold: "BLOCK_NONE",
      },
    ],
  });

  const movies = (credits?.cast || [])
    .filter((item) => item.media_type === "movie")
    .slice(0, 20);
  const tvShows = (credits?.cast || [])
    .filter((item) => item.media_type === "tv")
    .slice(0, 10);
  const creditsSummary = {
    movies: movies.map((m) => ({
      title: m.title,
      year: m.release_date ? new Date(m.release_date).getFullYear() : null,
      character: m.character,
      popularity: m.popularity,
      id: m.id,
    })),
    tvShows: tvShows.map((t) => ({
      title: t.name,
      year: t.first_air_date ? new Date(t.first_air_date).getFullYear() : null,
      character: t.character,
      popularity: t.popularity,
      id: t.id,
    })),
  };

  const prompt = `
Generate a comprehensive career timeline for the actor "${actorName}".
Use the provided biography and credits to create 15-20 key milestones.
Include a mix of positive and negative moments, achievements, peaks, lows, and significant career events like debut roles, major breakthroughs, awards, genre shifts, collaborations, box office successes/failures, critical acclaim, controversies, comebacks, and recent works.
Ensure to include milestones from the most recent years available in the credits, prioritizing the latest developments up to 2025 if data is available.

Biography: "${biography || "No biography available"}"
Credits Summary: ${JSON.stringify(creditsSummary)}

Return ONLY a JSON array of objects with this exact structure, no additional text:
[
  {
    "year": 1990,
    "title": "Debut in Titanic",
    "description": "First major role as Jack Dawson in Titanic, which became a blockbuster.",
    "type": "movie",
    "link": "/movie/597"
  },
  {
    "year": 2016,
    "title": "Oscar Win for Revenant",
    "description": "Won Academy Award for Best Actor for The Revenant.",
    "type": "award",
    "link": null
  },
  {
    "year": 2000,
    "title": "Box Office Peak with Gladiator",
    "description": "Starred in Gladiator, which grossed over $460 million worldwide.",
    "type": "peak",
    "link": "/movie/98"
  },
  {
    "year": 1995,
    "title": "Critical Low with Cutthroat Island",
    "description": "Starred in Cutthroat Island, which was a major box office flop.",
    "type": "low_point",
    "link": "/movie/1408"
  }
]

Types: "movie", "tv", "award", "milestone", "peak", "low_point", "achievement", "controversy", "comeback".
For "movie" or "tv" types, provide the link as "/movie/{id}" or "/tv/{id}" using the ID from credits. For other types, use null.
Ensure years are accurate based on credits. Prioritize including recent milestones from the latest years, ensuring coverage up to the most current data available.
Sort chronologically by year.
Generate unique, relevant milestones covering the full career spectrum, with emphasis on recent developments. Include both highs and lows for a complete picture.
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

    parsedResponse.sort((a, b) => (a.year || 0) - (b.year || 0));

    return {
      id: Date.now(),
      milestones: parsedResponse,
    };
  } catch (error) {
    console.error("Error generating actor timeline:", error);
    if (
      error?.message?.includes("API key") ||
      error?.status === 403 ||
      error?.status === 400
    ) {
      geminiAvailable = false;
    }
    return null;
  }
};

const generateUserInsights = async (summary) => {
  if (!geminiAvailable || !genAI) {
    return null;
  }

  const model = genAI.getGenerativeModel({
    model: "models/gemini-2.5-flash",
    safetySettings: [
      { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
    ],
  });

  const genreNames = (summary.topGenresById || [])
    .map((id) => summary.genreIdToName?.[id] || String(id))
    .join(", ");

  const prompt = `You are an expert movie and TV taste analyst. Using ONLY the structured inputs below, produce concise, useful insights about the user's viewing taste. Do not invent facts.

Speak directly to the user in second person ("you"), never say "this user" or "they". Make the summary vivid but precise. Prefer concrete descriptors.

INPUT:
${JSON.stringify({
  counts: summary.counts,
  topGenresById: summary.topGenresById,
  topGenresByName: (summary.topGenresById || []).map(
    (id) => summary.genreIdToName?.[id] || id,
  ),
  sampleTitles: summary.titlesSample?.slice(0, 15) || [],
})}

Return ONLY valid JSON with this exact schema:
{
  "summary": string,                     // 2-4 sentences overview of your taste, use "you"
  "tasteProfile": {                      // short bullet-like takeaways
    "vibe": string[],                    // 3-6 items, e.g., "dark & gritty", "uplifting", "mind-bending"
    "pace": string,                      // "slow-burn" | "balanced" | "fast-paced" (pick one)
    "prefersSeries": boolean,            // guess from watchLater vs favorites/watched if possible else false
    "rewatchTendency": "low"|"medium"|"high"
  },
  "topGenres": [                         // by NAME, descending
    string
  ],
  "suggestedKeywords": [                 // 8-12 short keywords to help discovery
    string
  ],
  "creatorLeanings": {                   // optional light-weight tendencies
    "directors": string[],
    "actors": string[]
  },
  "diversity": {                         // how varied the taste looks
    "genreSpread": "narrow"|"mixed"|"broad",
    "risk": "safe"|"experimental"
  }
}`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const cleaned = cleanJsonResponse(response.text().trim());
    const parsed = JSON.parse(cleaned);

    const insights = {
      summary: parsed.summary || "",
      tasteProfile: parsed.tasteProfile || {
        vibe: [],
        pace: "balanced",
        prefersSeries: false,
        rewatchTendency: "medium",
      },
      topGenres: Array.isArray(parsed.topGenres) ? parsed.topGenres : [],
      suggestedKeywords: Array.isArray(parsed.suggestedKeywords)
        ? parsed.suggestedKeywords
        : [],
      creatorLeanings: parsed.creatorLeanings || { directors: [], actors: [] },
      diversity: parsed.diversity || { genreSpread: "mixed", risk: "safe" },
    };

    return insights;
  } catch (error) {
    console.error("Error generating user insights:", error);
    if (
      error?.message?.includes("API key") ||
      error?.status === 403 ||
      error?.status === 400
    ) {
      geminiAvailable = false;
    }
    return null;
  }
};

export {
  extractSearchParams,
  correctSpelling,
  generateTrivia,
  generateMemorableQuotes,
  generateAwards,
  generateActorTimeline,
  generateUserInsights,
};
