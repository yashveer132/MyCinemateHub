import axios from "axios";

const MUSICBRAINZ_BASE_URL = "https://musicbrainz.org/ws/2";
const HEADERS = {
  "User-Agent": "CinemateApp/1.0 (contact: support@cinemate.com) Mozilla/5.0",
};

const calculateTitleOverlapScore = (releaseTitle, targetTitle) => {
  const cleanAndTokenize = (str) => {
    return str
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter(
        (word) =>
          word.length > 1 && word !== "the" && word !== "and" && word !== "of",
      );
  };

  const releaseTokens = cleanAndTokenize(releaseTitle);
  const targetTokens = cleanAndTokenize(targetTitle);

  if (targetTokens.length === 0) return 1.0;

  const commonTokens = targetTokens.filter((token) =>
    releaseTokens.includes(token),
  );
  return commonTokens.length / targetTokens.length;
};

export const searchSoundtrackAlbums = async (
  mediaTitle,
  releaseYear = null,
) => {
  if (!mediaTitle) return [];

  const query = `release:"${mediaTitle}" AND (type:soundtrack OR type:other OR title:soundtrack OR title:score)`;
  const url = `${MUSICBRAINZ_BASE_URL}/release/?query=${encodeURIComponent(query)}&fmt=json&limit=25`;

  try {
    const response = await axios.get(url, { headers: HEADERS, timeout: 6000 });
    const releases = response.data?.releases || [];
    const targetYear = releaseYear ? parseInt(releaseYear, 10) : null;

    const formattedAlbums = releases
      .map((release) => {
        const artist = release["artist-credit"]?.[0]?.name || "Various Artists";
        const releaseId = release.id;
        const releaseDateStr = release.date || "";
        const parsedYear = releaseDateStr
          ? new Date(releaseDateStr).getFullYear()
          : null;

        let type = "Soundtrack Album";
        const titleLower = release.title.toLowerCase();
        const artistLower = artist.toLowerCase();

        const isScore =
          titleLower.includes("score") ||
          titleLower.includes("composed by") ||
          titleLower.includes("original music") ||
          (artistLower !== "various artists" &&
            artistLower.trim() !== "" &&
            artistLower !== "unknown artist");

        if (isScore && artistLower !== "various artists") {
          type = "Original Score";
        } else if (
          titleLower.includes("theme") ||
          titleLower.includes("main title")
        ) {
          type = "Main Theme";
        }

        const overlapScore = calculateTitleOverlapScore(
          release.title,
          mediaTitle,
        );

        return {
          id: releaseId,
          title: release.title,
          artist: artist,
          trackCount: release["track-count"] || 0,
          releaseDate: releaseDateStr || "Unknown Date",
          releaseYear: parsedYear,
          coverUrl: `https://coverartarchive.org/release/${releaseId}/front-250`,
          source: "MusicBrainz",
          type: type,
          overlapScore: overlapScore,
        };
      })
      .filter((album) => {
        if (album.overlapScore < 0.6) {
          return false;
        }

        if (targetYear && album.releaseYear) {
          const yearDiff = Math.abs(album.releaseYear - targetYear);
          if (yearDiff > 2) {
            return false;
          }
        }

        return true;
      });

    formattedAlbums.sort((a, b) => {
      if (b.overlapScore !== a.overlapScore) {
        return b.overlapScore - a.overlapScore;
      }

      if (targetYear) {
        const aYearDiff = a.releaseYear
          ? Math.abs(a.releaseYear - targetYear)
          : 99;
        const bYearDiff = b.releaseYear
          ? Math.abs(b.releaseYear - targetYear)
          : 99;
        if (aYearDiff !== bYearDiff) {
          return aYearDiff - bYearDiff;
        }
      }

      const getPriorityScore = (album) => {
        const title = album.title.toLowerCase();
        let score = 0;
        if (title.includes("original motion picture soundtrack")) score += 10;
        else if (title.includes("motion picture soundtrack")) score += 8;
        else if (title.includes("original soundtrack")) score += 6;
        else if (title.includes("soundtrack")) score += 4;
        else if (title.includes("score")) score += 2;
        return score;
      };

      return getPriorityScore(b) - getPriorityScore(a);
    });

    const seenTitles = new Set();
    return formattedAlbums.filter((album) => {
      const normalizedTitle = album.title
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
      if (seenTitles.has(normalizedTitle)) return false;
      seenTitles.add(normalizedTitle);
      return true;
    });
  } catch (error) {
    console.error("[SOUNDTRACK] MusicBrainz search failed:", error.message);
    return [];
  }
};

export const fetchAlbumTracks = async (releaseId) => {
  if (!releaseId) return [];

  const url = `${MUSICBRAINZ_BASE_URL}/release/${releaseId}?inc=recordings&fmt=json`;

  try {
    const response = await axios.get(url, { headers: HEADERS, timeout: 6000 });
    const media = response.data?.media?.[0];
    const tracks = media?.tracks || [];

    return tracks.map((track, index) => {
      const durationMs = track.length || 0;
      const durationMin = durationMs ? Math.floor(durationMs / 60000) : 0;
      const durationSec = durationMs
        ? Math.floor((durationMs % 60000) / 1000)
        : 0;
      const durationStr = durationMs
        ? `${durationMin}:${durationSec.toString().padStart(2, "0")}`
        : "N/A";

      const title = track.title || track.recording?.title || "Unknown Track";
      const artist =
        track["artist-credit"]?.[0]?.name ||
        response.data["artist-credit"]?.[0]?.name ||
        "Various Artists";

      return {
        id: track.id || `track_${index}`,
        position: track.position || index + 1,
        title: title,
        artist: artist,
        duration: durationStr,
      };
    });
  } catch (error) {
    console.error("[SOUNDTRACK] Failed to fetch album tracks:", error.message);
    return [];
  }
};
