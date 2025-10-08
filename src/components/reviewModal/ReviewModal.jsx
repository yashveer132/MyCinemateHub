import React, { useState, useEffect } from "react";
import { FaStar, FaStarHalfAlt, FaTimes } from "react-icons/fa";
import "./style.scss";

const ReviewModal = ({
  show,
  onClose,
  onSubmit,
  movieData,
  existingReview,
}) => {
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [reviewText, setReviewText] = useState(
    existingReview?.reviewText || ""
  );
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (existingReview) {
      setRating(existingReview.rating || 0);
      setReviewText(existingReview.reviewText || "");
    } else {
      setRating(0);
      setReviewText("");
    }
    setErrors({});
  }, [show, existingReview]);

  const handleSubmit = (e) => {
    e.preventDefault();

    const newErrors = {};
    if (rating === 0) {
      newErrors.rating = "Please select a rating";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit({
      rating,
      reviewText: reviewText.trim(),
    });

    setRating(0);
    setReviewText("");
    setErrors({});
  };

  const handleSkip = () => {
    onSubmit({
      rating: 0,
      reviewText: "",
    });
  };

  const handleStarClick = (starValue, isHalf) => {
    const newRating = isHalf ? starValue - 0.5 : starValue;
    setRating(newRating);
  };

  const getRatingLabel = (rating) => {
    if (rating === 0) return "";
    if (rating <= 1) return "Poor";
    if (rating <= 2) return "Fair";
    if (rating <= 3) return "Good";
    if (rating <= 4) return "Very Good";
    return "Excellent";
  };

  const renderStars = () => {
    const stars = [];
    const displayRating = hoveredRating || rating;

    for (let i = 1; i <= 5; i++) {
      const isFilled = i <= displayRating;
      const isHalfFilled = i - 0.5 === displayRating;

      stars.push(
        <div key={i} className="starWrapper">
          <button
            type="button"
            className={`star ${
              isFilled ? "filled" : isHalfFilled ? "half" : ""
            }`}
            onMouseEnter={() => setHoveredRating(i)}
            onMouseLeave={() => setHoveredRating(0)}
            title={`${i} star${i > 1 ? "s" : ""}`}
          >
            <div
              className="starHalf left"
              onClick={() => handleStarClick(i, true)}
            >
              {isHalfFilled ? <FaStarHalfAlt /> : <FaStar />}
            </div>
            <div
              className="starHalf right"
              onClick={() => handleStarClick(i, false)}
            >
              <FaStar />
            </div>
          </button>
        </div>
      );
    }

    return stars;
  };

  if (!show) return null;

  return (
    <div className="reviewModalOverlay" onClick={onClose}>
      <div className="reviewModalContent" onClick={(e) => e.stopPropagation()}>
        <button className="closeBtn" onClick={onClose} title="Close">
          <FaTimes />
        </button>

        <div className="modalHeader">
          <h2>
            {existingReview && existingReview.rating > 0
              ? "Edit Your Review"
              : "Rate & Review"}
          </h2>
          <p className="movieTitle">{movieData?.title || movieData?.name}</p>
        </div>

        <form onSubmit={handleSubmit} className="reviewForm">
          <div className="formGroup">
            <label className="formLabel">
              Your Rating <span className="required">*</span>
            </label>
            <div className="starRating">{renderStars()}</div>
            {rating > 0 && (
              <div className="ratingText">
                {rating} ★ - {getRatingLabel(rating)}
              </div>
            )}
            {errors.rating && (
              <span className="errorText">{errors.rating}</span>
            )}
          </div>

          <div className="formGroup">
            <label htmlFor="reviewText" className="formLabel">
              Your Thoughts (Optional)
            </label>
            <textarea
              id="reviewText"
              className="reviewTextarea"
              placeholder="Share your thoughts about this movie/show... What did you love? What could have been better?"
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              maxLength={1000}
              rows={5}
            />
            <div className="charCount">{reviewText.length}/1000 characters</div>
          </div>

          <div className="modalActions">
            {!existingReview && (
              <button type="button" className="skipBtn" onClick={handleSkip}>
                Skip Review
              </button>
            )}
            <button type="submit" className="submitBtn">
              {existingReview ? "Update Review" : "Save Review"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewModal;
