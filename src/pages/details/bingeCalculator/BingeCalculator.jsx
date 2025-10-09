import React, { useState, useEffect } from "react";
import { fetchDataFromApi } from "../../../utils/api";
import ContentWrapper from "../../../components/contentWrapper/ContentWrapper";
import "./style.scss";

const BingeCalculator = ({ showId, showData }) => {
  const [seasonData, setSeasonData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [selectedSpeed, setSelectedSpeed] = useState(1);

  useEffect(() => {
    const fetchAllSeasonsData = async () => {
      if (!showId || !showData?.seasons) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const seasonsToFetch = showData.seasons.filter(
          (season) => season.season_number > 0
        );

        const seasonPromises = seasonsToFetch.map((season) =>
          fetchDataFromApi(`/tv/${showId}/season/${season.season_number}`)
        );

        const seasonsDetails = await Promise.all(seasonPromises);

        const processedSeasons = seasonsDetails.map((seasonDetail) => {
          const episodes = seasonDetail.episodes || [];
          const totalRuntime = episodes.reduce((sum, episode) => {
            return sum + (episode.runtime || 0);
          }, 0);

          return {
            seasonNumber: seasonDetail.season_number,
            name: seasonDetail.name,
            episodeCount: episodes.length,
            totalMinutes: totalRuntime,
            averageEpisodeRuntime:
              episodes.length > 0
                ? Math.round(totalRuntime / episodes.length)
                : 0,
            poster: seasonDetail.poster_path,
            airDate: seasonDetail.air_date,
          };
        });

        setSeasonData(processedSeasons);

        const grandTotal = processedSeasons.reduce(
          (sum, season) => sum + season.totalMinutes,
          0
        );
        setTotalMinutes(grandTotal);
      } catch (error) {
        console.error("Error fetching season data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllSeasonsData();
  }, [showId, showData]);

  const formatTime = (minutes, speed = 1) => {
    const adjustedMinutes = Math.round(minutes / speed);
    const days = Math.floor(adjustedMinutes / 1440);
    const hours = Math.floor((adjustedMinutes % 1440) / 60);
    const mins = adjustedMinutes % 60;

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (mins > 0 || parts.length === 0) parts.push(`${mins}m`);

    return parts.join(" ");
  };

  const formatDetailedTime = (minutes, speed = 1) => {
    const adjustedMinutes = Math.round(minutes / speed);
    const days = Math.floor(adjustedMinutes / 1440);
    const hours = Math.floor((adjustedMinutes % 1440) / 60);
    const mins = adjustedMinutes % 60;

    const parts = [];
    if (days > 0) parts.push(`${days} ${days === 1 ? "day" : "days"}`);
    if (hours > 0) parts.push(`${hours} ${hours === 1 ? "hour" : "hours"}`);
    if (mins > 0 || parts.length === 0)
      parts.push(`${mins} ${mins === 1 ? "minute" : "minutes"}`);

    return parts.join(", ");
  };

  const getEstimatedCompletionTime = (minutes, speed) => {
    const hoursPerDay = 3;
    const totalHours = minutes / 60 / speed;
    const days = Math.ceil(totalHours / hoursPerDay);
    return days;
  };

  const skeleton = () => (
    <div className="skeletonWrapper">
      <div className="skeletonCard">
        <div className="skeletonTitle skeleton"></div>
        <div className="skeletonText skeleton"></div>
        <div className="skeletonText skeleton"></div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="bingeCalculator">
        <ContentWrapper>
          <div className="sectionHeading">
            <span className="icon">⏱️</span>
            Binge Calculator
          </div>
          <div className="loadingContainer">
            {skeleton()}
            {skeleton()}
            {skeleton()}
          </div>
        </ContentWrapper>
      </div>
    );
  }

  if (!seasonData || seasonData.length === 0) {
    return null;
  }

  const speedOptions = [
    { value: 1, label: "1x", description: "Normal Speed" },
    { value: 1.25, label: "1.25x", description: "Slightly Faster" },
    { value: 1.5, label: "1.5x", description: "Fast" },
    { value: 1.75, label: "1.75x", description: "Very Fast" },
    { value: 2, label: "2x", description: "Lightning Fast" },
  ];

  return (
    <div className="bingeCalculator">
      <ContentWrapper>
        <div className="sectionHeading">
          <span className="icon">⏱️</span>
          Binge Calculator
          <span className="subtitle">
            Plan your perfect binge-watching session
          </span>
        </div>

        <div className="speedSelector">
          <div className="speedLabel">Playback Speed:</div>
          <div className="speedOptions">
            {speedOptions.map((option) => (
              <button
                key={option.value}
                className={`speedButton ${
                  selectedSpeed === option.value ? "active" : ""
                }`}
                onClick={() => setSelectedSpeed(option.value)}
              >
                <span className="speedValue">{option.label}</span>
                <span className="speedDesc">{option.description}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="totalTimeCard">
          <div className="totalTimeContent">
            <div className="totalTimeLabel">Total Watch Time</div>
            <div className="totalTimeValue">
              {formatDetailedTime(totalMinutes, selectedSpeed)}
            </div>
            <div className="totalTimeStats">
              <div className="statItem">
                <span className="statIcon">📺</span>
                <span className="statValue">
                  {seasonData.reduce((sum, s) => sum + s.episodeCount, 0)}
                </span>
                <span className="statLabel">Episodes</span>
              </div>
              <div className="statItem">
                <span className="statIcon">🎬</span>
                <span className="statValue">{seasonData.length}</span>
                <span className="statLabel">Seasons</span>
              </div>
              <div className="statItem">
                <span className="statIcon">📅</span>
                <span className="statValue">
                  {getEstimatedCompletionTime(totalMinutes, selectedSpeed)}
                </span>
                <span className="statLabel">Days (3h/day)</span>
              </div>
            </div>
          </div>
        </div>

        <div className="seasonsGrid">
          {seasonData.map((season, index) => (
            <div
              key={season.seasonNumber}
              className="seasonCard"
              style={{ "--animation-delay": `${index * 0.1}s` }}
            >
              <div className="seasonHeader">
                <div className="seasonNumber">Season {season.seasonNumber}</div>
                <div className="seasonEpisodes">
                  {season.episodeCount} episodes
                </div>
              </div>
              <div className="seasonBody">
                <div className="seasonTime">
                  <div className="timeIcon">⏰</div>
                  <div className="timeDetails">
                    <div className="mainTime">
                      {formatTime(season.totalMinutes, selectedSpeed)}
                    </div>
                    <div className="timeBreakdown">
                      {formatDetailedTime(season.totalMinutes, selectedSpeed)}
                    </div>
                  </div>
                </div>
                <div className="seasonMeta">
                  <div className="metaItem">
                    <span className="metaIcon">📊</span>
                    <span className="metaText">
                      Avg:{" "}
                      {Math.round(season.averageEpisodeRuntime / selectedSpeed)}{" "}
                      min/ep
                    </span>
                  </div>
                  {season.airDate && (
                    <div className="metaItem">
                      <span className="metaIcon">📅</span>
                      <span className="metaText">
                        {new Date(season.airDate).getFullYear()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="seasonProgress">
                <div
                  className="progressBar"
                  style={{
                    width: `${(season.totalMinutes / totalMinutes) * 100}%`,
                  }}
                ></div>
              </div>
              <div className="seasonPercentage">
                {((season.totalMinutes / totalMinutes) * 100).toFixed(1)}% of
                total
              </div>
            </div>
          ))}
        </div>

        <div className="bingeInsights">
          <div className="insightCard">
            <div className="insightIcon">☕</div>
            <div className="insightContent">
              <div className="insightTitle">Coffee Breaks</div>
              <div className="insightValue">
                {Math.ceil(totalMinutes / selectedSpeed / 60)} breaks
              </div>
              <div className="insightDesc">One per hour recommended</div>
            </div>
          </div>
          <div className="insightCard">
            <div className="insightIcon">🍿</div>
            <div className="insightContent">
              <div className="insightTitle">Snack Time</div>
              <div className="insightValue">
                {Math.ceil(totalMinutes / selectedSpeed / 120)} meals
              </div>
              <div className="insightDesc">Plan your meals ahead</div>
            </div>
          </div>
          <div className="insightCard">
            <div className="insightIcon">😴</div>
            <div className="insightContent">
              <div className="insightTitle">Sleep Cycles</div>
              <div className="insightValue">
                {Math.ceil(totalMinutes / selectedSpeed / 1440)} nights
              </div>
              <div className="insightDesc">Don't forget to rest!</div>
            </div>
          </div>
          <div className="insightCard">
            <div className="insightIcon">🎯</div>
            <div className="insightContent">
              <div className="insightTitle">Marathon Mode</div>
              <div className="insightValue">
                {Math.ceil(totalMinutes / selectedSpeed / 60 / 8)} days
              </div>
              <div className="insightDesc">8 hours of watching/day</div>
            </div>
          </div>
        </div>
      </ContentWrapper>
    </div>
  );
};

export default BingeCalculator;
