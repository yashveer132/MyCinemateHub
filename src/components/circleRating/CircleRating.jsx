import React from "react";
import Tooltip from "../tooltip/Tooltip";

import "./style.scss";

const CircleRating = ({
  rating,
  voteCount,
  showTooltip = false,
  customColor,
}) => {
  const getWeightedRating = (rawRating, count) => {
    const R = parseFloat(rawRating);
    const v = parseInt(count);

    if (isNaN(R) || isNaN(v) || v <= 0) {
      return typeof rawRating === "number" ? rawRating.toFixed(1) : rawRating;
    }

    const m = 100;
    const C = 6.8;

    const weighted = (v * R + m * C) / (v + m);
    return weighted.toFixed(1);
  };

  const displayRating = getWeightedRating(rating, voteCount);

  const tooltipContent = voteCount ? (
    <div className="rating-tooltip">
      <div className="rating-type">Weighted Score</div>
      <div className="rating-value">{displayRating}</div>
      <div className="rating-raw">Raw: {parseFloat(rating).toFixed(1)}</div>
      <div className="vote-count">{voteCount.toLocaleString()} votes</div>
    </div>
  ) : null;

  const ratingElement = (
    <div
      className="circleRating"
      style={customColor ? { backgroundColor: customColor } : undefined}
    >
      <span className="ratingText">{displayRating}</span>
    </div>
  );

  if (tooltipContent) {
    return (
      <Tooltip content={tooltipContent} position="top">
        {ratingElement}
      </Tooltip>
    );
  }

  return ratingElement;
};

export default CircleRating;
