import React, { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";

import useFetch from "../../../hooks/useFetch";
import ContentWrapper from "../../../components/contentWrapper/ContentWrapper";
import Img from "../../../components/lazyLoadImage/Img";
import Episodes from "../episodes/Episodes";
import "./style.scss";

const Seasons = ({ data, loading }) => {
  const { id } = useParams();
  const [selectedSeason, setSelectedSeason] = useState(null);
  const episodesRef = useRef(null);
  const { url } = useSelector((state) => state.home);

  const skeleton = () => {
    return (
      <div className="skItem">
        <div className="posterBlock skeleton"></div>
        <div className="textBlock">
          <div className="title skeleton"></div>
          <div className="date skeleton"></div>
        </div>
      </div>
    );
  };

  const handleSeasonClick = (season) => {
    const newSelectedSeason = selectedSeason?.id === season.id ? null : season;
    setSelectedSeason(newSelectedSeason);
  };

  useEffect(() => {
    if (selectedSeason && episodesRef.current) {
      const scrollToEpisodes = () => {
        if (episodesRef.current) {
          episodesRef.current.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      };

      scrollToEpisodes();

      const timeoutId = setTimeout(scrollToEpisodes, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [selectedSeason]);

  return (
    <div className="seasonsSection">
      <ContentWrapper>
        <div className="sectionHeading">Seasons</div>
        {!loading ? (
          <>
            <div className="seasonsList">
              {data?.seasons
                ?.filter((season) => season.season_number > 0)
                ?.sort((a, b) => b.season_number - a.season_number)
                ?.map((season) => (
                  <div
                    key={season.id}
                    className={`seasonItem ${
                      selectedSeason?.id === season.id ? "active" : ""
                    }`}
                    onClick={() => handleSeasonClick(season)}
                  >
                    <div className="seasonPoster">
                      <Img
                        src={
                          season.poster_path
                            ? url.poster + season.poster_path
                            : "/placeholder-season.jpg"
                        }
                      />
                    </div>
                    <div className="seasonInfo">
                      <div className="seasonName">
                        Season {season.season_number}
                      </div>
                      <div className="seasonDetails">
                        {season.episode_count} Episodes •{" "}
                        {season.air_date
                          ? new Date(season.air_date).getFullYear()
                          : "TBA"}
                      </div>
                      {season.overview && (
                        <div className="seasonOverview">
                          {season.overview.length > 150
                            ? `${season.overview.substring(0, 150)}...`
                            : season.overview}
                        </div>
                      )}
                    </div>
                    <div className="expandIcon">
                      {selectedSeason?.id === season.id ? "−" : "+"}
                    </div>
                  </div>
                ))}
            </div>

            {selectedSeason && (
              <div ref={episodesRef}>
                <Episodes
                  tvId={id}
                  seasonNumber={selectedSeason.season_number}
                  seasonData={selectedSeason}
                />
              </div>
            )}
          </>
        ) : (
          <div className="seasonsSkeleton">
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

export default Seasons;
