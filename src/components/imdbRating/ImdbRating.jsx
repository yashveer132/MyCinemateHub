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
}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchRating = async () => {
      if (!tmdbId) {
        setLoading(false);
        return;
      }

      try {
        const result = await fetchImdbRating(tmdbId, mediaType);
        if (mounted) {
          setData(result);
          setLoading(false);
          if (onDataLoaded && result.rating) {
            onDataLoaded(result);
          }
        }
      } catch (error) {
        if (mounted) {
          setData({ rating: null, error: error.message });
          setLoading(false);
        }
      }
    };

    fetchRating();

    return () => {
      mounted = false;
    };
  }, [tmdbId, mediaType, onDataLoaded]);

  if (loading) {
    return (
      <div className="imdbRating loading">
        <span className="ratingText">...</span>
      </div>
    );
  }

  const tooltipContent =
    showTooltip && data ? (
      <div className="rating-tooltip">
        <div className="rating-type">IMDb Rating</div>
        <div className="rating-value">{data.rating || "N/A"}</div>
        {data.votes && <div className="vote-count">{data.votes} votes</div>}
      </div>
    ) : null;

  const ratingElement = (
    <div className="imdbRating">
      <span className="ratingText">{data?.rating || "N/A"}</span>
      {showVotes && data?.votes && (
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
