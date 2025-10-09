import React, { useState, useEffect } from "react";
import ContentWrapper from "../../../components/contentWrapper/ContentWrapper";
import { fetchDataFromApi } from "../../../utils/api";
import Carousel from "../../../components/carousel/Carousel";
import "./style.scss";

const MovieByYear = () => {
  const [selectedYear, setSelectedYear] = useState("2024");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  const yearCategories = [
    {
      id: "2020",
      year: "2020",
      icon: "🎬",
      gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      tagline: "Pandemic Era",
    },
    {
      id: "2021",
      year: "2021",
      icon: "🎭",
      gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
      tagline: "Recovery Year",
    },
    {
      id: "2022",
      year: "2022",
      icon: "🎪",
      gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
      tagline: "Box Office Return",
    },
    {
      id: "2023",
      year: "2023",
      icon: "🎥",
      gradient: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
      tagline: "Blockbuster Year",
    },
    {
      id: "2024",
      year: "2024",
      icon: "🌟",
      gradient: "linear-gradient(135deg, #30cfd0 0%, #330867 100%)",
      tagline: "Modern Cinema",
    },
    {
      id: "2025",
      year: "2025",
      icon: "🚀",
      gradient: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
      tagline: "Current Year",
    },
  ];

  useEffect(() => {
    fetchMoviesByYear();
  }, [selectedYear]);

  const fetchMoviesByYear = async () => {
    setLoading(true);
    try {
      const year = selectedYear;
      const currentYear = new Date().getFullYear();
      const currentDate = new Date().toISOString().split("T")[0];

      const startDate = `${year}-01-01`;
      const endDate =
        parseInt(year) === currentYear ? currentDate : `${year}-12-31`;

      console.log(
        `🎬 [MovieByYear] Fetching top popular movies from ${year} (${startDate} to ${endDate})`
      );

      const fetchPromises = Array.from({ length: 3 }, (_, i) => {
        const params = {
          include_adult: false,
          include_video: false,
          language: "en-US",
          page: i + 1,
          sort_by: "popularity.desc",
          "primary_release_date.gte": startDate,
          "primary_release_date.lte": endDate,
          "vote_count.gte": 50,
        };
        return fetchDataFromApi("/discover/movie", params);
      });

      const results = await Promise.all(fetchPromises);

      const allMovies = results.flatMap((result) => result.results || []);
      const uniqueMovies = Array.from(
        new Map(allMovies.map((movie) => [movie.id, movie])).values()
      );

      const topMovies = uniqueMovies
        .sort((a, b) => b.popularity - a.popularity)
        .slice(0, 30);

      console.log(`✅ Found ${topMovies.length} popular movies from ${year}`);

      topMovies.slice(0, 5).forEach((movie, index) => {
        console.log(
          `  ${index + 1}. ${movie.title} (⭐${movie.vote_average.toFixed(
            1
          )}, 🔥${Math.round(movie.popularity)})`
        );
      });

      setData({ results: topMovies });
    } catch (error) {
      console.error("❌ Error fetching movies by year:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="movieByYearSection">
      <ContentWrapper>
        <div className="sectionHeader">
          <h2 className="sectionTitle">Movies by Year</h2>
          <p className="sectionSubtitle">
            Explore the most popular movies from each year
          </p>
        </div>

        <div className="yearGrid">
          {yearCategories.map((category) => (
            <div
              key={category.id}
              className={`yearCard ${
                selectedYear === category.year ? "active" : ""
              }`}
              onClick={() => setSelectedYear(category.year)}
              style={{
                background:
                  selectedYear === category.year
                    ? category.gradient
                    : "rgba(255, 255, 255, 0.05)",
              }}
            >
              <div className="yearIcon">{category.icon}</div>
              <div className="yearInfo">
                <h3 className="yearNumber">{category.year}</h3>
                <p className="yearTagline">{category.tagline}</p>
              </div>
              {selectedYear === category.year && (
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
        title={`Top Popular Movies from ${selectedYear}`}
      />
    </div>
  );
};

export default MovieByYear;
