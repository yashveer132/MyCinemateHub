import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import ContentWrapper from "../../../components/contentWrapper/ContentWrapper";
import SwitchTabs from "../../../components/switchTabs/SwitchTabs";
import Carousel from "../../../components/carousel/Carousel";
import { fetchDataFromApi } from "../../../utils/api";
import "./style.scss";

const ComingSoon = () => {
  const [endpoint, setEndpoint] = useState("movie");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchComingSoon = async () => {
      setLoading(true);

      const today = dayjs().format("YYYY-MM-DD");
      const sixMonthsFromNow = dayjs().add(6, "month").format("YYYY-MM-DD");

      try {
        let allResults = [];

        if (endpoint === "movie") {
          const page1 = await fetchDataFromApi("/discover/movie", {
            sort_by: "popularity.desc",
            "primary_release_date.gte": today,
            "primary_release_date.lte": sixMonthsFromNow,
            page: 1,
          });

          const page2 = await fetchDataFromApi("/discover/movie", {
            sort_by: "popularity.desc",
            "primary_release_date.gte": today,
            "primary_release_date.lte": sixMonthsFromNow,
            page: 2,
          });

          const page3 = await fetchDataFromApi("/discover/movie", {
            sort_by: "popularity.desc",
            "primary_release_date.gte": today,
            "primary_release_date.lte": sixMonthsFromNow,
            page: 3,
          });

          allResults = [
            ...(page1?.results || []),
            ...(page2?.results || []),
            ...(page3?.results || []),
          ];
        } else {
          const page1 = await fetchDataFromApi("/discover/tv", {
            sort_by: "popularity.desc",
            "first_air_date.gte": today,
            "first_air_date.lte": sixMonthsFromNow,
            page: 1,
          });

          const page2 = await fetchDataFromApi("/discover/tv", {
            sort_by: "popularity.desc",
            "first_air_date.gte": today,
            "first_air_date.lte": sixMonthsFromNow,
            page: 2,
          });

          const page3 = await fetchDataFromApi("/discover/tv", {
            sort_by: "popularity.desc",
            "first_air_date.gte": today,
            "first_air_date.lte": sixMonthsFromNow,
            page: 3,
          });

          allResults = [
            ...(page1?.results || []),
            ...(page2?.results || []),
            ...(page3?.results || []),
          ];
        }

        const filteredResults = allResults.filter((item) => {
          const releaseDate =
            endpoint === "movie"
              ? item.release_date || item.primary_release_date
              : item.first_air_date;

          if (!releaseDate) return false;

          return dayjs(releaseDate).isAfter(dayjs().subtract(1, "day"));
        });

        filteredResults.sort((a, b) => {
          const dateA =
            endpoint === "movie"
              ? a.release_date || a.primary_release_date
              : a.first_air_date;
          const dateB =
            endpoint === "movie"
              ? b.release_date || b.primary_release_date
              : b.first_air_date;

          const dateComparison = dayjs(dateA).diff(dayjs(dateB));
          if (dateComparison !== 0) return dateComparison;

          return b.popularity - a.popularity;
        });

        setData(filteredResults);
      } catch (error) {
        console.error("Error fetching coming soon data:", error);
        setData([]);
      }

      setLoading(false);
    };

    fetchComingSoon();
  }, [endpoint]);

  const onTabChange = (tab) => {
    setEndpoint(tab === "Movies" ? "movie" : "tv");
  };

  return (
    <div className="carouselSection comingSoonSection">
      <ContentWrapper>
        <span className="carouselTitle">Coming Soon</span>
        <SwitchTabs data={["Movies", "TV Shows"]} onTabChange={onTabChange} />
      </ContentWrapper>
      <Carousel data={data} loading={loading} endpoint={endpoint} />
    </div>
  );
};

export default ComingSoon;
