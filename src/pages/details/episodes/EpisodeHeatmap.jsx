import React, { useMemo } from "react";
import "./episodeHeatmap.scss";

const EpisodeHeatmap = ({ episodes, seasonNumber }) => {
  const episodesData = useMemo(() => {
    if (!episodes || episodes.length === 0) return [];

    return episodes
      .map((ep) => ({
        number: ep.episode_number,
        name: ep.name,
        rating: ep.vote_average || 0,
        voteCount: ep.vote_count || 0,
        airDate: ep.air_date,
      }))
      .sort((a, b) => a.number - b.number);
  }, [episodes]);

  if (!episodesData || episodesData.length === 0) return null;

  const avgRating =
    episodesData.reduce((sum, ep) => sum + ep.rating, 0) / episodesData.length;

  const bestEpisode = episodesData.reduce((prev, current) =>
    prev.rating > current.rating ? prev : current
  );

  const worstEpisode = episodesData.reduce((prev, current) =>
    prev.rating < current.rating && current.rating > 0 ? prev : current
  );

  const getColor = (rating) => {
    if (rating === 0) return "#2d2d2d";
    if (rating < 5) return "#ef4444";
    if (rating < 6) return "#f97316";
    if (rating < 7) return "#eab308";
    if (rating < 8) return "#84cc16";
    if (rating < 9) return "#22c55e";
    return "#10b981";
  };

  const getRatingCategory = (rating) => {
    if (rating === 0) return "Not Rated";
    if (rating < 5) return "Poor";
    if (rating < 6) return "Below Average";
    if (rating < 7) return "Average";
    if (rating < 8) return "Good";
    if (rating < 9) return "Excellent";
    return "Outstanding";
  };

  return (
    <div className="episodeHeatmap">
      <div className="heatmapHeader">
        <h4>🔥 Episode Rating Heatmap</h4>
        <p>Visual comparison of all episodes in Season {seasonNumber}</p>
      </div>

      <div className="heatmapStats">
        <div className="statItem">
          <span className="statLabel">Average Rating</span>
          <span className="statValue">{avgRating.toFixed(2)}/10</span>
        </div>
        <div className="statItem best">
          <span className="statLabel">Best Episode</span>
          <span className="statValue">
            Ep {bestEpisode.number} • {bestEpisode.rating.toFixed(1)}⭐
          </span>
        </div>
        <div className="statItem worst">
          <span className="statLabel">Lowest Rated</span>
          <span className="statValue">
            Ep {worstEpisode.number} • {worstEpisode.rating.toFixed(1)}⭐
          </span>
        </div>
      </div>

      <div className="heatmapGrid">
        {episodesData.map((episode) => {
          const isBest = episode.number === bestEpisode.number;
          const isWorst = episode.number === worstEpisode.number;

          return (
            <div
              key={episode.number}
              className={`heatmapCell ${isBest ? "best" : ""} ${
                isWorst ? "worst" : ""
              }`}
              style={{
                backgroundColor: getColor(episode.rating),
              }}
              title={`Episode ${episode.number}: ${episode.name}\nRating: ${
                episode.rating > 0 ? episode.rating.toFixed(1) : "N/A"
              }/10\nVotes: ${episode.voteCount}\n${getRatingCategory(
                episode.rating
              )}`}
            >
              <div className="cellContent">
                <div className="episodeNum">{episode.number}</div>
                <div className="rating">
                  {episode.rating > 0 ? episode.rating.toFixed(1) : "-"}
                </div>
              </div>
              {(isBest || isWorst) && (
                <div className="badge">{isBest ? "👑" : "📉"}</div>
              )}
            </div>
          );
        })}
      </div>

      <div className="heatmapLegend">
        <div className="legendTitle">Rating Scale:</div>
        <div className="legendScale">
          <div className="scaleItem">
            <div
              className="scaleColor"
              style={{ backgroundColor: "#ef4444" }}
            ></div>
            <span>&lt;5.0 Poor</span>
          </div>
          <div className="scaleItem">
            <div
              className="scaleColor"
              style={{ backgroundColor: "#f97316" }}
            ></div>
            <span>5.0-5.9</span>
          </div>
          <div className="scaleItem">
            <div
              className="scaleColor"
              style={{ backgroundColor: "#eab308" }}
            ></div>
            <span>6.0-6.9</span>
          </div>
          <div className="scaleItem">
            <div
              className="scaleColor"
              style={{ backgroundColor: "#84cc16" }}
            ></div>
            <span>7.0-7.9</span>
          </div>
          <div className="scaleItem">
            <div
              className="scaleColor"
              style={{ backgroundColor: "#22c55e" }}
            ></div>
            <span>8.0-8.9</span>
          </div>
          <div className="scaleItem">
            <div
              className="scaleColor"
              style={{ backgroundColor: "#10b981" }}
            ></div>
            <span>9.0+ Excellent</span>
          </div>
        </div>
      </div>

      <div className="episodeRatingsList">
        <h5>📋 Detailed Episode Ratings</h5>
        <div className="ratingsList">
          {episodesData.map((episode) => {
            const width = (episode.rating / 10) * 100;
            return (
              <div key={episode.number} className="ratingItem">
                <div className="episodeInfo">
                  <span className="epNum">Ep {episode.number}</span>
                  <span className="epName">{episode.name}</span>
                </div>
                <div className="ratingBar">
                  <div
                    className="ratingFill"
                    style={{
                      width: `${width}%`,
                      backgroundColor: getColor(episode.rating),
                    }}
                  >
                    <span className="ratingText">
                      {episode.rating > 0 ? episode.rating.toFixed(1) : "N/A"}
                    </span>
                  </div>
                </div>
                <div className="ratingCategory">
                  {getRatingCategory(episode.rating)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default EpisodeHeatmap;
