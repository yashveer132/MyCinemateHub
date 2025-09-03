import React from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import useFetch from "../../../hooks/useFetch";
import ContentWrapper from "../../../components/contentWrapper/ContentWrapper";
import Img from "../../../components/lazyLoadImage/Img";
import "./style.scss";

const Episodes = ({ tvId, seasonNumber, seasonData }) => {
  const { data, loading } = useFetch(`/tv/${tvId}/season/${seasonNumber}`);
  const { url } = useSelector((state) => state.home);
  const navigate = useNavigate();

  const handleEpisodeClick = (episodeNumber) => {
    navigate(`/tv/${tvId}/season/${seasonNumber}/episode/${episodeNumber}`);
  };

  const skeleton = () => {
    return (
      <div className="skItem">
        <div className="episodeNumber skeleton"></div>
        <div className="episodePoster skeleton"></div>
        <div className="episodeInfo">
          <div className="title skeleton"></div>
          <div className="overview skeleton"></div>
          <div className="date skeleton"></div>
        </div>
      </div>
    );
  };

  const formatRuntime = (runtime) => {
    if (!runtime) return "";
    return `${runtime} min`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "TBA";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="episodesSection">
      <ContentWrapper>
        <div className="episodesHeader">
          <h3>Season {seasonNumber} Episodes</h3>
          <span className="episodeCount">
            {data?.episodes?.length || seasonData?.episode_count || 0} Episodes
          </span>
        </div>

        {!loading ? (
          <div className="episodesList">
            {data?.episodes?.map((episode) => (
              <div
                key={episode.id}
                className="episodeItem"
                onClick={() => handleEpisodeClick(episode.episode_number)}
                style={{ cursor: "pointer" }}
              >
                <div className="episodeNumber">{episode.episode_number}</div>
                <div className="episodePoster">
                  <Img
                    src={
                      episode.still_path
                        ? url.backdrop + episode.still_path
                        : "/placeholder-episode.jpg"
                    }
                  />
                </div>
                <div className="episodeInfo">
                  <div className="episodeTitle">
                    {episode.name || `Episode ${episode.episode_number}`}
                  </div>
                  <div className="episodeMeta">
                    <span className="airDate">
                      {formatDate(episode.air_date)}
                    </span>
                    {episode.runtime && (
                      <>
                        <span className="separator">•</span>
                        <span className="runtime">
                          {formatRuntime(episode.runtime)}
                        </span>
                      </>
                    )}
                    {episode.vote_average > 0 && (
                      <>
                        <span className="separator">•</span>
                        <span className="rating">
                          ⭐ {episode.vote_average.toFixed(1)}
                        </span>
                      </>
                    )}
                  </div>
                  {episode.overview && (
                    <div className="episodeOverview">
                      {episode.overview.length > 200
                        ? `${episode.overview.substring(0, 200)}...`
                        : episode.overview}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="episodesSkeleton">
            {skeleton()}
            {skeleton()}
            {skeleton()}
            {skeleton()}
            {skeleton()}
          </div>
        )}
      </ContentWrapper>
    </div>
  );
};

export default Episodes;
