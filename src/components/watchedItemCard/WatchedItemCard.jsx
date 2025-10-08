import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import dayjs from "dayjs";
import { FaStar, FaStarHalfAlt, FaPlus } from "react-icons/fa";

import "./style.scss";
import Img from "../lazyLoadImage/Img";
import CircleRating from "../circleRating/CircleRating";
import Genres from "../genres/Genres";
import PosterFallback from "../../assets/no-poster.png";
import ReviewModal from "../reviewModal/ReviewModal";
import { updateWatchedReview } from "../../store/userSlice";

const WatchedItemCard = ({ data, mediaType, url }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showReviewOverlay, setShowReviewOverlay] = useState(false);

  const posterUrl = data.poster_path
    ? url.poster + data.poster_path
    : PosterFallback;

  const hasReview = data.review && data.review.rating > 0;

  const handleClick = () => {
    const type = data.media_type || mediaType || "movie";
    navigate(`/${type}/${data.id}`);
  };

  const handleEditReview = () => {
    setShowReviewOverlay(false);
    setShowReviewModal(true);
  };

  const handleDeleteReview = () => {
    dispatch(updateWatchedReview({ movieId: data.id, review: null }));
    setShowReviewOverlay(false);
  };

  const handleReviewSubmit = (review) => {
    dispatch(updateWatchedReview({ movieId: data.id, review }));
    setShowReviewModal(false);
  };

  const toggleReviewOverlay = (e) => {
    e.stopPropagation();
    setShowReviewOverlay(!showReviewOverlay);
  };

  const handleAddReview = (e) => {
    e.stopPropagation();
    setShowReviewModal(true);
  };

  const getRatingLabel = (rating) => {
    if (rating <= 1) return "Poor";
    if (rating <= 2) return "Fair";
    if (rating <= 3) return "Good";
    if (rating <= 4) return "Very Good";
    return "Excellent";
  };

  return (
    <>
      <ReviewModal
        show={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        onSubmit={handleReviewSubmit}
        movieData={data}
        existingReview={hasReview ? data.review : null}
      />

      {showReviewOverlay && hasReview && (
        <div className="reviewOverlay" onClick={toggleReviewOverlay}>
          <div
            className="reviewOverlayContent"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="reviewOverlayHeader">
              <h3>{data.title || data.name}</h3>
              <button className="closeOverlayBtn" onClick={toggleReviewOverlay}>
                ×
              </button>
            </div>

            <div className="reviewOverlayBody">
              <div className="reviewRating">
                <div className="stars">
                  {[...Array(5)].map((_, index) => {
                    const starValue = index + 1;
                    const hasHalf =
                      data.review.rating >= starValue - 0.5 &&
                      data.review.rating < starValue;
                    const isFilled = starValue <= data.review.rating;

                    return hasHalf ? (
                      <FaStarHalfAlt key={index} className="half" />
                    ) : (
                      <FaStar
                        key={index}
                        className={isFilled ? "filled" : "empty"}
                      />
                    );
                  })}
                </div>
                <div className="ratingValue">
                  {data.review.rating} ★ - {getRatingLabel(data.review.rating)}
                </div>
              </div>

              {data.review.reviewText && data.review.reviewText.trim() && (
                <div className="reviewTextContent">
                  <h4>Your Review:</h4>
                  <p>{data.review.reviewText}</p>
                </div>
              )}

              <div className="reviewMeta">
                {data.review.updatedAt && (
                  <span>
                    Updated:{" "}
                    {dayjs(data.review.updatedAt).format("MMM D, YYYY")}
                  </span>
                )}
                <span>
                  Watched: {dayjs(data.watchedAt).format("MMM D, YYYY")}
                </span>
              </div>
            </div>

            <div className="reviewOverlayActions">
              <button className="editReviewBtn" onClick={handleEditReview}>
                Edit Review
              </button>
              <button className="deleteReviewBtn" onClick={handleDeleteReview}>
                Delete Review
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="watchedItemCard">
        <div className="cardContent" onClick={handleClick}>
          <div className="posterBlock">
            <Img className="posterImg" src={posterUrl} />

            {hasReview ? (
              <div className="reviewBadge" onClick={toggleReviewOverlay}>
                <FaStar />
                <span>{data.review.rating}</span>
              </div>
            ) : (
              <div className="addReviewBadge" onClick={handleAddReview}>
                <FaPlus />
                <span>Review</span>
              </div>
            )}

            <CircleRating rating={(data.vote_average || 0).toFixed(1)} />
            <Genres data={data.genre_ids?.slice(0, 2) || []} />
          </div>

          <div className="textBlock">
            <span className="title">{data.title || data.name}</span>
            <span className="date">
              Watched {dayjs(data.watchedAt).format("MMM D, YYYY")}
            </span>
          </div>
        </div>
      </div>
    </>
  );
};

export default WatchedItemCard;
