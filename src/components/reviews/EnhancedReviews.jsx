import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import ContentWrapper from "../contentWrapper/ContentWrapper";
import Img from "../lazyLoadImage/Img";
import avatar from "../../assets/avatar.png";
import { searchRelatedPosts } from "../../utils/reddit";
import RedditPostModal from "./RedditPostModal";
import { generateAIReview } from "../../utils/gemini";
import "./style.scss";

const Reviews = ({ data, mediaType, mediaId, mediaTitle, overview }) => {
  const [expanded, setExpanded] = useState(false);
  const [redditReviews, setRedditReviews] = useState([]);
  const [redditLoading, setRedditLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("tmdb");
  const [selectedRedditPost, setSelectedRedditPost] = useState(null);
  const [aiReview, setAiReview] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  const { url } = useSelector((state) => state.home);

  const openRedditModal = (post) => {
    setSelectedRedditPost(post);
  };

  const closeRedditModal = () => {
    setSelectedRedditPost(null);
  };

  useEffect(() => {
    if (mediaTitle) {
      fetchRedditReviews();
    }
  }, [mediaTitle]);

  useEffect(() => {
    if (!mediaTitle) return;
    const gen = async () => {
      setAiLoading(true);
      setAiError(null);
      try {
        const tmdbReviews = data?.results || [];
        const result = await generateAIReview(
          mediaTitle,
          overview || "",
          tmdbReviews,
          redditReviews
        );
        setAiReview(result);
      } catch (e) {
        setAiError("Failed to generate AI review.");
      } finally {
        setAiLoading(false);
      }
    };
    gen();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaTitle, overview, redditReviews, data]);

  const fetchRedditReviews = async () => {
    setRedditLoading(true);
    try {
      const result = await searchRelatedPosts(mediaTitle, mediaType);
      if (result.posts) {
        setRedditReviews(result.posts);
      }
    } catch (error) {
      console.error("Error fetching Reddit reviews:", error);
    }
    setRedditLoading(false);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getReviewTypeLabel = (type) => {
    const labels = {
      spoiler: "⚠️ Spoiler Review",
      first_impression: "👀 First Impression",
      final_thoughts: "💭 Final Thoughts",
      episode_review: "📺 Episode Review",
      season_review: "📅 Season Review",
      general: "💬 Review",
    };
    return labels[type] || "💬 Review";
  };

  const tmdbReviews = data?.results || [];
  const displayTmdbReviews = expanded ? tmdbReviews : tmdbReviews.slice(0, 2);
  const displayRedditReviews = expanded
    ? redditReviews
    : redditReviews.slice(0, 3);

  const totalReviews = tmdbReviews.length + redditReviews.length;

  return (
    <div className="reviews">
      <ContentWrapper>
        <div className="sectionHeading">Reviews ({totalReviews})</div>

        <div className="reviewTabs">
          <button
            className={`tabButton ${activeTab === "tmdb" ? "active" : ""}`}
            onClick={() => setActiveTab("tmdb")}
          >
            TMDB Reviews ({tmdbReviews.length})
          </button>
          <button
            className={`tabButton ${activeTab === "reddit" ? "active" : ""}`}
            onClick={() => setActiveTab("reddit")}
          >
            Reddit Reviews ({redditReviews.length})
            {redditLoading && <span className="loading">...</span>}
          </button>
          <button
            className={`tabButton ${activeTab === "ai" ? "active" : ""}`}
            onClick={() => setActiveTab("ai")}
          >
            AI Review {aiLoading && <span className="loading">...</span>}
          </button>
        </div>

        {activeTab === "tmdb" && (
          <div className="reviewsList">
            {displayTmdbReviews.length > 0 ? (
              displayTmdbReviews.map((review) => (
                <div key={review.id} className="reviewItem tmdbReview">
                  <div className="reviewHeader">
                    <div className="avatar">
                      <Img
                        src={
                          review.author_details.avatar_path
                            ? url.profile + review.author_details.avatar_path
                            : avatar
                        }
                      />
                    </div>
                    <div className="info">
                      <div className="name">{review.author}</div>
                      <div className="meta">
                        {review.author_details.rating && (
                          <span className="rating">
                            ⭐ {review.author_details.rating}/10
                          </span>
                        )}
                        <span className="source">TMDB</span>
                      </div>
                    </div>
                  </div>
                  <div className="content">{review.content}</div>
                  {review.created_at && (
                    <div className="reviewDate">
                      {formatDate(new Date(review.created_at).getTime() / 1000)}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="noReviews">
                <p>No TMDB reviews available for this {mediaType}.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "reddit" && (
          <div className="reviewsList">
            {redditLoading ? (
              <div className="loadingReviews">
                <p>Fetching Reddit reviews...</p>
              </div>
            ) : displayRedditReviews.length > 0 ? (
              displayRedditReviews.map((review) => (
                <div
                  key={review.id}
                  className="reviewItem redditReview clickable"
                  onClick={() => openRedditModal(review)}
                >
                  <div className="reviewHeader">
                    <div className="avatar redditAvatar">
                      <span className="redditIcon">🟠</span>
                    </div>
                    <div className="info">
                      <div className="name">
                        u/{review.author}
                        <span className="subreddit">r/{review.subreddit}</span>
                      </div>
                      <div className="meta">
                        <span className="score">⬆️ {review.score}</span>
                        <span className="comments">
                          💬 {review.num_comments}
                        </span>
                        <span className="reviewType">
                          {getReviewTypeLabel(review.reviewType)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="content">
                    <h4 className="redditTitle">{review.title}</h4>
                    {review.selftext && (
                      <div className="redditText">
                        {review.selftext.length > 300
                          ? `${review.selftext.substring(0, 300)}...`
                          : review.selftext}
                      </div>
                    )}
                  </div>
                  <div className="reviewFooter">
                    <span className="reviewDate">
                      {formatDate(review.created_utc)}
                    </span>
                    <a
                      href={`https://reddit.com${review.permalink}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="redditLink"
                    >
                      View on Reddit ↗️
                    </a>
                  </div>
                </div>
              ))
            ) : (
              <div className="noReviews">
                <p>No relevant Reddit reviews found for "{mediaTitle}".</p>
                <p className="noReviewsHint">
                  We only show posts that are specifically about this{" "}
                  {mediaType} to ensure quality and relevance.
                </p>
                <button onClick={fetchRedditReviews} className="retryButton">
                  🔄 Try Again
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === "ai" && (
          <div className="reviewsList">
            {aiLoading ? (
              <div className="loadingReviews">
                <p>Generating AI review...</p>
              </div>
            ) : aiError ? (
              <div className="noReviews">
                <p>{aiError}</p>
                <button
                  onClick={() => setActiveTab("tmdb")}
                  className="retryButton"
                >
                  View TMDB Reviews
                </button>
              </div>
            ) : aiReview ? (
              <div className="reviewItem aiReview">
                <div className="reviewHeader">
                  <div className="info">
                    <div className="meta">
                      <span className="source">AI</span>
                      {aiReview?.score && (
                        <span className="rating">⭐ {aiReview.score}/10</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="content">
                  {aiReview.headline && (
                    <h4 className="redditTitle">{aiReview.headline}</h4>
                  )}
                  <div className="redditText">{aiReview.summary}</div>
                  {(aiReview.highlights?.length || 0) > 0 && (
                    <div style={{ marginTop: 12 }}>
                      <strong>Highlights:</strong>
                      <ul style={{ textAlign: "left", marginTop: 8 }}>
                        {aiReview.highlights.map((h, idx) => (
                          <li key={idx}>{h}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {(aiReview.lowlights?.length || 0) > 0 && (
                    <div style={{ marginTop: 12 }}>
                      <strong>Considerations:</strong>
                      <ul style={{ textAlign: "left", marginTop: 8 }}>
                        {aiReview.lowlights.map((h, idx) => (
                          <li key={idx}>{h}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                {aiReview.verdict && (
                  <div className="reviewFooter">
                    <span className="reviewDate">{aiReview.verdict}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="noReviews">
                <p>No AI review available right now.</p>
                <button
                  onClick={() => setActiveTab("tmdb")}
                  className="retryButton"
                >
                  View TMDB Reviews
                </button>
              </div>
            )}
          </div>
        )}

        {((activeTab === "tmdb" && tmdbReviews.length > 2) ||
          (activeTab === "reddit" && redditReviews.length > 3)) && (
          <div className="showMore">
            <button onClick={() => setExpanded(!expanded)}>
              {expanded ? "Show Less" : "Show More"}
            </button>
          </div>
        )}
      </ContentWrapper>

      {selectedRedditPost && (
        <RedditPostModal post={selectedRedditPost} onClose={closeRedditModal} />
      )}
    </div>
  );
};

export default Reviews;
