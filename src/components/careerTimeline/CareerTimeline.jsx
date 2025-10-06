import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { generateActorTimeline } from "../../utils/gemini";
import ContentWrapper from "../contentWrapper/ContentWrapper";
import "./style.scss";

const CACHE_KEY = "cinemate_actor_timeline_cache_v1";

const CareerTimeline = ({ actorName, biography, credits }) => {
  const [timeline, setTimeline] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!actorName || !credits) return;

    const fetchTimeline = async () => {
      setLoading(true);
      setError(null);

      const cacheKey = `${actorName}_${credits.id || "unknown"}`;
      const cache = readCache();
      if (cache[cacheKey]) {
        setTimeline(cache[cacheKey]);
        setLoading(false);
        return;
      }

      try {
        const result = await generateActorTimeline(
          actorName,
          biography,
          credits
        );
        if (result) {
          setTimeline(result);
          cache[cacheKey] = result;
          writeCache(cache);
        } else {
          setError("Failed to generate timeline");
        }
      } catch (err) {
        setError("Error loading timeline");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTimeline();
  }, [actorName, biography, credits]);

  const readCache = () => {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  };

  const writeCache = (obj) => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(obj));
    } catch {}
  };

  const handleItemClick = (item) => {
    if (item.link) {
      navigate(item.link);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case "movie":
        return "🎬";
      case "tv":
        return "📺";
      case "award":
        return "🏆";
      case "milestone":
        return "⭐";
      case "peak":
        return "📈";
      case "low_point":
        return "📉";
      case "achievement":
        return "🎯";
      case "controversy":
        return "⚠️";
      case "comeback":
        return "🔄";
      default:
        return "📅";
    }
  };

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -300, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 300, behavior: "smooth" });
    }
  };

  if (loading) {
    return (
      <div className="careerTimeline">
        <ContentWrapper>
          <div className="sectionHeading">Career Timeline</div>
          <div className="timelineSkeleton">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="timelineItem skeleton">
                <div className="icon skeleton"></div>
                <div className="content">
                  <div className="year skeleton"></div>
                  <div className="title skeleton"></div>
                  <div className="description skeleton"></div>
                </div>
              </div>
            ))}
          </div>
        </ContentWrapper>
      </div>
    );
  }

  if (error) {
    return (
      <div className="careerTimeline">
        <ContentWrapper>
          <div className="sectionHeading">Career Timeline</div>
          <div className="errorMessage">
            <span className="errorIcon">⚠️</span>
            {error}
          </div>
        </ContentWrapper>
      </div>
    );
  }

  if (!timeline || !timeline.milestones || timeline.milestones.length === 0) {
    return null;
  }

  return (
    <div className="careerTimeline">
      <ContentWrapper>
        <div className="sectionHeading">Career Timeline</div>
        <div className="timelineWrapper">
          <button className="scrollBtn left" onClick={scrollLeft}>
            ‹
          </button>
          <div className="timelineContainer" ref={scrollRef}>
            {timeline.milestones.map((milestone, index) => (
              <div
                key={`${milestone.year}-${index}`}
                className={`timelineItem ${milestone.link ? "clickable" : ""}`}
                onClick={() => handleItemClick(milestone)}
                title={milestone.link ? "Click to view details" : ""}
              >
                <div className="icon">{getIcon(milestone.type)}</div>
                <div className="content">
                  <div className="year">{milestone.year || "TBD"}</div>
                  <div className="title">{milestone.title}</div>
                  <div className="description">{milestone.description}</div>
                </div>
              </div>
            ))}
          </div>
          <button className="scrollBtn right" onClick={scrollRight}>
            ›
          </button>
        </div>
      </ContentWrapper>
    </div>
  );
};

export default CareerTimeline;
