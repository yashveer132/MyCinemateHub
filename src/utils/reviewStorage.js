const REVIEWS_STORAGE_KEY = "cinemate_reviews";

export const getAllReviews = () => {
  try {
    const reviews = localStorage.getItem(REVIEWS_STORAGE_KEY);
    return reviews ? JSON.parse(reviews) : {};
  } catch (error) {
    console.error("Error loading reviews from localStorage:", error);
    return {};
  }
};

export const getReview = (movieId) => {
  const reviews = getAllReviews();
  return reviews[movieId] || null;
};

export const saveReview = (movieId, reviewData) => {
  try {
    const reviews = getAllReviews();
    reviews[movieId] = {
      ...reviewData,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(reviews));
    return true;
  } catch (error) {
    console.error("Error saving review to localStorage:", error);
    return false;
  }
};

export const deleteReview = (movieId) => {
  try {
    const reviews = getAllReviews();
    delete reviews[movieId];
    localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(reviews));
    return true;
  } catch (error) {
    console.error("Error deleting review from localStorage:", error);
    return false;
  }
};

export const getReviewStats = () => {
  const reviews = getAllReviews();
  const reviewArray = Object.values(reviews);

  if (reviewArray.length === 0) {
    return {
      totalReviews: 0,
      averageRating: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      reviewsWithText: 0,
    };
  }

  const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let totalRating = 0;
  let reviewsWithText = 0;

  reviewArray.forEach((review) => {
    if (review.rating) {
      totalRating += review.rating;
      const roundedRating = Math.round(review.rating);
      if (roundedRating >= 1 && roundedRating <= 5) {
        ratingDistribution[roundedRating]++;
      }
    }
    if (review.reviewText && review.reviewText.trim()) {
      reviewsWithText++;
    }
  });

  return {
    totalReviews: reviewArray.length,
    averageRating: totalRating / reviewArray.length,
    ratingDistribution,
    reviewsWithText,
  };
};

export const clearAllReviews = () => {
  try {
    localStorage.removeItem(REVIEWS_STORAGE_KEY);
    return true;
  } catch (error) {
    console.error("Error clearing reviews from localStorage:", error);
    return false;
  }
};

export const exportReviews = () => {
  const reviews = getAllReviews();
  return JSON.stringify(reviews, null, 2);
};

export const importReviews = (jsonData) => {
  try {
    const reviews = JSON.parse(jsonData);
    localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(reviews));
    return true;
  } catch (error) {
    console.error("Error importing reviews:", error);
    return false;
  }
};
