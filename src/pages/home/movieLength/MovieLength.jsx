import React, { useState, useEffect } from "react";
import ContentWrapper from "../../../components/contentWrapper/ContentWrapper";
import { fetchDataFromApi } from "../../../utils/api";
import Carousel from "../../../components/carousel/Carousel";
import "./style.scss";

const MovieLength = () => {
  const [selectedCategory, setSelectedCategory] = useState("standard");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  const categories = [
    {
      id: "short",
      name: "Short Films",
      subtitle: "Under 60 min",
      icon: "⚡",
      description: "Quick bites of cinema",
      runtime: { min: 1, max: 60 },
      gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    },
    {
      id: "quick",
      name: "Quick Watch",
      subtitle: "60-90 min",
      icon: "🎬",
      description: "Perfect for an evening",
      runtime: { min: 60, max: 90 },
      gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    },
    {
      id: "standard",
      name: "Standard",
      subtitle: "90-150 min",
      icon: "🍿",
      description: "Classic movie length",
      runtime: { min: 90, max: 150 },
      gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    },
    {
      id: "epic",
      name: "Epic",
      subtitle: "150+ min",
      icon: "🎭",
      description: "Immersive experiences",
      runtime: { min: 150, max: 999 },
      gradient: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
    },
  ];

  useEffect(() => {
    fetchMoviesByLength();
  }, [selectedCategory]);

  const fetchMoviesByLength = async () => {
    setLoading(true);
    try {
      const category = categories.find((cat) => cat.id === selectedCategory);

      const today = new Date();
      const threeYearsAgo = new Date();
      threeYearsAgo.setFullYear(today.getFullYear() - 3);

      const todayStr = today.toISOString().split("T")[0];
      const threeYearsAgoStr = threeYearsAgo.toISOString().split("T")[0];

      console.log(
        `🎬 [MovieLength] Fetching latest + popular ${category.name} (${category.runtime.min}-${category.runtime.max} min)`
      );

      const fetchPromises = [
        ...Array.from({ length: 3 }, (_, i) => {
          const params = {
            include_adult: false,
            include_video: false,
            language: "en-US",
            page: i + 1,
            sort_by: "release_date.desc",
            "primary_release_date.gte": threeYearsAgoStr,
            "primary_release_date.lte": todayStr,
            "vote_count.gte": 10,
            "with_runtime.gte": category.runtime.min,
            "with_runtime.lte": category.runtime.max,
          };
          return fetchDataFromApi("/discover/movie", params);
        }),
        ...Array.from({ length: 3 }, (_, i) => {
          const params = {
            include_adult: false,
            include_video: false,
            language: "en-US",
            page: i + 1,
            sort_by: "popularity.desc",
            "primary_release_date.gte": threeYearsAgoStr,
            "vote_count.gte": 50,
            "with_runtime.gte": category.runtime.min,
            "with_runtime.lte": category.runtime.max,
          };
          return fetchDataFromApi("/discover/movie", params);
        }),
      ];

      const responses = await Promise.all(fetchPromises);
      const allMovies = responses
        .filter((res) => res?.results)
        .flatMap((res) => res.results);

      const uniqueMovies = allMovies.filter(
        (movie, index, self) =>
          index === self.findIndex((m) => m.id === movie.id)
      );

      console.log(
        `📥 Fetched ${uniqueMovies.length} unique movies (latest + popular), now verifying...`
      );

      const verifiedMovies = [];
      let checked = 0;
      let filtered = 0;
      const batchSize = 15;

      for (
        let i = 0;
        i < uniqueMovies.length && verifiedMovies.length < 30;
        i += batchSize
      ) {
        const batch = uniqueMovies.slice(i, i + batchSize);

        const detailsPromises = batch.map((movie) =>
          fetchDataFromApi(`/movie/${movie.id}`).then((details) => ({
            movie,
            details,
          }))
        );

        const batchResults = await Promise.all(detailsPromises);

        for (const { movie, details } of batchResults) {
          if (verifiedMovies.length >= 30) break;

          checked++;

          if (details && details.runtime && details.release_date) {
            const runtime = details.runtime;
            const withinRange =
              runtime >= category.runtime.min &&
              runtime <= category.runtime.max;

            if (withinRange) {
              movie.release_date = details.release_date;
              movie.vote_average = details.vote_average || 0;
              verifiedMovies.push(movie);
              if (verifiedMovies.length <= 3) {
                console.log(
                  `  ✓ ${movie.title}: ${runtime} min (${details.release_date}, ⭐${movie.vote_average})`
                );
              }
            } else {
              filtered++;
              if (filtered <= 3) {
                console.log(
                  `  ❌ FILTERED: ${movie.title}: ${runtime} min (outside ${category.runtime.min}-${category.runtime.max})`
                );
              }
            }
          }
        }
      }

      verifiedMovies.sort((a, b) => {
        const dateA = new Date(a.release_date);
        const dateB = new Date(b.release_date);
        const dateDiff = dateB - dateA;

        const daysDiff = Math.abs(dateDiff) / (1000 * 60 * 60 * 24);
        if (daysDiff < 60) {
          return b.popularity - a.popularity;
        }

        return dateDiff;
      });

      console.log(
        `✅ Final: ${verifiedMovies.length} accurate movies (latest + popular) - checked ${checked}, filtered ${filtered}`
      );

      setData({ results: verifiedMovies });
    } catch (error) {
      console.error("❌ Error fetching movies by length:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="movieLengthSection">
      <ContentWrapper>
        <div className="sectionHeader">
          <h2 className="sectionTitle">Movies by Duration</h2>
          <p className="sectionSubtitle">
            Find the perfect movie for your available time
          </p>
        </div>

        <div className="categoryGrid">
          {categories.map((category) => (
            <div
              key={category.id}
              className={`categoryCard ${
                selectedCategory === category.id ? "active" : ""
              }`}
              onClick={() => setSelectedCategory(category.id)}
              style={{
                background:
                  selectedCategory === category.id
                    ? category.gradient
                    : "rgba(255, 255, 255, 0.05)",
              }}
            >
              <div className="categoryIcon">{category.icon}</div>
              <div className="categoryInfo">
                <h3 className="categoryName">{category.name}</h3>
                <p className="categorySubtitle">{category.subtitle}</p>
                <p className="categoryDescription">{category.description}</p>
              </div>
              {selectedCategory === category.id && (
                <div className="activeIndicator">
                  <span className="checkmark">✓</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </ContentWrapper>

      <Carousel
        data={data?.results}
        loading={loading}
        endpoint="movie"
        title={`Latest ${
          categories.find((cat) => cat.id === selectedCategory)?.name
        } Movies`}
      />
    </div>
  );
};

export default MovieLength;
