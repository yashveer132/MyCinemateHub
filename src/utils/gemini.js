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
      "keywords": array of relevant search terms
    }
    
    For example: "action movies from 2020" would return:
    {
      "mediaType": "movie",
      "year": {"start": 2020, "end": 2020},
      "genres": ["action"],
      "sort": "popularity",
      "keywords": ["action", "2020"]
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

export { extractSearchParams, generateTrivia, generateMemorableQuotes };
