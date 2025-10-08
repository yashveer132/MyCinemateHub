import React, { useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  FaHeart,
  FaBookmark,
  FaCheck,
  FaUser,
  FaArrowRight,
  FaRobot,
  FaMagic,
} from "react-icons/fa";

import "./style.scss";
import ContentWrapper from "../../components/contentWrapper/ContentWrapper";
import MovieCard from "../../components/movieCard/MovieCard";
import Carousel from "../../components/carousel/Carousel";
import WatchedCarousel from "../../components/watchedCarousel/WatchedCarousel";
import {
  getAIInsightsWithRecommendations,
  clearAIInsightsCache,
} from "../../utils/aiInsights";
import StatisticsSection from "./StatisticsSection";

const Profile = () => {
  const userState = useSelector((state) => state.user);
  const { favorites = [], watchLater = [], watched = [] } = userState || {};
  const { url } = useSelector((state) => state.home);
  const navigate = useNavigate();

  const favoritesRef = useRef(null);
  const watchLaterRef = useRef(null);
  const watchedRef = useRef(null);
  const aiRef = useRef(null);

  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiData, setAiData] = useState(null);
  const [showKeywords, setShowKeywords] = useState(false);

  const allItems = useMemo(
    () => [...favorites, ...watchLater, ...watched],
    [favorites, watchLater, watched]
  );

  React.useEffect(() => {
    clearAIInsightsCache();
    setAiData(null);
  }, []);

  const scrollToSection = (ref) => {
    if (ref.current) {
      const offsetTop = ref.current.offsetTop - 100;
      window.scrollTo({
        top: offsetTop,
        behavior: "smooth",
      });
    }
  };

  const generateInsights = async () => {
    setAiError("");
    setAiLoading(true);
    try {
      if (allItems.length === 0) {
        setAiError(
          "Add items to Favorites, Watch Later, or Watched to generate insights."
        );
        setTimeout(() => scrollToSection(aiRef), 50);
        return;
      }
      const res = await getAIInsightsWithRecommendations(
        favorites,
        watchLater,
        watched,
        { mediaType: "movie" }
      );
      if (!res) throw new Error("Failed to generate insights");
      setAiData(res);
      setTimeout(() => scrollToSection(aiRef), 50);
    } catch (e) {
      setAiError(e?.message || "Something went wrong");
    } finally {
      setAiLoading(false);
    }
  };

  const EmptyState = ({ icon, title, description, sectionType }) => {
    return (
      <div className="emptyState">
        <div className="emptyIcon">{icon}</div>
        <h3 className="emptyTitle">{title}</h3>
        <p className="emptyDescription">{description}</p>
        <div className="emptyActions">
          <button
            className="emptyAction"
            onClick={() => navigate("/explore/movie")}
          >
            Browse Movies
            <FaArrowRight />
          </button>
          <button
            className="emptyAction"
            onClick={() => navigate("/explore/tv")}
          >
            Explore TV Shows
            <FaArrowRight />
          </button>
        </div>
      </div>
    );
  };

  const ProfileSection = ({
    title,
    data,
    icon,
    emptyStateConfig,
    showWatchedDate,
    isWatchedSection,
  }) => {
    return (
      <div className="carouselSection">
        <ContentWrapper>
          <div className="sectionHeader">
            <div className="sectionTitleWrapper">
              <div className="sectionIcon">{icon}</div>
              <span className="carouselTitle">{title}</span>
              <span className="sectionCount">({data.length})</span>
            </div>
          </div>

          {data.length > 0 ? (
            isWatchedSection ? (
              <WatchedCarousel data={data} loading={false} url={url} />
            ) : (
              <Carousel
                data={data}
                loading={false}
                showWatchedDate={showWatchedDate}
              />
            )
          ) : (
            <EmptyState {...emptyStateConfig} />
          )}
        </ContentWrapper>
      </div>
    );
  };

  return (
    <div className="profilePage">
      <ContentWrapper>
        <div className="profileHeader">
          <div className="profileInfo">
            <div className="profileAvatar">
              <FaUser />
            </div>
            <div className="profileDetails">
              <h1 className="profileTitle">My Profile</h1>
              <p className="profileSubtitle">Manage your movies and TV shows</p>
            </div>
          </div>

          <div className="profileStats">
            <div
              className="statItem"
              onClick={() => scrollToSection(watchedRef)}
            >
              <span className="statNumber">{watched.length}</span>
              <span className="statLabel">Watched</span>
            </div>
            <div
              className="statItem"
              onClick={() => scrollToSection(favoritesRef)}
            >
              <span className="statNumber">{favorites.length}</span>
              <span className="statLabel">Favorites</span>
            </div>
            <div
              className="statItem"
              onClick={() => scrollToSection(watchLaterRef)}
            >
              <span className="statNumber">{watchLater.length}</span>
              <span className="statLabel">Watch Later</span>
            </div>
            <div
              className="statItem aiStat"
              onClick={() => scrollToSection(aiRef)}
            >
              <span className="statNumber">
                <FaRobot />
              </span>
              <span className="statLabel">AI Insights</span>
            </div>
          </div>
        </div>
      </ContentWrapper>

      <StatisticsSection favorites={favorites} watched={watched} />

      <div ref={watchedRef}>
        <ProfileSection
          title="Watched"
          data={watched}
          icon={<FaCheck />}
          showWatchedDate={true}
          isWatchedSection={true}
          emptyStateConfig={{
            icon: <FaCheck />,
            title: "No Watched Items",
            description:
              "Keep track of what you've watched by marking items as complete. Build your viewing history and discover patterns in your taste!",
          }}
        />
      </div>

      <div ref={favoritesRef}>
        <ProfileSection
          title="My Favorites"
          data={favorites}
          icon={<FaHeart />}
          emptyStateConfig={{
            icon: <FaHeart />,
            title: "No Favorites Yet",
            description:
              "Start building your collection by adding movies and TV shows to your favorites. Click the heart icon on any movie card to get started!",
          }}
        />
      </div>

      <div ref={watchLaterRef}>
        <ProfileSection
          title="Watch Later"
          data={watchLater}
          icon={<FaBookmark />}
          emptyStateConfig={{
            icon: <FaBookmark />,
            title: "Watch Later List is Empty",
            description:
              "Save movies and TV shows you want to watch later. Never forget about that interesting title you discovered!",
          }}
        />
      </div>

      <div ref={aiRef} className="profileSection aiInsightsSection">
        <ContentWrapper>
          <div className="sectionHeader">
            <div className="sectionTitleWrapper">
              <div className="sectionIcon">
                <FaRobot />
              </div>
              <span className="sectionTitle">AI Insights</span>
            </div>
          </div>

          <div className="aiInsightsToolbar">
            <button
              type="button"
              className="generateBtn"
              disabled={aiLoading}
              onClick={generateInsights}
              title={"Generate AI insights"}
            >
              {aiLoading ? (
                <>
                  <span className="loader" /> Generating...
                </>
              ) : (
                <>
                  <FaMagic /> Generate AI Insights
                </>
              )}
            </button>
            {aiData && (
              <label className="toggleKeywords">
                <input
                  type="checkbox"
                  checked={showKeywords}
                  onChange={(e) => setShowKeywords(e.target.checked)}
                />
                Show discovery keywords
              </label>
            )}
            {aiError && <div className="aiError">{aiError}</div>}
          </div>

          {aiData ? (
            <div className="aiInsightsContent">
              <div className="insightsSummary">
                <h3>Your Taste Overview</h3>
                <p className="summaryText">{aiData.insights.summary}</p>
                <div className="tasteBadges">
                  {(aiData.insights.tasteProfile?.vibe || []).map((v) => (
                    <span key={v} className="badge">
                      {v}
                    </span>
                  ))}
                  {aiData.insights.tasteProfile?.pace && (
                    <span className="badge subtle">
                      Pace: {aiData.insights.tasteProfile.pace}
                    </span>
                  )}
                </div>
                {!!(aiData.insights.topGenres || []).length && (
                  <div className="topGenres">
                    <span className="label">Top genres:</span>
                    {(aiData.insights.topGenres || []).slice(0, 5).map((g) => (
                      <span key={g} className="genre">
                        {g}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {(aiData.insights.creatorLeanings?.directors?.length ||
                aiData.insights.creatorLeanings?.actors?.length) && (
                <div className="creatorLeanings">
                  {aiData.insights.creatorLeanings?.directors?.length > 0 && (
                    <div className="creatorGroup">
                      <div className="creatorLabel">
                        Directors you lean toward:
                      </div>
                      <div className="creatorChips">
                        {aiData.insights.creatorLeanings.directors
                          .slice(0, 6)
                          .map((d) => (
                            <span className="chip" key={d}>
                              {d}
                            </span>
                          ))}
                      </div>
                    </div>
                  )}
                  {aiData.insights.creatorLeanings?.actors?.length > 0 && (
                    <div className="creatorGroup">
                      <div className="creatorLabel">Actors you favor:</div>
                      <div className="creatorChips">
                        {aiData.insights.creatorLeanings.actors
                          .slice(0, 6)
                          .map((a) => (
                            <span className="chip" key={a}>
                              {a}
                            </span>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {aiData.insights.diversity && (
                <div className="diversity">
                  <div className="diversityBox">
                    <div className="diversityLabel">Variety</div>
                    <div className="diversityValue">
                      {aiData.insights.diversity.genreSpread}
                    </div>
                  </div>
                  <div className="diversityBox">
                    <div className="diversityLabel">
                      Risk appetite
                      <span
                        className="info"
                        title="How often you explore outside your core tastes (safe → experimental)"
                      >
                        {" "}
                        ⓘ
                      </span>
                    </div>
                    <div className="diversityValue">
                      {aiData.insights.diversity.risk}
                    </div>
                  </div>
                </div>
              )}

              {showKeywords &&
                (aiData.insights.suggestedKeywords || []).length > 0 && (
                  <div className="keywords">
                    <span className="label">Discovery keywords:</span>
                    {aiData.insights.suggestedKeywords.map((k) => (
                      <span key={k} className="chip">
                        {k}
                      </span>
                    ))}
                  </div>
                )}

              <div className="recommendations">
                <Carousel
                  data={aiData.recommended || []}
                  loading={false}
                  endpoint="movie"
                  title="You might like"
                />
              </div>
            </div>
          ) : (
            <div className="emptyState">
              <div className="emptyIcon">
                <FaRobot />
              </div>
              <h3 className="emptyTitle">Get AI-powered taste insights</h3>
              <p className="emptyDescription">
                We'll analyze your favorites, watch later, and watched lists to
                surface what you love and recommend new titles. Click the button
                above to generate when you're ready.
              </p>
            </div>
          )}
        </ContentWrapper>
      </div>
    </div>
  );
};

export default Profile;
