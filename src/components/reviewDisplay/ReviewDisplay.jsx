import React, { useState } from "react";
import {
  FaStar,
  FaStarHalfAlt,
  FaEdit,
  FaTrash,
  FaTimes,
} from "react-icons/fa";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "./style.scss";

dayjs.extend(relativeTime);

const ReviewDisplay = ({ review, movieData, onEdit, onDelete }) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  if (!review || !review.rating) {
    return null;
  }

  const handleDelete = () => {
    onDelete(movieData.id);
    setShowDeleteConfirm(false);
  };

  const renderStars = () => {
    return (
      <div className="reviewStars">
        {[1, 2, 3, 4, 5].map((starValue) => {
          const hasHalf =
            review.rating >= starValue - 0.5 && review.rating < starValue;
          const isFilled = starValue <= review.rating;

          return hasHalf ? (
            <FaStarHalfAlt key={starValue} className="half" />
          ) : (
            <FaStar key={starValue} className={isFilled ? "filled" : "empty"} />
          );
        })}
      </div>
    );
  };

  const getRatingLabel = (rating) => {
    if (rating <= 1) return "Poor";
    if (rating <= 2) return "Fair";
    if (rating <= 3) return "Good";
    if (rating <= 4) return "Very Good";
    return "Excellent";
  };

  const needsExpansion = review.reviewText && review.reviewText.length > 200;

  return (
    <div className="reviewDisplayContainer">
      <div className="reviewHeader">
        <div className="ratingSection">
          {renderStars()}
          <span className="ratingLabel">{getRatingLabel(review.rating)}</span>
        </div>
        <div className="reviewActions">
          <button
            className="actionBtn editBtn"
            onClick={() => onEdit(movieData)}
            title="Edit Review"
          >
            <FaEdit />
          </button>
          <button
            className="actionBtn deleteBtn"
            onClick={() => setShowDeleteConfirm(true)}
            title="Delete Review"
          >
            <FaTrash />
          </button>
        </div>
      </div>

      {review.reviewText && review.reviewText.trim() && (
        <div className="reviewTextSection">
          <p className={`reviewText ${isExpanded ? "expanded" : ""}`}>
            {review.reviewText}
          </p>
          {needsExpansion && (
            <button
              className="expandBtn"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? "Show Less" : "Read More"}
            </button>
          )}
        </div>
      )}

      <div className="reviewMeta">
        <span className="reviewDate">
          {review.updatedAt
            ? `Updated ${dayjs(review.updatedAt).fromNow()}`
            : review.reviewedAt
            ? `Reviewed ${dayjs(review.reviewedAt).fromNow()}`
            : ""}
        </span>
      </div>

      {showDeleteConfirm && (
        <div
          className="deleteConfirmOverlay"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="deleteConfirmDialog"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="closeDialogBtn"
              onClick={() => setShowDeleteConfirm(false)}
            >
              <FaTimes />
            </button>
            <h3>Delete Review?</h3>
            <p>
              Are you sure you want to delete your review for "
              {movieData?.title || movieData?.name}"?
            </p>
            <div className="dialogActions">
              <button
                className="cancelBtn"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button className="confirmDeleteBtn" onClick={handleDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewDisplay;
