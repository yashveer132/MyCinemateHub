import axios from "axios";

const REDDIT_CLIENT_ID = import.meta.env.VITE_REDDIT_CLIENT_ID;
const REDDIT_CLIENT_SECRET = import.meta.env.VITE_REDDIT_CLIENT_SECRET;

const REDDIT_API_BASE = "https://www.reddit.com";
const REDDIT_OAUTH_BASE = "https://oauth.reddit.com";

const getRedditAccessToken = async () => {
  try {
    const auth = btoa(`${REDDIT_CLIENT_ID}:${REDDIT_CLIENT_SECRET}`);

    const response = await axios.post(
      "https://www.reddit.com/api/v1/access_token",
      "grant_type=client_credentials",
      {
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    return response.data.access_token;
  } catch (error) {
    console.error("Error getting Reddit access token:", error);
    return null;
  }
};

export const searchMovieSubreddits = async (query) => {
  try {
    const response = await axios.get(
      `${REDDIT_API_BASE}/subreddits/search.json`,
      {
        params: {
          q: query,
          type: "sr",
          limit: 10,
        },
      }
    );

    return response.data.data.children
      .filter((sub) => sub.data.subscribers > 100)
      .map((sub) => ({
        id: sub.data.id,
        name: sub.data.display_name,
        displayName: sub.data.display_name_prefixed,
        subscribers: sub.data.subscribers,
        description: sub.data.public_description,
        url: sub.data.url,
      }));
  } catch (error) {
    console.error("Error searching subreddits:", error);
    return [];
  }
};

export const fetchSubredditPosts = async (
  subreddit,
  query = "",
  sort = "hot",
  limit = 25
) => {
  try {
    const token = await getRedditAccessToken();
    if (!token) return { posts: [], error: "Failed to get access token" };

    const searchQuery = query ? `title:${query}` : "";
    const endpoint = searchQuery
      ? `${REDDIT_OAUTH_BASE}/r/${subreddit}/search`
      : `${REDDIT_OAUTH_BASE}/r/${subreddit}/${sort}`;

    const response = await axios.get(endpoint, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: {
        q: searchQuery,
        sort: sort,
        limit: limit,
        t: "all",
        restrict_sr: true,
      },
    });

    const posts = response.data.data.children.map((post) => ({
      id: post.data.id,
      title: post.data.title,
      selftext: post.data.selftext,
      url: post.data.url,
      score: post.data.score,
      num_comments: post.data.num_comments,
      created_utc: post.data.created_utc,
      author: post.data.author,
      subreddit: post.data.subreddit,
      permalink: post.data.permalink,
      thumbnail: post.data.thumbnail,
      is_self: post.data.is_self,
      upvote_ratio: post.data.upvote_ratio,
      isReview: isReviewPost(post.data),
      reviewType: getReviewType(post.data),
    }));

    return { posts, error: null };
  } catch (error) {
    console.error("Error fetching subreddit posts:", error);
    return { posts: [], error: error.message };
  }
};

const isReviewPost = (post) => {
  const reviewKeywords = [
    "review",
    "rating",
    "score",
    "opinion",
    "thoughts",
    "recommend",
    "watch",
    "seen",
    "watched",
    "movie",
    "show",
    "series",
    "film",
    "episode",
    "season",
    "plot",
    "acting",
    "direction",
    "cinematography",
    "soundtrack",
    "effects",
    "special effects",
    "cgi",
    "story",
    "script",
    "writing",
    "performance",
    "cast",
    "character",
    "ending",
    "climax",
    "pacing",
    "dialogue",
    "themes",
    "message",
    "entertainment",
    "spoiler",
    "final thoughts",
    "first impression",
  ];

  const title = post.title.toLowerCase();
  const text = post.selftext.toLowerCase();
  const combined = `${title} ${text}`;

  const hasReviewKeyword = reviewKeywords.some((keyword) =>
    combined.includes(keyword)
  );

  const hasMediaContext = [
    "movie",
    "film",
    "tv",
    "show",
    "series",
    "episode",
    "season",
    "cinema",
  ].some((media) => combined.includes(media));

  const isGeneric =
    title.includes("recommend") &&
    !title.includes("review") &&
    text.length < 100;

  return hasReviewKeyword && hasMediaContext && !isGeneric;
};

const getReviewType = (post) => {
  const title = post.title.toLowerCase();
  const text = post.selftext.toLowerCase();

  if (title.includes("spoiler") || text.includes("spoiler")) return "spoiler";
  if (title.includes("first impression") || text.includes("first impression"))
    return "first_impression";
  if (title.includes("final thoughts") || text.includes("final thoughts"))
    return "final_thoughts";
  if (title.includes("episode") || text.includes("episode"))
    return "episode_review";
  if (title.includes("season") || text.includes("season"))
    return "season_review";

  return "general";
};

export const searchRelatedPosts = async (title, mediaType = "movie") => {
  try {
    const token = await getRedditAccessToken();
    if (!token) return { posts: [], error: "Failed to get access token" };

    const cleanTitle = title.replace(/[^\w\s]/g, "").trim();
    const searchTerms = cleanTitle.split(" ").filter((word) => word.length > 2);

    const exactTitleQuery = `"${cleanTitle}"`;
    const partialQueries = searchTerms
      .slice(0, 2)
      .map((term) => `"${term}"`)
      .join(" AND ");
    const mediaKeywords =
      mediaType === "movie" ? ["movie", "film"] : ["tv", "show", "series"];

    const titleAndMediaQuery = `${exactTitleQuery} (${mediaKeywords.join(
      " OR "
    )})`;
    const finalQuery = partialQueries
      ? `${titleAndMediaQuery} OR (${exactTitleQuery} ${partialQueries})`
      : titleAndMediaQuery;

    const allPosts = [];

    const primarySubreddits =
      mediaType === "movie"
        ? [
            "movies",
            "MovieSuggestions",
            "TrueFilm",
            "horror",
            "scifi",
            "Letterboxd",
            "moviescirclejerk",
            "criterion",
            "Itunes",
            "netflix",
          ]
        : [
            "television",
            "tvshows",
            "netflix",
            "hbo",
            "amazonprime",
            "hulu",
            "tv",
            "Series",
            "anime",
            "breakingbad",
          ];

    for (const subreddit of primarySubreddits.slice(0, 3)) {
      try {
        const response = await axios.get(
          `${REDDIT_OAUTH_BASE}/r/${subreddit}/search`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            params: {
              q: finalQuery,
              sort: "relevance",
              limit: 15,
              t: "all",
              restrict_sr: true,
            },
          }
        );

        const posts = response.data.data.children
          .filter((post) => {
            const postTitle = post.data.title.toLowerCase();
            const postText = post.data.selftext.toLowerCase();
            const fullContent = `${postTitle} ${postText}`;

            const hasTitleMatch = searchTerms.some((term) =>
              fullContent.includes(term.toLowerCase())
            );

            const isReviewType = isReviewPost(post.data);
            const mentionsTitle =
              postTitle.includes(cleanTitle.toLowerCase()) ||
              postText.includes(cleanTitle.toLowerCase());

            const hasMediaContext = mediaKeywords.some((keyword) =>
              fullContent.includes(keyword)
            );

            const isTooGeneric =
              postTitle.includes("recommend") &&
              !postTitle.includes(cleanTitle.toLowerCase().split(" ")[0]);

            return (
              hasTitleMatch &&
              (isReviewType || mentionsTitle) &&
              hasMediaContext &&
              !isTooGeneric &&
              post.data.score > 0 &&
              post.data.num_comments >= 0
            );
          })
          .map((post) => ({
            id: post.data.id,
            title: post.data.title,
            selftext: post.data.selftext,
            url: post.data.url,
            score: post.data.score,
            num_comments: post.data.num_comments,
            created_utc: post.data.created_utc,
            author: post.data.author,
            subreddit: post.data.subreddit,
            permalink: post.data.permalink,
            thumbnail: post.data.thumbnail,
            is_self: post.data.is_self,
            upvote_ratio: post.data.upvote_ratio,
            isReview: isReviewPost(post.data),
            reviewType: getReviewType(post.data),
            relevanceScore: calculateRelevanceScore(
              post.data,
              cleanTitle,
              searchTerms
            ),
          }));

        allPosts.push(...posts);
      } catch (error) {
        console.warn(`Error searching r/${subreddit}:`, error.message);
      }
    }

    const sortedPosts = allPosts
      .filter((post) => post.relevanceScore >= 10)
      .sort((a, b) => {
        if (b.relevanceScore !== a.relevanceScore) {
          return b.relevanceScore - a.relevanceScore;
        }
        const scoreDiff = b.score - a.score;
        if (scoreDiff !== 0) return scoreDiff;

        return b.created_utc - a.created_utc;
      })
      .slice(0, 12);

    return { posts: sortedPosts, error: null };
  } catch (error) {
    console.error("Error searching related posts:", error);
    return { posts: [], error: error.message };
  }
};

const calculateRelevanceScore = (post, searchTitle, searchTerms) => {
  const title = post.title.toLowerCase();
  const text = post.selftext.toLowerCase();
  const search = searchTitle.toLowerCase();
  const fullContent = `${title} ${text}`;

  let score = 0;

  if (title.includes(search) || text.includes(search)) score += 20;

  searchTerms.forEach((word) => {
    if (word.length > 2) {
      const wordLower = word.toLowerCase();
      if (title.includes(wordLower)) score += 5;
      if (text.includes(wordLower)) score += 3;
    }
  });

  if (isReviewPost(post)) score += 8;

  if (
    (title.includes("review") || text.includes("review")) &&
    (title.includes(search.split(" ")[0]) ||
      text.includes(search.split(" ")[0]))
  ) {
    score += 10;
  }

  const daysSincePost = (Date.now() / 1000 - post.created_utc) / (60 * 60 * 24);
  if (daysSincePost < 7) score += 6;
  else if (daysSincePost < 30) score += 4;
  else if (daysSincePost < 90) score += 2;

  if (post.score > 100) score += 4;
  else if (post.score > 50) score += 2;
  else if (post.score > 10) score += 1;

  if (post.num_comments > 50) score += 3;
  else if (post.num_comments > 20) score += 2;
  else if (post.num_comments > 5) score += 1;

  const movieSubs = [
    "movies",
    "MovieSuggestions",
    "TrueFilm",
    "Criterion",
    "horror",
    "scifi",
    "Letterboxd",
  ];
  if (movieSubs.includes(post.subreddit)) score += 3;

  return score;
};

export const getPostDetails = async (subreddit, postId) => {
  try {
    const token = await getRedditAccessToken();
    if (!token)
      return { post: null, comments: [], error: "Failed to get access token" };

    const response = await axios.get(
      `${REDDIT_OAUTH_BASE}/r/${subreddit}/comments/${postId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          depth: 5,
          limit: 100,
          sort: "top",
          threaded: true,
        },
      }
    );

    const postData = response.data[0].data.children[0].data;
    const post = {
      id: postData.id,
      title: postData.title,
      selftext: postData.selftext,
      selftext_html: postData.selftext_html,
      url: postData.url,
      score: postData.score,
      num_comments: postData.num_comments,
      created_utc: postData.created_utc,
      author: postData.author,
      subreddit: postData.subreddit,
      permalink: postData.permalink,
      thumbnail: postData.thumbnail,
      is_self: postData.is_self,
      upvote_ratio: postData.upvote_ratio,
      domain: postData.domain,
      link_flair_text: postData.link_flair_text,
      spoiler: postData.spoiler,
      over_18: postData.over_18,
      stickied: postData.stickied,
      locked: postData.locked,
      media: postData.media,
      media_embed: postData.media_embed,
      preview: postData.preview,
      edited: postData.edited,
      distinguished: postData.distinguished,
      gilded: postData.gilded,
      total_awards_received: postData.total_awards_received,
    };

    const comments = response.data[1].data.children
      .filter((comment) => comment.kind === "t1")
      .map((comment) => parseComment(comment.data));

    return { post, comments, error: null };
  } catch (error) {
    console.error("Error fetching post details:", error);
    return { post: null, comments: [], error: error.message };
  }
};

const parseComment = (commentData) => {
  return {
    id: commentData.id,
    author: commentData.author,
    body: commentData.body,
    body_html: commentData.body_html,
    score: commentData.score,
    created_utc: commentData.created_utc,
    depth: commentData.depth,
    edited: commentData.edited,
    distinguished: commentData.distinguished,
    stickied: commentData.stickied,
    score_hidden: commentData.score_hidden,
    replies: commentData.replies?.data?.children
      ? commentData.replies.data.children
          .filter((reply) => reply.kind === "t1")
          .map((reply) => parseComment(reply.data))
      : [],
  };
};
