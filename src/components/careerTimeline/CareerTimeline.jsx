import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ContentWrapper from "../contentWrapper/ContentWrapper";
import "./style.scss";

const generateDeterministicTimeline = (actorName, credits) => {
  if (!credits) return { milestones: [] };

  const cast = credits.cast || [];
  const crew = credits.crew || [];

  const allItems = [];
  const seenIds = new Set();

  const addItems = (list, roleType) => {
    list.forEach((item) => {
      const id = `${item.media_type || "movie"}_${item.id}`;
      if (seenIds.has(id)) return;
      seenIds.add(id);

      const dateStr = item.release_date || item.first_air_date;
      if (!dateStr) return;

      const year = parseInt(dateStr.split("-")[0]);
      if (isNaN(year)) return;

      allItems.push({
        id: item.id,
        title: item.title || item.name || "Untitled",
        mediaType: item.media_type || "movie",
        year: year,
        rating: item.vote_average || 0,
        votes: item.vote_count || 0,
        popularity: item.popularity || 0,
        role:
          roleType === "cast"
            ? item.character
              ? `as ${item.character}`
              : "Actor"
            : item.job || "Crew",
        link: `/${item.media_type || "movie"}/${item.id}`,
      });
    });
  };

  addItems(cast, "cast");
  addItems(crew, "crew");

  if (allItems.length === 0) return { milestones: [] };

  allItems.sort((a, b) => a.year - b.year);

  const milestones = [];

  const debut = allItems[0];
  milestones.push({
    year: debut.year.toString(),
    title: `Career Debut: ${debut.title}`,
    description: `Marked the official entry of ${actorName} into the industry, working ${debut.role}.`,
    type: "milestone",
    link: debut.link,
  });

  let peakPopularityItem = null;
  allItems.forEach((item) => {
    if (item.id === debut.id && item.mediaType === debut.mediaType) return;
    if (
      !peakPopularityItem ||
      item.popularity > peakPopularityItem.popularity
    ) {
      peakPopularityItem = item;
    }
  });

  let criticalAcclaimItem = null;
  allItems.forEach((item) => {
    if (item.id === debut.id && item.mediaType === debut.mediaType) return;
    if (
      peakPopularityItem &&
      item.id === peakPopularityItem.id &&
      item.mediaType === peakPopularityItem.mediaType
    )
      return;
    if (item.votes > 100) {
      if (!criticalAcclaimItem || item.rating > criticalAcclaimItem.rating) {
        criticalAcclaimItem = item;
      }
    }
  });

  if (!criticalAcclaimItem) {
    allItems.forEach((item) => {
      if (item.id === debut.id && item.mediaType === debut.mediaType) return;
      if (
        peakPopularityItem &&
        item.id === peakPopularityItem.id &&
        item.mediaType === peakPopularityItem.mediaType
      )
        return;
      if (!criticalAcclaimItem || item.rating > criticalAcclaimItem.rating) {
        criticalAcclaimItem = item;
      }
    });
  }

  let transitionItem = null;
  if (crew.length > 0) {
    const sortedCrew = [...allItems]
      .filter((item) => crew.some((c) => c.id === item.id))
      .sort((a, b) => a.year - b.year);

    if (sortedCrew.length > 0 && sortedCrew[0].year > debut.year) {
      transitionItem = sortedCrew[0];
    }
  }

  if (peakPopularityItem) {
    milestones.push({
      year: peakPopularityItem.year.toString(),
      title: `Global Blockbuster: ${peakPopularityItem.title}`,
      description: `Reached a major commercial peak, starring ${peakPopularityItem.role}. The project gained immense global popularity.`,
      type: "peak",
      link: peakPopularityItem.link,
    });
  }

  if (criticalAcclaimItem && criticalAcclaimItem.rating > 6.5) {
    milestones.push({
      year: criticalAcclaimItem.year.toString(),
      title: `Critical Acclaim: ${criticalAcclaimItem.title}`,
      description: `Received stellar reviews from critics and audiences alike, holding an outstanding user rating of ${criticalAcclaimItem.rating.toFixed(1)}/10.`,
      type: "achievement",
      link: criticalAcclaimItem.link,
    });
  }

  if (transitionItem) {
    milestones.push({
      year: transitionItem.year.toString(),
      title: `Behind-the-Scenes Debut: ${transitionItem.title}`,
      description: `Expanded their creative footprint, taking on a key behind-the-scenes role as a member of the crew (${transitionItem.role}).`,
      type: "milestone",
      link: transitionItem.link,
    });
  }

  const currentYear = new Date().getFullYear();
  const pastOrPresentItems = allItems.filter(
    (item) => item.year <= currentYear,
  );
  if (pastOrPresentItems.length > 0) {
    const recent = pastOrPresentItems[pastOrPresentItems.length - 1];
    const alreadyAdded = milestones.some((m) => m.link === recent.link);
    if (!alreadyAdded) {
      milestones.push({
        year: recent.year.toString(),
        title: `Recent Highlight: ${recent.title}`,
        description: `Continues to deliver strong performances, starring ${recent.role} in this recent release.`,
        type: "movie",
        link: recent.link,
      });
    }
  }

  milestones.sort((a, b) => parseInt(a.year) - parseInt(b.year));

  return { milestones };
};

const CareerTimeline = ({ actorName, biography, credits }) => {
  const [timeline, setTimeline] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!actorName || !credits) return;

    let isMounted = true;
    const loadTimeline = async () => {
      const cacheKey = `timeline_${actorName}_${credits.cast?.length || 0}`;
      const cached = localStorage.getItem(cacheKey);

      if (cached) {
        const parsed = JSON.parse(cached);
        if (isMounted) {
          setTimeline(parsed);
          return;
        }
      }

      const fallbackResult = generateDeterministicTimeline(actorName, credits);
      if (isMounted) {
        setTimeline(fallbackResult);
      }

      try {
        const { generateActorTimeline } = await import("../../utils/gemini");
        const aiTimeline = await generateActorTimeline(
          actorName,
          biography,
          credits,
        );
        if (
          aiTimeline &&
          aiTimeline.milestones &&
          aiTimeline.milestones.length > 0
        ) {
          if (isMounted) {
            setTimeline(aiTimeline);
            localStorage.setItem(cacheKey, JSON.stringify(aiTimeline));
          }
        }
      } catch (error) {
        console.error("AI timeline background fetch failed:", error);
      }
    };

    loadTimeline();
    return () => {
      isMounted = false;
    };
  }, [actorName, credits, biography]);

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
