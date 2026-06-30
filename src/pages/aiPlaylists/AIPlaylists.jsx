import React, { useEffect, useState } from "react";
import ContentWrapper from "../../components/contentWrapper/ContentWrapper";
import Carousel from "../../components/carousel/Carousel";
import {
  fetchDataFromApi,
  getFallbackResults,
  getSimilarityResults,
  getMoviesByPerson,
} from "../../utils/api";
import { playlistStorage } from "../../utils/playlistStorage";
import "./style.scss";

const SUGGESTIONS = [
  "shows like money heist",
  "horror movies 2024",
  "cozy romances for weekend",
  "mind-bending sci-fi",
  "korean thrillers",
  "Christopher Nolan movies",
];

const LANGUAGE_MAP = {
  korean: "ko",
  japanese: "ja",
  french: "fr",
  spanish: "es",
  hindi: "hi",
  tamil: "ta",
  telugu: "te",
  german: "de",
  italian: "it",
  chinese: "zh",
};

const parseQueryLocal = async (q) => {
  const lowerQ = q.toLowerCase().trim();
  const result = {
    mediaType: "movie",
    isSimilarity: false,
    similarTitles: [],
    person: null,
    tmdbParams: {},
  };

  if (
    lowerQ.includes("tv show") ||
    lowerQ.includes("tv series") ||
    lowerQ.includes("show") ||
    lowerQ.includes("series") ||
    lowerQ.includes("episode")
  ) {
    result.mediaType = "tv";
  }

  const similarityRegex =
    /(?:movies?|shows?|series)?\s*(?:like|similar to|recommendations for)\s+(.+)/i;
  const simMatch = q.match(similarityRegex);
  if (simMatch && simMatch[1]) {
    result.isSimilarity = true;
    result.similarTitles = [simMatch[1].trim()];
    return result;
  }

  let personName = null;
  const byRegex = /(?:directed by|starring|by|with|featuring)\s+([a-zA-Z\s]+)/i;
  const moviesByRegex = /\b([a-zA-Z\s]+?)\s+(?:movies|shows|films|series)\b/i;

  const byMatch = q.match(byRegex);
  const moviesByMatch = q.match(moviesByRegex);

  if (byMatch && byMatch[1]) {
    personName = byMatch[1].trim();
  } else if (
    moviesByMatch &&
    moviesByMatch[1] &&
    ![
      "top",
      "best",
      "new",
      "horror",
      "scifi",
      "sci-fi",
      "action",
      "comedy",
      "romance",
      "romantic",
      "thriller",
      "drama",
      "animated",
      "animation",
      "fantasy",
      "family",
      "korean",
      "japanese",
      "french",
      "spanish",
      "hindi",
    ].includes(moviesByMatch[1].toLowerCase().trim())
  ) {
    personName = moviesByMatch[1].trim();
  }

  if (personName) {
    try {
      const searchRes = await fetchDataFromApi("/search/person", {
        query: personName,
        page: 1,
      });
      if (searchRes?.results?.length > 0) {
        result.person = searchRes.results[0].name;
        return result;
      }
    } catch (e) {
      console.warn("Error searching person:", e);
    }
  }

  const params = {};

  const genreKeywords = {
    28: ["action", "fight", "warrior", "explosive"],
    12: ["adventure", "quest", "exploration", "journey"],
    16: ["animation", "animated", "anime", "cartoon"],
    35: ["comedy", "funny", "humor", "hilarious", "laugh"],
    80: ["crime", "heist", "gangster", "mafia", "police", "detective"],
    99: ["documentary", "real life", "biography"],
    18: ["drama", "sad", "emotional", "touching", "intense"],
    10751: ["family", "kids", "children"],
    14: ["fantasy", "magic", "mythology"],
    36: ["history", "historical"],
    27: ["horror", "scary", "spooky", "ghost", "creepy", "slasher"],
    9648: ["mystery", "puzzle", "clue"],
    10749: ["romance", "romantic", "love", "cozy"],
    878: ["sci-fi", "scifi", "science fiction", "space", "alien", "future"],
    53: ["thriller", "suspense", "tension"],
    10752: ["war", "battle", "military"],
    37: ["western", "cowboy"],
  };

  const tvGenreKeywords = {
    10759: ["action", "adventure", "quest"],
    16: ["animation", "animated", "anime", "cartoon"],
    35: ["comedy", "funny", "humor"],
    80: ["crime", "police", "heist"],
    99: ["documentary"],
    18: ["drama", "sad", "emotional"],
    10751: ["family", "kids"],
    10762: ["kids"],
    9648: ["mystery"],
    10765: ["sci-fi", "scifi", "science fiction", "fantasy", "magic", "space"],
    10768: ["war", "politics"],
  };

  const detectedGenres = [];
  const genreMapToUse =
    result.mediaType === "tv" ? tvGenreKeywords : genreKeywords;

  for (const [id, keywords] of Object.entries(genreMapToUse)) {
    if (keywords.some((kw) => lowerQ.includes(kw))) {
      detectedGenres.push(id);
    }
  }

  if (detectedGenres.length > 0) {
    params.with_genres = detectedGenres.join(",");
  }

  const yearMatch = q.match(/\b(19|20)\d{2}\b/);
  if (yearMatch) {
    const yr = yearMatch[0];
    if (result.mediaType === "tv") {
      params.first_air_date_year = yr;
    } else {
      params.primary_release_year = yr;
    }
  }

  const decadeMatch = q.match(/\b(19|20)?\d{1,2}s\b/);
  if (decadeMatch) {
    const decadeStr = decadeMatch[0];
    const decadeNum = parseInt(decadeStr.replace("s", ""));
    const startYear =
      decadeNum < 100
        ? decadeNum >= 70
          ? 1900 + decadeNum
          : 2000 + decadeNum
        : decadeNum;
    const endYear = startYear + 9;
    if (result.mediaType === "movie") {
      params.primary_release_date_gte = `${startYear}-01-01`;
      params.primary_release_date_lte = `${endYear}-12-31`;
    } else {
      params.first_air_date_gte = `${startYear}-01-01`;
      params.first_air_date_lte = `${endYear}-12-31`;
    }
  }

  for (const [word, code] of Object.entries(LANGUAGE_MAP)) {
    if (lowerQ.includes(word)) {
      params.with_original_language = code;
      break;
    }
  }

  if (lowerQ.match(/best|top|highest rated|rating|imdb|award|oscar|academy/)) {
    params.sort_by = "vote_average.desc";
    params["vote_count.gte"] = 100;
  } else if (lowerQ.match(/new|latest|recent/)) {
    if (result.mediaType === "tv") {
      params.sort_by = "first_air_date.desc";
    } else {
      params.sort_by = "release_date.desc";
    }
  } else {
    params.sort_by = "popularity.desc";
  }

  result.tmdbParams = params;
  return result;
};

const AIPlaylists = () => {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [mediaType, setMediaType] = useState("movie");
  const [savedPlaylists, setSavedPlaylists] = useState([]);
  const [showSavedPlaylists, setShowSavedPlaylists] = useState(false);
  const [saveDialog, setSaveDialog] = useState({ show: false, name: "" });
  const [playlistTitle, setPlaylistTitle] = useState(
    "Sample Playlist: Horror Movies 2024",
  );
  const pageTitle = "Smart Playlists";

  const runSearch = async (q) => {
    setLoading(true);
    setResults([]);

    try {
      const parsed = await parseQueryLocal(q);
      const mt = parsed.mediaType;
      setMediaType(mt);

      let data = null;

      if (parsed.person) {
        data = await getMoviesByPerson(
          parsed.person,
          mt,
          "popularity",
          "director",
        );
      } else if (parsed.isSimilarity && parsed.similarTitles.length > 0) {
        data = await getSimilarityResults(parsed.similarTitles, mt);
      } else {
        const endpoint = mt === "tv" ? "/discover/tv" : "/discover/movie";
        data = await fetchDataFromApi(endpoint, {
          ...parsed.tmdbParams,
          page: 1,
        });

        if (!data || (data.results || []).length < 6) {
          const searchEndpoint = mt === "tv" ? "/search/tv" : "/search/movie";
          const searchData = await fetchDataFromApi(searchEndpoint, {
            query: q,
            page: 1,
          });
          if (searchData?.results?.length) {
            data = searchData;
          }
        }
      }

      if (!data || !data.results || data.results.length === 0) {
        const fb = await getFallbackResults(q, mt);
        data = fb;
      }

      const items = (data?.results || []).slice(0, 20);
      if (items.length > 0) {
        setResults(items.map((i) => ({ ...i, media_type: mt })));
        setPlaylistTitle(
          q ? `Playlist: ${q}` : "Sample Playlist: Horror Movies 2024",
        );
      } else {
        runSearch("horror movies 2024");
        setPlaylistTitle("Sample Playlist: Horror Movies 2024");
      }
    } catch (e) {
      console.error("Search error:", e);
      runSearch("horror movies 2024");
      setPlaylistTitle("Sample Playlist: Horror Movies 2024");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = () => {
    if (!query.trim()) return;
    runSearch(query.trim());
  };

  const loadSavedPlaylists = () => {
    try {
      const playlists = playlistStorage.getAllPlaylists();
      setSavedPlaylists(playlists);
    } catch (error) {
      console.error("Failed to load playlists:", error);
    }
  };

  const saveCurrentPlaylist = (name) => {
    if (!results.length) return;

    try {
      const saved = playlistStorage.savePlaylist(
        name,
        results,
        query,
        mediaType,
      );
      setSaveDialog({ show: false, name: "" });
      loadSavedPlaylists();
    } catch (err) {
      console.error("Failed to save playlist:", err);
    }
  };

  const loadPlaylist = (playlist) => {
    try {
      setResults(playlist.items);
      setQuery(playlist.query);
      setMediaType(playlist.mediaType);
      setShowSavedPlaylists(false);
      setPlaylistTitle(`Playlist: ${playlist.query}`);
    } catch (error) {
      console.error("Failed to load playlist:", error);
    }
  };

  const deletePlaylist = (id) => {
    try {
      if (playlistStorage.deletePlaylist(id)) {
        loadSavedPlaylists();
      }
    } catch (error) {
      console.error("Failed to delete playlist:", error);
    }
  };

  useEffect(() => {
    runSearch("horror movies 2024");
    loadSavedPlaylists();
  }, []);

  return (
    <div className="aiPlaylistsPage">
      <ContentWrapper>
        <div className="pageHeader">
          <h1 className="pageTitle">{pageTitle}</h1>
          <div className="searchBar">
            <input
              type="text"
              placeholder="e.g. 'horror movies 2024' or 'korean thrillers'"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyUp={(e) => e.key === "Enter" && onSubmit()}
            />
            <button onClick={onSubmit} disabled={!query.trim()}>
              {loading ? (
                <svg
                  className="button-spinner"
                  viewBox="0 0 20 20"
                  width="20"
                  height="20"
                >
                  <circle
                    cx="10"
                    cy="10"
                    r="8"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                  />
                </svg>
              ) : (
                "Create"
              )}
            </button>
            <button
              className="save-btn"
              onClick={() =>
                setSaveDialog({ show: true, name: query || "My Playlist" })
              }
              disabled={!query.trim() || !results.length}
            >
              💾 Save
            </button>
            <button
              className="saved-btn"
              onClick={() => setShowSavedPlaylists(!showSavedPlaylists)}
            >
              📂 Saved ({savedPlaylists.length})
            </button>
          </div>

          {saveDialog.show && (
            <div className="save-dialog-overlay">
              <div className="save-dialog">
                <h3>Save Playlist</h3>
                <input
                  type="text"
                  placeholder="Enter playlist name"
                  value={saveDialog.name}
                  onChange={(e) =>
                    setSaveDialog({ ...saveDialog, name: e.target.value })
                  }
                  onKeyUp={(e) =>
                    e.key === "Enter" && saveCurrentPlaylist(saveDialog.name)
                  }
                />
                <div className="dialog-buttons">
                  <button
                    onClick={() => setSaveDialog({ show: false, name: "" })}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => saveCurrentPlaylist(saveDialog.name)}
                    disabled={!saveDialog.name.trim()}
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          )}

          {showSavedPlaylists && (
            <div className="saved-playlists-section">
              <h3>Your Saved Playlists</h3>
              {savedPlaylists.length === 0 ? (
                <p>No saved playlists yet. Create and save one!</p>
              ) : (
                <div className="saved-playlists-grid">
                  {savedPlaylists.map((playlist) => (
                    <div key={playlist.id} className="saved-playlist-card">
                      <div className="playlist-info">
                        <h4>{playlist.name}</h4>
                        <p>{playlist.query}</p>
                        <small>
                          {playlist.items.length} items • {playlist.mediaType} •
                          {new Date(playlist.createdAt).toLocaleDateString()}
                        </small>
                      </div>
                      <div className="playlist-actions">
                        <button
                          onClick={() => loadPlaylist(playlist)}
                          className="load-btn"
                        >
                          Load
                        </button>
                        <button
                          onClick={() => deletePlaylist(playlist.id)}
                          className="delete-btn"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </ContentWrapper>

      <div className="carouselSection">
        <ContentWrapper>
          <div className="carouselTitle">{playlistTitle}</div>
        </ContentWrapper>
        <Carousel data={results} loading={loading} endpoint={mediaType} />
      </div>
    </div>
  );
};

export default AIPlaylists;
