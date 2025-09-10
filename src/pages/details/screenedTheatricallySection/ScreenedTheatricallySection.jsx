import React from "react";
import dayjs from "dayjs";
import useFetch from "../../../hooks/useFetch";
import ContentWrapper from "../../../components/contentWrapper/ContentWrapper";
import "./style.scss";

const ScreenedTheatricallySection = ({ id }) => {
  const { data, loading } = useFetch(`/tv/${id}/screened_theatrically`);

  const skeleton = () => {
    return (
      <div className="skItem">
        <div className="episodeInfo">
          <div className="episodeNumber skeleton"></div>
          <div className="episodeTitle skeleton"></div>
          <div className="screeningDate skeleton"></div>
        </div>
      </div>
    );
  };

  if (!data?.results?.length && !loading) {
    return (
      <div className="screenedTheatricallySection">
        <ContentWrapper>
          <div className="sectionHeading">Theatrical Screenings</div>
          <div className="noData">
            <p>
              No theatrical screening information available for this TV show.
            </p>
          </div>
        </ContentWrapper>
      </div>
    );
  }

  return (
    <div className="screenedTheatricallySection">
      <ContentWrapper>
        <div className="sectionHeading">
          Theatrical Screenings ({data?.results?.length || 0})
        </div>
        {!loading ? (
          <div className="screeningsList">
            {data?.results
              ?.sort(
                (a, b) =>
                  new Date(a.first_air_date) - new Date(b.first_air_date)
              )
              ?.map((episode) => (
                <div key={episode.id} className="screeningItem">
                  <div className="episodePoster">
                    {episode.still_path ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w300${episode.still_path}`}
                        alt={episode.name}
                      />
                    ) : (
                      <div className="noPoster">
                        <span>No Image</span>
                      </div>
                    )}
                  </div>
                  <div className="episodeInfo">
                    <div className="episodeNumber">
                      Season {episode.season_number}, Episode{" "}
                      {episode.episode_number}
                    </div>
                    <div className="episodeTitle">{episode.name}</div>
                    <div className="screeningDate">
                      Screened:{" "}
                      {dayjs(episode.first_air_date).format("MMMM D, YYYY")}
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
          <div className="screeningsSkeleton">
            {skeleton()}
            {skeleton()}
            {skeleton()}
          </div>
        )}
      </ContentWrapper>
    </div>
  );
};

export default ScreenedTheatricallySection;
