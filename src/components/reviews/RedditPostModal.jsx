import React, { useState, useEffect } from "react";
import { marked } from "marked";
import { getPostDetails } from "../../utils/reddit";
import "./RedditPostModal.scss";

const RedditPostModal = ({ post, onClose }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedComments, setExpandedComments] = useState(new Set());

  useEffect(() => {
    if (post) {
      fetchPostDetails();
    }
  }, [post]);

  const fetchPostDetails = async () => {
    setLoading(true);
    try {
      const result = await getPostDetails(post.subreddit, post.id);
      if (result.comments) {
        setComments(result.comments);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderRedditContent = (content, contentHtml) => {
    if (contentHtml) {
      const plainText = contentHtml
        .replace(/<[^>]*>/g, "")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, " ")
        .trim();

      return plainText.replace(/\n/g, "<br>");
    } else if (content) {
      try {
        return marked(content, {
          breaks: true,
          gfm: true,
        });
      } catch (error) {
        return content.replace(/\n/g, "<br>");
      }
    }
    return "";
  };

  const toggleComment = (commentId) => {
    const newExpanded = new Set(expandedComments);
    if (newExpanded.has(commentId)) {
      newExpanded.delete(commentId);
    } else {
      newExpanded.add(commentId);
    }
    setExpandedComments(newExpanded);
  };

  const renderComment = (comment, depth = 0) => {
    const isExpanded = expandedComments.has(comment.id);
    const hasReplies = comment.replies && comment.replies.length > 0;

    return (
      <div
        key={comment.id}
        className={`comment ${depth > 0 ? "nested" : ""}`}
        style={{ marginLeft: `${depth * 20}px` }}
      >
        <div className="comment-header">
          <span className="comment-author">u/{comment.author}</span>
          <span className="comment-score">⬆️ {comment.score}</span>
          <span className="comment-date">
            {formatDate(comment.created_utc)}
          </span>
        </div>
        <div
          className="comment-body"
          dangerouslySetInnerHTML={{
            __html: renderRedditContent(comment.body, comment.body_html),
          }}
        />
        {hasReplies && (
          <button
            className="toggle-replies"
            onClick={() => toggleComment(comment.id)}
          >
            {isExpanded ? "▼" : "▶"} {comment.replies.length}{" "}
            {comment.replies.length === 1 ? "reply" : "replies"}
          </button>
        )}
        {isExpanded && hasReplies && (
          <div className="comment-replies">
            {comment.replies.map((reply) => renderComment(reply, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="reddit-modal-overlay" onClick={onClose}>
        <div className="reddit-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2 style={{ textAlign: "center", flex: 1, margin: 0 }}>
              Loading Reddit Post...
            </h2>
            <button className="close-button" onClick={onClose}>
              ×
            </button>
          </div>
          <div className="modal-body">
            <div className="loading-spinner">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="reddit-modal-overlay" onClick={onClose}>
        <div className="reddit-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2 style={{ textAlign: "center", flex: 1, margin: 0 }}>Error</h2>
            <button className="close-button" onClick={onClose}>
              ×
            </button>
          </div>
          <div className="modal-body">
            <p
              style={{
                textAlign: "center",
                color: "#666",
                padding: "40px 20px",
              }}
            >
              Failed to load Reddit post: {error}
            </p>
            <button onClick={fetchPostDetails} className="retry-button">
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return null;
  }

  return (
    <div className="reddit-modal-overlay" onClick={onClose}>
      <div className="reddit-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="post-info">
            <span className="subreddit">r/{post.subreddit}</span>
            <span className="author">u/{post.author}</span>
            <span className="date">{formatDate(post.created_utc)}</span>
          </div>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          <div className="post-content">
            <h1 className="post-title">{post.title}</h1>

            <div className="post-meta">
              <span className="score">⬆️ {post.score} points</span>
              <span className="comments-count">
                💬 {post.num_comments} comments
              </span>
              <span className="upvote-ratio">
                📊 {Math.round(post.upvote_ratio * 100)}% upvoted
              </span>
            </div>

            {post.selftext && (
              <div
                className="post-text"
                dangerouslySetInnerHTML={{
                  __html: renderRedditContent(
                    post.selftext,
                    post.selftext_html
                  ),
                }}
              />
            )}

            {post.url && !post.is_self && (
              <div className="post-link">
                <a href={post.url} target="_blank" rel="noopener noreferrer">
                  🔗 {post.url}
                </a>
              </div>
            )}

            <div className="post-actions">
              <a
                href={`https://reddit.com${post.permalink}`}
                target="_blank"
                rel="noopener noreferrer"
                className="reddit-link"
              >
                View on Reddit ↗️
              </a>
            </div>
          </div>

          <div className="comments-section">
            <h3>Comments ({comments.length})</h3>
            {comments.length > 0 ? (
              <div className="comments-list">
                {comments.map((comment) => renderComment(comment))}
              </div>
            ) : (
              <p className="no-comments">No comments yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RedditPostModal;
