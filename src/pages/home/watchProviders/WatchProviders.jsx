import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import ContentWrapper from "../../../components/contentWrapper/ContentWrapper";
import SwitchTabs from "../../../components/switchTabs/SwitchTabs";
import Carousel from "../../../components/carousel/Carousel";
import { fetchDataFromApi } from "../../../utils/api";

const providers = [
  { id: 8, name: "Netflix" },
  { id: 9, name: "Prime Video" },
  { id: 337, name: "Disney+" },
  { id: 2, name: "Apple TV" },
];

const WatchProviders = () => {
  const [provider, setProvider] = useState(providers[0].id);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const today = dayjs().format("YYYY-MM-DD");
      const firstDayOfThisMonth = dayjs().startOf("month").format("YYYY-MM-DD");
      const firstDayOfLastMonth = dayjs()
        .subtract(1, "month")
        .startOf("month")
        .format("YYYY-MM-DD");
      const movieData = await fetchDataFromApi("/discover/movie", {
        with_watch_providers: provider,
        watch_region: "US",
        sort_by: "popularity.desc",
        "primary_release_date.lte": today,
        "primary_release_date.gte": firstDayOfLastMonth,
        "vote_average.gte": 7,
        "vote_count.gte": 5,
        page: 1,
      });
      const tvData = await fetchDataFromApi("/discover/tv", {
        with_watch_providers: provider,
        watch_region: "US",
        sort_by: "popularity.desc",
        "first_air_date.lte": today,
        "first_air_date.gte": firstDayOfLastMonth,
        "vote_average.gte": 7,
        "vote_count.gte": 5,
        with_status: "0|2",
        page: 1,
      });
      const movieResults = (movieData?.results || []).map((item) => ({
        ...item,
        media_type: "movie",
      }));
      const tvResults = (tvData?.results || []).map((item) => ({
        ...item,
        media_type: "tv",
      }));
      let combined = [...movieResults, ...tvResults];
      combined.sort((a, b) => {
        if (b.vote_average !== a.vote_average) {
          return b.vote_average - a.vote_average;
        }
        return b.popularity - a.popularity;
      });

      if (combined.length < 20) {
        const fallbackMovieData = await fetchDataFromApi("/discover/movie", {
          with_watch_providers: provider,
          watch_region: "US",
          sort_by: "popularity.desc",
          "primary_release_date.lte": today,
          "primary_release_date.gte": firstDayOfLastMonth,
          page: 1,
        });
        const fallbackTvData = await fetchDataFromApi("/discover/tv", {
          with_watch_providers: provider,
          watch_region: "US",
          sort_by: "popularity.desc",
          "first_air_date.lte": today,
          "first_air_date.gte": firstDayOfLastMonth,
          with_status: "0|2",
          page: 1,
        });
        const fallbackMovieResults = (fallbackMovieData?.results || []).map(
          (item) => ({ ...item, media_type: "movie" })
        );
        const fallbackTvResults = (fallbackTvData?.results || []).map(
          (item) => ({ ...item, media_type: "tv" })
        );
        const allResults = [
          ...combined,
          ...fallbackMovieResults,
          ...fallbackTvResults,
        ];
        const uniqueResults = [];
        const seenIds = new Set();
        for (const item of allResults) {
          if (!seenIds.has(item.id)) {
            uniqueResults.push(item);
            seenIds.add(item.id);
          }
        }
        combined = uniqueResults.slice(0, 20);
      } else {
        combined = combined.slice(0, 20);
      }
      setData(combined);
      setLoading(false);
    };
    fetchData();
  }, [provider]);

  const onTabChange = (tab) => {
    const selected = providers.find((p) => p.name === tab);
    setProvider(selected.id);
  };

  const tabData = providers.map((p) => p.name);

  return (
    <div className="carouselSection watchProvidersSection">
      <ContentWrapper>
        <span className="carouselTitle">What's Streaming</span>
        <SwitchTabs data={tabData} onTabChange={onTabChange} />
      </ContentWrapper>
      <Carousel data={data} loading={loading} endpoint="movie" />
    </div>
  );
};

export default WatchProviders;
