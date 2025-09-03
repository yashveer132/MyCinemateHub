import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import dayjs from "dayjs";
import { FaRobot } from "react-icons/fa";

import "./style.scss";

import ContentWrapper from "../../../components/contentWrapper/ContentWrapper";
import useFetch from "../../../hooks/useFetch";
import Genres from "../../../components/genres/Genres";
import CircleRating from "../../../components/circleRating/CircleRating";
import Img from "../../../components/lazyLoadImage/Img.jsx";
import PosterFallback from "../../../assets/no-poster.png";
import { PlayIcon } from "../Playbtn";
import VideoPopup from "../../../components/videoPopup/VideoPopup";

const DetailsBanner = ({ video, crew, recommendationsRef }) => {
  const [show, setShow] = useState(false);
  const [videoId, setVideoId] = useState(null);

  const { mediaType, id } = useParams();
  const navigate = useNavigate();
  const { data, loading } = useFetch(`/${mediaType}/${id}`);
  const { url } = useSelector((state) => state.home);

  const _genres = data?.genres?.map((g) => g.id);

  const director = crew?.filter((f) => f.job === "Director");
  const writer = crew?.filter(
    (f) => f.job === "Screenplay" || f.job === "Story" || f.job === "Writer"
  );

  const toHoursAndMinutes = (totalMinutes) => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h${minutes > 0 ? ` ${minutes}m` : ""}`;
  };

  const scrollToRecommendations = () => {
    recommendationsRef?.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const handlePersonClick = (personId) => {
    navigate(`/person/${personId}`);
  };

  return (
    <div className="detailsBanner">
      {!loading ? (
        <>
          {!!data && (
            <React.Fragment>
              <div className="backdrop-img">
                <Img src={url.backdrop + data.backdrop_path} />
              </div>
              <div className="opacity-layer"></div>
              <ContentWrapper>
                <div className="content">
                  <div className="left">
                    {data.poster_path ? (
                      <Img
                        className="posterImg"
                        src={url.backdrop + data.poster_path}
                      />
                    ) : (
                      <Img className="posterImg" src={PosterFallback} />
                    )}
                  </div>
                  <div className="right">
                    <div className="title">
                      {`${data.name || data.title} (${dayjs(
                        data?.first_air_date || data?.release_date
                      ).format("YYYY")})`}
                    </div>
                    <div className="subtitle">{data.tagline}</div>

                    <Genres data={_genres} />

                    <div className="row">
                      <CircleRating
                        rating={
                          data.vote_average
                            ? data.vote_average.toFixed(1)
                            : "0.0"
                        }
                      />
                      <div
                        className="playbtn"
                        onClick={() => {
                          setShow(true);
                          setVideoId(video.key);
                        }}
                      >
                        <PlayIcon />
                        <span className="text">Watch Trailer</span>
                      </div>
                      <div
                        className="aiRecommendBtn"
                        onClick={scrollToRecommendations}
                      >
                        <FaRobot />
                        <span>AI Recommendations</span>
                      </div>
                    </div>

                    <div className="overview">
                      <div className="heading">Overview</div>
                      <div className="description">{data.overview}</div>
                    </div>

                    <div className="info">
                      {data.status && (
                        <div className="infoItem">
                          <span className="text bold">Status: </span>
                          <span className="text">{data.status}</span>
                        </div>
                      )}
                      {data.release_date && mediaType === "movie" && (
                        <div className="infoItem">
                          <span className="text bold">Release Date: </span>
                          <span className="text">
                            {dayjs(data.release_date).format("MMM D, YYYY")}
                          </span>
                        </div>
                      )}
                      {data.first_air_date && mediaType === "tv" && (
                        <div className="infoItem">
                          <span className="text bold">First Air Date: </span>
                          <span className="text">
                            {dayjs(data.first_air_date).format("MMM D, YYYY")}
                          </span>
                        </div>
                      )}
                      {data.runtime && mediaType === "movie" && (
                        <div className="infoItem">
                          <span className="text bold">Runtime: </span>
                          <span className="text">
                            {toHoursAndMinutes(data.runtime)}
                          </span>
                        </div>
                      )}
                      {data.episode_run_time &&
                        mediaType === "tv" &&
                        data.episode_run_time.length > 0 && (
                          <div className="infoItem">
                            <span className="text bold">Episode Runtime: </span>
                            <span className="text">
                              {toHoursAndMinutes(data.episode_run_time[0])}
                            </span>
                          </div>
                        )}
                      {data.number_of_seasons && mediaType === "tv" && (
                        <div className="infoItem">
                          <span className="text bold">Seasons: </span>
                          <span className="text">{data.number_of_seasons}</span>
                        </div>
                      )}
                      {data.number_of_episodes && mediaType === "tv" && (
                        <div className="infoItem">
                          <span className="text bold">Episodes: </span>
                          <span className="text">
                            {data.number_of_episodes}
                          </span>
                        </div>
                      )}
                    </div>

                    {mediaType === "movie" && director?.length > 0 && (
                      <div className="info">
                        <span className="text bold">Director: </span>
                        <span className="text">
                          {director?.map((d, i) => (
                            <span
                              key={i}
                              className="personLink"
                              onClick={() => handlePersonClick(d.id)}
                            >
                              {d.name}
                              {director.length - 1 !== i && ", "}
                            </span>
                          ))}
                        </span>
                      </div>
                    )}

                    {mediaType === "movie" && writer?.length > 0 && (
                      <div className="info">
                        <span className="text bold">Writer: </span>
                        <span className="text">
                          {writer?.map((d, i) => (
                            <span
                              key={i}
                              className="personLink"
                              onClick={() => handlePersonClick(d.id)}
                            >
                              {d.name}
                              {writer.length - 1 !== i && ", "}
                            </span>
                          ))}
                        </span>
                      </div>
                    )}

                    {mediaType === "tv" && data?.created_by?.length > 0 && (
                      <div className="info">
                        <span className="text bold">Created by: </span>
                        <span className="text">
                          {data?.created_by?.map((d, i) => (
                            <span
                              key={i}
                              className="personLink"
                              onClick={() => handlePersonClick(d.id)}
                            >
                              {d.name}
                              {data?.created_by.length - 1 !== i && ", "}
                            </span>
                          ))}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <VideoPopup
                  show={show}
                  setShow={setShow}
                  videoId={videoId}
                  setVideoId={setVideoId}
                  movieData={data}
                />
              </ContentWrapper>
            </React.Fragment>
          )}
        </>
      ) : (
        <div className="detailsBannerSkeleton">
          <ContentWrapper>
            <div className="left skeleton"></div>
            <div className="right">
              <div className="row skeleton"></div>
              <div className="row skeleton"></div>
              <div className="row skeleton"></div>
              <div className="row skeleton"></div>
              <div className="row skeleton"></div>
              <div className="row skeleton"></div>
              <div className="row skeleton"></div>
            </div>
          </ContentWrapper>
        </div>
      )}
    </div>
  );
};

export default DetailsBanner;
