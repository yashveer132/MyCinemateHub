import React from "react";
import CircleRating from "../circleRating/CircleRating";
import "./style.scss";

const AdditionalRatings = ({ ratings, showTooltip = false }) => {
  if (!ratings || (!ratings.rottenTomatoes && !ratings.metacritic)) {
    return null;
  }

  const parseRottenTomatoes = (value) => {
    if (!value) return null;
    const match = value.match(/(\d+)%/);
    return match ? parseInt(match[1]) / 10 : null; // Convert to 0-10 scale
  };

  const parseMetacritic = (value) => {
    if (!value) return null;
    const match = value.match(/(\d+)/);
    return match ? parseInt(match[1]) / 10 : null; // Convert to 0-10 scale
  };

  const rtRating = parseRottenTomatoes(ratings.rottenTomatoes);
  const mcRating = parseMetacritic(ratings.metacritic);

  return (
    <div className="additionalRatings">
      {rtRating && (
        <div className="ratingsSection">
          <CircleRating
            rating={rtRating.toFixed(1)}
            showTooltip={showTooltip}
            customColor="#ff6b6b"
          />
          <div className="ratingInfo">
            <div className="ratingLabel">Rotten Tomatoes</div>
            <div className="voteCount">{ratings.rottenTomatoes}</div>
          </div>
        </div>
      )}

      {mcRating && (
        <div className="ratingsSection">
          <CircleRating
            rating={mcRating.toFixed(1)}
            showTooltip={showTooltip}
            customColor="#4ecdc4"
          />
          <div className="ratingInfo">
            <div className="ratingLabel">Metacritic</div>
            <div className="voteCount">{ratings.metacritic}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdditionalRatings;