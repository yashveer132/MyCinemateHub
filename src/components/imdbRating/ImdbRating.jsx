import React, { useState, useEffect } from "react";
import { fetchImdbRating } from "../../utils/api";
import Tooltip from "../tooltip/Tooltip";
import "./style.scss";

const ImdbRating = ({
  tmdbId,
  mediaType = "movie",
  showVotes = false,
  onDataLoaded,
  showTooltip = false,
  onlyFromCache = false,
}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchRating = async () => {
      if (!tmdbId) {
        setLoading(false);
        if (onDataLoaded) {
          onDataLoaded({ rating: null, votes: null });
        }
        return;
      }

      const cacheKey = `${mediaType}-${tmdbId}`;
      try {
        const saved = localStorage.getItem("imdb_ratings_cache");
        if (saved) {
          const cacheMap = new Map(JSON.parse(saved));
          if (cacheMap.has(cacheKey)) {
            const cachedData = cacheMap.get(cacheKey);
            if (mounted) {
              setData(cachedData);
              setLoading(false);
              if (onDataLoaded) {
                onDataLoaded(cachedData);
              }
            }
            return;
          }
        }
      } catch (e) {
        console.error("[IMDB] Failed to read localStorage synchronously:", e);
      }

      if (onlyFromCache) {
        if (mounted) {
          setLoading(false);
          if (onDataLoaded) {
            onDataLoaded({ rating: null, votes: null });
          }
        }
        return;
      }

      try {
        const result = await fetchImdbRating(tmdbId, mediaType);
        if (mounted) {
          setData(result);
          setLoading(false);
          if (onDataLoaded) {
            onDataLoaded(result);
          }
        }
      } catch (error) {
        if (mounted) {
          const result = { rating: null, votes: null, error: error.message };
          setData(result);
          setLoading(false);
          if (onDataLoaded) {
            onDataLoaded(result);
          }
        }
      }
    };

    fetchRating();

    return () => {
      mounted = false;
    };
  }, [tmdbId, mediaType, onDataLoaded, onlyFromCache]);

  if (loading) {
    return null;
  }

  if (!data?.rating || data.rating === "N/A") {
    return null;
  }

  const tooltipContent =
    showTooltip && data ? (
      <div className="rating-tooltip">
        <div className="rating-type">IMDb Rating</div>
        <div className="rating-value">{data.rating}</div>
        {data.votes && <div className="vote-count">{data.votes} votes</div>}
      </div>
    ) : null;

  const ratingElement = (
    <div className="imdbRating">
      <span className="ratingText">{data.rating}</span>
      {showVotes && data.votes && (
        <span className="votesText">{data.votes}</span>
      )}
    </div>
  );

  if (showTooltip && tooltipContent) {
    return (
      <Tooltip content={tooltipContent} position="top">
        {ratingElement}
      </Tooltip>
    );
  }

  return ratingElement;
};

export default ImdbRating;
