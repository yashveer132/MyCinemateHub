import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import dayjs from "dayjs";

import "./style.scss";

import ContentWrapper from "../../../components/contentWrapper/ContentWrapper";
import useFetch from "../../../hooks/useFetch";
import Genres from "../../../components/genres/Genres";
import CircleRating from "../../../components/circleRating/CircleRating";
import { fetchImdbRating } from "../../../utils/api";
import AdditionalRatings from "../../../components/additionalRatings/AdditionalRatings";
import Img from "../../../components/lazyLoadImage/Img.jsx";
import PosterFallback from "../../../assets/no-poster.png";
import { PlayIcon } from "../Playbtn";
import VideoPopup from "../../../components/videoPopup/VideoPopup";
import { generateGoogleCalendarLink } from "../../../utils/calendar";

const DetailsBanner = ({ video, crew }) => {
  const [show, setShow] = useState(false);
  const [videoId, setVideoId] = useState(null);
  const [imdbData, setImdbData] = useState(null);

  const { mediaType, id } = useParams();

  useEffect(() => {
    let isMounted = true;
    const loadImdb = async () => {
      if (id) {
        setImdbData(null);
        try {
          const res = await fetchImdbRating(id, mediaType);
          if (isMounted) {
            setImdbData(res);
          }
        } catch (error) {
          console.error("Failed to load IMDb rating:", error);
          if (isMounted) {
            setImdbData({ rating: null });
          }
        }
      }
    };
    loadImdb();
    return () => {
      isMounted = false;
    };
  }, [id, mediaType]);
  const navigate = useNavigate();
  const { data, loading } = useFetch(`/${mediaType}/${id}`);
  const { url } = useSelector((state) => state.home);

  const releaseDate = data?.release_date || data?.first_air_date;
  const isComingSoon = releaseDate
    ? dayjs(releaseDate).isAfter(dayjs())
    : false;

  const _genres = data?.genres?.map((g) => g.id);

  const director = crew?.filter((f) => f.job === "Director");
  const writer = crew?.filter(
    (f) => f.job === "Screenplay" || f.job === "Story" || f.job === "Writer",
  );

  const toHoursAndMinutes = (totalMinutes) => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h${minutes > 0 ? ` ${minutes}m` : ""}`;
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
                        data?.first_air_date || data?.release_date,
                      ).format("YYYY")})`}
                    </div>
                    <div className="subtitle">{data.tagline}</div>

                    <Genres data={_genres} />

                    <div className="row">
                      {!isComingSoon && (
                        <>
                          <div className="ratingsSection">
                            <CircleRating
                              rating={
                                data.vote_average
                                  ? data.vote_average.toFixed(1)
                                  : "0.0"
                              }
                              voteCount={data.vote_count}
                              showTooltip={false}
                            />
                            <div className="ratingInfo">
                              <div className="ratingLabel">TMDB</div>
                              <div className="voteCount">
                                {data.vote_count?.toLocaleString() || "0"} votes
                              </div>
                            </div>
                          </div>

                          {imdbData?.rating && imdbData.rating !== "N/A" && (
                            <div className="ratingsSection">
                              <div className="imdbRating">
                                <span className="ratingText">
                                  {imdbData.rating}
                                </span>
                              </div>
                              <div className="ratingInfo">
                                <div className="ratingLabel">IMDb</div>
                                <div className="voteCount">
                                  {imdbData.votes
                                    ? `${imdbData.votes} votes`
                                    : "N/A votes"}
                                </div>
                              </div>
                            </div>
                          )}

                          {imdbData?.additionalRatings && (
                            <AdditionalRatings
                              ratings={imdbData.additionalRatings}
                              showTooltip={false}
                            />
                          )}
                        </>
                      )}

                      {isComingSoon && (
                        <button
                          type="button"
                          className="calendarSyncBtn"
                          onClick={() => {
                            const dateStr =
                              data.release_date || data.first_air_date;
                            const titleStr =
                              mediaType === "movie"
                                ? `🎬 Premiere: ${data.title}`
                                : `📺 Premiere: ${data.name}`;
                            const description =
                              `${data.title || data.name} Premiere!\n\n` +
                              `• Release Date: ${dayjs(dateStr).format("MMMM D, YYYY")}\n` +
                              `• Overview: ${data.overview || "No overview available."}\n\n` +
                              `Synced via Cinemate. Mark your calendar! 🍿`;

                            const link = generateGoogleCalendarLink({
                              title: titleStr,
                              description,
                              location: window.location.href,
                              startDate: dateStr,
                              allDay: true,
                            });

                            if (link) window.open(link, "_blank");
                          }}
                        >
                          📅 Add Premiere to Calendar
                        </button>
                      )}

                      {video?.key && (
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
                      )}
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
