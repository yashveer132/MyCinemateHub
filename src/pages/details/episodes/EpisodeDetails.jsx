import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";

import useFetch from "../../../hooks/useFetch";
import ContentWrapper from "../../../components/contentWrapper/ContentWrapper";
import Img from "../../../components/lazyLoadImage/Img";
import Spinner from "../../../components/spinner/Spinner";
import VideoPopup from "../../../components/videoPopup/VideoPopup";
import "./style-details.scss";

const EpisodeDetails = () => {
  const { tvId, seasonNumber, episodeNumber } = useParams();
  const { data, loading } = useFetch(`/tv/${tvId}/season/${seasonNumber}/episode/${episodeNumber}`);
  const { data: videosData } = useFetch(`/tv/${tvId}/season/${seasonNumber}/episode/${episodeNumber}/videos`);
  const { data: imagesData } = useFetch(`/tv/${tvId}/season/${seasonNumber}/episode/${episodeNumber}/images`);
  const { data: externalIdsData } = useFetch(`/tv/${tvId}/season/${seasonNumber}/episode/${episodeNumber}/external_ids`);
  const { url } = useSelector((state) => state.home);
  const [showVideoPopup, setShowVideoPopup] = useState(false);
  const [videoId, setVideoId] = useState(null);

  const handleVideoPlay = (videoKey) => {
    setVideoId(videoKey);
    setShowVideoPopup(true);
  };

  const formatRuntime = (runtime) => {
    if (!runtime) return "";
    return `${runtime} min`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "TBA";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="episodeDetailsPage">
        <ContentWrapper>
          <Spinner />
        </ContentWrapper>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="episodeDetailsPage">
        <ContentWrapper>
          <div className="errorMessage">
            <h2>Episode not found</h2>
            <p>The requested episode could not be found.</p>
          </div>
        </ContentWrapper>
      </div>
    );
  }

  return (
    <div className="episodeDetailsPage">
      <ContentWrapper>
        <div className="episodeDetailsContent">
          <div className="episodeHeader">
            <div className="episodePoster">
              <Img
                src={
                  data.still_path
                    ? url.backdrop + data.still_path
                    : "/placeholder-episode.jpg"
                }
                alt={data.name}
              />
            </div>
            <div className="episodeInfo">
              <h1 className="episodeTitle">{data.name}</h1>
              <div className="episodeMeta">
                <span className="seasonEpisode">
                  Season {seasonNumber}, Episode {episodeNumber}
                </span>
                <span className="airDate">{formatDate(data.air_date)}</span>
                {data.runtime && (
                  <span className="runtime">{formatRuntime(data.runtime)}</span>
                )}
                {data.vote_average > 0 && (
                  <span className="rating">⭐ {data.vote_average.toFixed(1)}</span>
                )}
              </div>
              {data.overview && (
                <div className="episodeOverview">
                  <h3>Overview</h3>
                  <p>{data.overview}</p>
                </div>
              )}
            </div>
          </div>

          {data.guest_stars && data.guest_stars.length > 0 && (
            <div className="guestStarsSection">
              <h3>Guest Stars</h3>
              <div className="guestStarsList">
                {data.guest_stars.slice(0, 10).map((star) => (
                  <div key={star.id} className="guestStar">
                    <Img
                      src={
                        star.profile_path
                          ? url.profile + star.profile_path
                          : "/placeholder-person.jpg"
                      }
                      alt={star.name}
                    />
                    <div className="starInfo">
                      <span className="starName">{star.name}</span>
                      <span className="starCharacter">{star.character}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.crew && data.crew.length > 0 && (
            <div className="crewSection">
              <h3>Crew</h3>
              <div className="crewList">
                {data.crew.slice(0, 8).map((member, index) => (
                  <div key={index} className="crewMember">
                    <span className="memberName">{member.name}</span>
                    <span className="memberJob">{member.job}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {videosData?.results && videosData.results.length > 0 && (
            <div className="videosSection">
              <h3>Videos</h3>
              <div className="videosList">
                {videosData.results.slice(0, 6).map((video) => (
                  <div key={video.id} className="videoItem" onClick={() => handleVideoPlay(video.key)}>
                    <div className="videoThumbnail">
                      <Img
                        src={`https://img.youtube.com/vi/${video.key}/maxresdefault.jpg`}
                        alt={video.name}
                      />
                      <div className="playIcon">
                        <span>▶</span>
                      </div>
                    </div>
                    <div className="videoInfo">
                      <h4>{video.name}</h4>
                      <span className="videoType">{video.type}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {imagesData?.stills && imagesData.stills.length > 0 && (
            <div className="imagesSection">
              <h3>Episode Images</h3>
              <div className="imagesList">
                {imagesData.stills.slice(0, 8).map((image, index) => (
                  <div key={index} className="imageItem">
                    <Img
                      src={url.backdrop + image.file_path}
                      alt={`Episode still ${index + 1}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {externalIdsData && (
            <div className="externalIdsSection">
              <h3>External Links</h3>
              <div className="externalLinks">
                {externalIdsData.imdb_id && (
                  <a
                    href={`https://www.imdb.com/title/${externalIdsData.imdb_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="externalLink"
                  >
                    <span className="linkIcon">🎬</span>
                    <span>IMDB</span>
                  </a>
                )}
                {externalIdsData.tvdb_id && (
                  <a
                    href={`https://www.thetvdb.com/?id=${externalIdsData.tvdb_id}&tab=episode`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="externalLink"
                  >
                    <span className="linkIcon">📺</span>
                    <span>TVDB</span>
                  </a>
                )}
                {externalIdsData.tvrage_id && (
                  <a
                    href={`https://www.tvrage.com/shows/id-${externalIdsData.tvrage_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="externalLink"
                  >
                    <span className="linkIcon">📺</span>
                    <span>TVRage</span>
                  </a>
                )}
              </div>
            </div>
          )}

          {data.production_code && (
            <div className="productionInfo">
              <h3>Production Information</h3>
              <div className="productionDetails">
                <div className="detailItem">
                  <span className="label">Production Code:</span>
                  <span className="value">{data.production_code}</span>
                </div>
                {data.vote_count > 0 && (
                  <div className="detailItem">
                    <span className="label">Total Votes:</span>
                    <span className="value">{data.vote_count.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </ContentWrapper>

      <VideoPopup
        show={showVideoPopup}
        setShow={setShowVideoPopup}
        videoId={videoId}
        setVideoId={setVideoId}
      />
    </div>
  );
};

export default EpisodeDetails;
