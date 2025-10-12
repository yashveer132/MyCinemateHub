import React, { useMemo } from "react";
import "./seasonComparison.scss";

const SeasonComparison = ({ seasons }) => {
  const seasonsData = useMemo(() => {
    return seasons
      ?.filter((season) => season.season_number > 0)
      ?.map((season) => ({
        number: season.season_number,
        episodeCount: season.episode_count || 0,
        rating: season.vote_average || 0,
        airDate: season.air_date,
        name: season.name,
      }))
      ?.sort((a, b) => a.number - b.number);
  }, [seasons]);

  if (!seasonsData || seasonsData.length === 0) return null;

  const maxEpisodes = Math.max(...seasonsData.map((s) => s.episodeCount));

  const bestSeason = seasonsData.reduce((prev, current) =>
    prev.rating > current.rating ? prev : current
  );
  const worstSeason = seasonsData.reduce((prev, current) =>
    prev.rating < current.rating && current.rating > 0 ? prev : current
  );

  const avgRating =
    seasonsData.reduce((sum, s) => sum + s.rating, 0) / seasonsData.length;

  return (
    <div className="seasonComparison">
      <div className="comparisonHeader">
        <h3>📊 Season Analytics</h3>
        <p>Compare ratings and episode counts across all seasons</p>
      </div>

      <div className="statsCards">
        <div className="statCard best">
          <div className="statIcon">🏆</div>
          <div className="statLabel">Best Season</div>
          <div className="statValue">Season {bestSeason.number}</div>
          <div className="statSubtext">
            ⭐ {bestSeason.rating.toFixed(1)}/10
          </div>
        </div>

        <div className="statCard worst">
          <div className="statIcon">📉</div>
          <div className="statLabel">Lowest Rated</div>
          <div className="statValue">Season {worstSeason.number}</div>
          <div className="statSubtext">
            ⭐ {worstSeason.rating.toFixed(1)}/10
          </div>
        </div>

        <div className="statCard average">
          <div className="statIcon">📈</div>
          <div className="statLabel">Average Rating</div>
          <div className="statValue">{avgRating.toFixed(1)}/10</div>
          <div className="statSubtext">{seasonsData.length} Seasons</div>
        </div>

        <div className="statCard episodes">
          <div className="statIcon">📺</div>
          <div className="statLabel">Total Episodes</div>
          <div className="statValue">
            {seasonsData.reduce((sum, s) => sum + s.episodeCount, 0)}
          </div>
          <div className="statSubtext">Across all seasons</div>
        </div>
      </div>

      <div className="chartSection">
        <h4>📊 Episode Count by Season</h4>
        <div className="episodeChart">
          {seasonsData.map((season) => {
            const width = (season.episodeCount / maxEpisodes) * 100;

            return (
              <div key={season.number} className="episodeBar">
                <div className="episodeLabel">
                  <span className="seasonNum">Season {season.number}</span>
                  <span className="episodeCount">
                    {season.episodeCount} eps
                  </span>
                </div>
                <div className="progressBar">
                  <div
                    className="progress"
                    style={{ width: `${width}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SeasonComparison;
