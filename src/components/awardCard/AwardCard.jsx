import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  FaHeart,
  FaRegHeart,
  FaBookmark,
  FaRegBookmark,
  FaCheck,
  FaUndo,
  FaStar,
  FaTrophy,
} from "react-icons/fa";

import "./awardCard.scss";
import Img from "../lazyLoadImage/Img";
import CircleRating from "../circleRating/CircleRating";
import Genres from "../genres/Genres";
import PosterFallback from "../../assets/no-poster.png";
import ReviewModal from "../reviewModal/ReviewModal";
import {
  addToFavorites,
  removeFromFavorites,
  addToWatchLater,
  removeFromWatchLater,
  addToWatched,
  removeFromWatched,
  moveToWatchLater,
} from "../../store/userSlice";
import { fetchAwardsData } from "../../utils/awardsCache";

const AwardCard = ({
  data,
  fromSearch,
  mediaType,
  showWatchedDate,
  onCardClick,
}) => {
  const { url } = useSelector((state) => state.home);
  const { favorites, watchLater, watched } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showActions, setShowActions] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showAwards, setShowAwards] = useState(false);
  const [awardsData, setAwardsData] = useState(null);
  const [isLoadingAwards, setIsLoadingAwards] = useState(false);

  const posterUrl = data.poster_path
    ? url.poster + data.poster_path
    : PosterFallback;

  const movieData = {
    id: data.id,
    title: data.title || data.name,
    poster_path: data.poster_path,
    release_date: data.release_date || data.first_air_date,
    vote_average: data.vote_average,
    genre_ids: data.genre_ids,
    media_type: data.media_type || mediaType || "movie",
  };

  const isFavorite = favorites.some((item) => item.id === data.id);
  const isInWatchLater = watchLater.some((item) => item.id === data.id);
  const isWatched = watched.some((item) => item.id === data.id);
  const watchedItem = watched.find((item) => item.id === data.id);
  const hasReview = watchedItem?.review && watchedItem.review.rating > 0;

  const handleClick = () => {
    if (typeof onCardClick === "function") {
      onCardClick(data);
      return;
    }
    const type = data.media_type || mediaType || "movie";
    navigate(`/${type}/${data.id}`);
  };

  const handleActionClick = (e, action) => {
    e.stopPropagation();
    action();
  };

  const toggleFavorite = () => {
    if (isFavorite) {
      dispatch(removeFromFavorites(data.id));
    } else {
      dispatch(addToFavorites(movieData));
    }
  };

  const toggleWatchLater = () => {
    if (isInWatchLater) {
      dispatch(removeFromWatchLater(data.id));
    } else {
      dispatch(addToWatchLater(movieData));
    }
  };

  const toggleWatched = () => {
    if (isWatched) {
      dispatch(removeFromWatched(data.id));
    } else {
      setShowReviewModal(true);
    }
  };

  const handleReviewSubmit = (review) => {
    dispatch(addToWatched({ movie: movieData, review }));
    setShowReviewModal(false);
  };

  const handleReviewClose = () => {
    setShowReviewModal(false);
  };

  const moveToWatchLaterAction = () => {
    dispatch(moveToWatchLater(movieData));
  };

  const handleMouseEnter = async () => {
    setShowActions(true);
    setShowAwards(true);

    if (!awardsData && !isLoadingAwards) {
      setIsLoadingAwards(true);
      const awards = await fetchAwardsData(data);
      setAwardsData(awards);
      setIsLoadingAwards(false);
    }
  };

  const handleMouseLeave = () => {
    setShowActions(false);
    setShowAwards(false);
  };

  return (
    <>
      <ReviewModal
        show={showReviewModal}
        onClose={handleReviewClose}
        onSubmit={handleReviewSubmit}
        movieData={movieData}
      />
      <div
        className="awardCard"
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="posterBlock">
          <Img className="posterImg" src={posterUrl} />

          {hasReview && (
            <div className="reviewBadge">
              <FaStar />
              <span>{watchedItem.review.rating}</span>
            </div>
          )}

          <div className={`actionButtons ${showActions ? "show" : ""}`}>
            <button
              className={`actionBtn favoriteBtn ${isFavorite ? "active" : ""}`}
              onClick={(e) => handleActionClick(e, toggleFavorite)}
              title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
            >
              {isFavorite ? <FaHeart /> : <FaRegHeart />}
            </button>

            <button
              className={`actionBtn watchLaterBtn ${
                isInWatchLater ? "active" : ""
              }`}
              onClick={(e) => handleActionClick(e, toggleWatchLater)}
              title={
                isInWatchLater
                  ? "Remove from Watch Later"
                  : "Add to Watch Later"
              }
            >
              {isInWatchLater ? <FaBookmark /> : <FaRegBookmark />}
            </button>

            <button
              className={`actionBtn watchedBtn ${isWatched ? "active" : ""}`}
              onClick={(e) =>
                handleActionClick(
                  e,
                  isWatched ? moveToWatchLaterAction : toggleWatched
                )
              }
              title={isWatched ? "Move to Watch Later" : "Mark as Watched"}
            >
              {isWatched ? <FaUndo /> : <FaCheck />}
            </button>
          </div>

          {showAwards && (
            <div className="awardsOverlay">
              {isLoadingAwards && (
                <div className="awardsLoading">
                  <div className="spinner"></div>
                  <span>Loading awards...</span>
                </div>
              )}

              {!isLoadingAwards &&
                awardsData &&
                awardsData.awards &&
                awardsData.awards.length > 0 && (
                  <div className="awardsContent">
                    <div className="awardsHeader">
                      <FaTrophy className="trophyIcon" />
                      <h3>Awards Won</h3>
                    </div>
                    <div className="awardsList">
                      {awardsData.awards.slice(0, 4).map((award) => (
                        <div key={award.id} className="awardItem">
                          <div className="awardIcon">🏆</div>
                          <div className="awardDetails">
                            <div className="awardName">{award.award}</div>
                            <div className="awardCategory">
                              {award.category} {award.year && `(${award.year})`}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {awardsData.awards.length > 4 && (
                      <div className="moreAwards">
                        +{awardsData.awards.length - 4} more awards
                      </div>
                    )}
                    {awardsData.summary && (
                      <div className="awardsSummary">{awardsData.summary}</div>
                    )}
                  </div>
                )}

              {!isLoadingAwards &&
                (!awardsData ||
                  !awardsData.awards ||
                  awardsData.awards.length === 0) && (
                  <div className="noAwards">
                    <FaTrophy className="noAwardsIcon" />
                    <span>No major awards won</span>
                  </div>
                )}
            </div>
          )}

          {!fromSearch && (
            <React.Fragment>
              <CircleRating rating={(data.vote_average || 0).toFixed(1)} />
              <Genres data={data.genre_ids?.slice(0, 2) || []} />
            </React.Fragment>
          )}
        </div>
        <div className="textBlock">
          <span className="title">{data.title || data.name}</span>
          <span className="date">
            {showWatchedDate && data.watchedAt
              ? `Watched ${dayjs(data.watchedAt).format("MMM D, YYYY")}`
              : dayjs(data.release_date || data.first_air_date).format(
                  "MMM D, YYYY"
                )}
          </span>
        </div>
      </div>
    </>
  );
};

export default AwardCard;
