import React from "react";
import Tooltip from "../tooltip/Tooltip";

import "./style.scss";

const CircleRating = ({ rating, voteCount, showTooltip = false, customColor }) => {
  const tooltipContent =
    showTooltip && voteCount ? (
      <div className="rating-tooltip">
        <div className="rating-type">TMDB Rating</div>
        <div className="rating-value">{rating}</div>
        <div className="vote-count">{voteCount.toLocaleString()} votes</div>
      </div>
    ) : null;

  const ratingElement = (
    <div className="circleRating" style={customColor ? { backgroundColor: customColor } : undefined}>
      <span className="ratingText">{rating}</span>
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

export default CircleRating;
