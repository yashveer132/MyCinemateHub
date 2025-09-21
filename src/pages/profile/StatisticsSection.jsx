import React, { useMemo, useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import ContentWrapper from "../../components/contentWrapper/ContentWrapper";
import { fetchDataFromApi } from "../../utils/api";
import "./style.scss";

const GENRE_ID_TO_NAME = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Science Fiction",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western",
  10759: "Action & Adventure",
  10762: "Kids",
  10763: "News",
  10764: "Reality",
  10765: "Sci-Fi & Fantasy",
  10766: "Soap",
  10767: "Talk",
  10768: "War & Politics",
};

const COLORS = [
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff7c7c",
  "#8dd1e1",
  "#d084d0",
  "#ffb347",
  "#87ceeb",
];

const StatisticsSection = ({ favorites, watched }) => {
  const allItems = useMemo(() => [...watched], [watched]);

  const [runtimeData, setRuntimeData] = useState({});
  const [runtimeLoading, setRuntimeLoading] = useState(false);

  useEffect(() => {
    const fetchRuntimeData = async () => {
      if (allItems.length === 0) return;

      setRuntimeLoading(true);
      const runtimeMap = {};

      for (const item of allItems) {
        try {
          const endpoint =
            item.media_type === "tv" ? `/tv/${item.id}` : `/movie/${item.id}`;
          const data = await fetchDataFromApi(endpoint);

          if (data) {
            if (item.media_type === "tv" && data.episode_run_time?.length > 0) {
              const avgEpisodeRuntime =
                data.episode_run_time.reduce((a, b) => a + b, 0) /
                data.episode_run_time.length;
              runtimeMap[item.id] = {
                runtime: Math.round(avgEpisodeRuntime),
                type: "tv",
                isEstimated: true,
                source: "average_episode",
              };
            } else if (data.runtime) {
              runtimeMap[item.id] = {
                runtime: data.runtime,
                type: "movie",
                isEstimated: false,
                source: "exact",
              };
            }
          }
        } catch (error) {
          console.warn(
            `Failed to fetch runtime for ${item.title || item.name}:`,
            error
          );
        }
      }

      setRuntimeData(runtimeMap);
      setRuntimeLoading(false);
    };

    fetchRuntimeData();
  }, [allItems]);

  const truncateText = (text, maxLength = 20) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  const formatWatchTime = (minutes) => {
    if (minutes === 0) return "0 min";

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours === 0) return `${mins} min`;
    if (mins === 0) return `${hours} hr`;
    return `${hours} hr ${mins} min`;
  };

  const stats = useMemo(() => {
    if (allItems.length === 0) return null;

    const totalItems = allItems.length;

    const genreCount = {};
    allItems.forEach((item) => {
      if (item.genre_ids) {
        item.genre_ids.forEach((id) => {
          const name = GENRE_ID_TO_NAME[id] || `Genre ${id}`;
          genreCount[name] = (genreCount[name] || 0) + 1;
        });
      }
    });
    const genreData = Object.entries(genreCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([name, value]) => ({ name, value }));

    const ratedItems = allItems.filter((item) => item.vote_average > 0);
    const avgRating =
      ratedItems.length > 0
        ? (
            ratedItems.reduce((sum, item) => sum + item.vote_average, 0) /
            ratedItems.length
          ).toFixed(1)
        : "N/A";

    const yearCount = {};
    allItems.forEach((item) => {
      const year = item.release_date
        ? new Date(item.release_date).getFullYear()
        : item.first_air_date
        ? new Date(item.first_air_date).getFullYear()
        : null;
      if (year && year >= 1900 && year <= new Date().getFullYear() + 5) {
        yearCount[year] = (yearCount[year] || 0) + 1;
      }
    });
    const yearData = Object.entries(yearCount)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .map(([year, count]) => ({ year: parseInt(year), count }));

    const now = new Date();
    const thisWeekStart = new Date(now);
    thisWeekStart.setDate(now.getDate() - now.getDay());
    thisWeekStart.setHours(0, 0, 0, 0);

    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const watchedThisWeek = allItems.filter((item) => {
      if (!item.watchedAt) return false;
      const watchedDate = new Date(item.watchedAt);
      return watchedDate >= thisWeekStart;
    }).length;

    const watchedThisMonth = allItems.filter((item) => {
      if (!item.watchedAt) return false;
      const watchedDate = new Date(item.watchedAt);
      return watchedDate >= thisMonthStart;
    }).length;

    const monthCount = {};
    const yearWatchCount = {};
    allItems.forEach((item) => {
      if (item.watchedAt) {
        const watchedDate = new Date(item.watchedAt);
        const monthKey = `${watchedDate.getFullYear()}-${String(
          watchedDate.getMonth() + 1
        ).padStart(2, "0")}`;
        const yearKey = watchedDate.getFullYear();

        monthCount[monthKey] = (monthCount[monthKey] || 0) + 1;
        yearWatchCount[yearKey] = (yearWatchCount[yearKey] || 0) + 1;
      }
    });

    const monthData = Object.entries(monthCount)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([month, count]) => {
        const [year, monthNum] = month.split("-");
        const monthName = new Date(
          parseInt(year),
          parseInt(monthNum) - 1
        ).toLocaleString("default", { month: "short" });
        return { month: `${monthName} ${year}`, count };
      });

    const yearWatchData = Object.entries(yearWatchCount)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .map(([year, count]) => ({ year: parseInt(year), count }));

    const oldestWatched = allItems
      .filter((item) => item.watchedAt)
      .sort((a, b) => new Date(a.watchedAt) - new Date(b.watchedAt))[0];

    const latestReleased = allItems
      .filter((item) => item.release_date || item.first_air_date)
      .sort((a, b) => {
        const dateA = new Date(a.release_date || a.first_air_date);
        const dateB = new Date(b.release_date || b.first_air_date);
        return dateB - dateA;
      })[0];

    const watchedDates = allItems
      .filter((item) => item.watchedAt)
      .map((item) => new Date(item.watchedAt))
      .sort((a, b) => a - b);

    let avgDaysBetweenWatches = "N/A";
    if (watchedDates.length > 1) {
      const intervals = [];
      for (let i = 1; i < watchedDates.length; i++) {
        const diffTime = watchedDates[i] - watchedDates[i - 1];
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        intervals.push(diffDays);
      }
      const avgInterval =
        intervals.reduce((sum, interval) => sum + interval, 0) /
        intervals.length;
      avgDaysBetweenWatches = avgInterval.toFixed(1);
    }

    const watchedGenreCount = {};
    allItems.forEach((item) => {
      if (item.genre_ids) {
        item.genre_ids.forEach((id) => {
          const name = GENRE_ID_TO_NAME[id] || `Genre ${id}`;
          watchedGenreCount[name] = (watchedGenreCount[name] || 0) + 1;
        });
      }
    });
    const mostWatchedGenre = Object.entries(watchedGenreCount).sort(
      ([, a], [, b]) => b - a
    )[0];

    let currentStreak = 0;
    if (watchedDates.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const uniqueWatchDays = [
        ...new Set(
          watchedDates.map((date) => {
            const d = new Date(date);
            d.setHours(0, 0, 0, 0);
            return d.getTime();
          })
        ),
      ].sort((a, b) => b - a);

      let streakCount = 0;
      let checkDate = new Date(today);

      for (let i = 0; i < uniqueWatchDays.length; i++) {
        const watchDay = new Date(uniqueWatchDays[i]);
        const daysDiff = Math.floor(
          (checkDate - watchDay) / (1000 * 60 * 60 * 24)
        );

        if (daysDiff === 0) {
          streakCount++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else if (daysDiff === 1) {
          streakCount++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }

      currentStreak = streakCount;
    }

    const mostPopular = allItems.reduce(
      (max, item) =>
        (item.popularity || 0) > (max.popularity || 0) ? item : max,
      allItems[0]
    );

    const topRated =
      ratedItems.length > 0
        ? ratedItems.reduce(
            (max, item) =>
              (item.vote_average || 0) > (max.vote_average || 0) ? item : max,
            ratedItems[0]
          )
        : null;

    const totalWatchTime = allItems.reduce((total, item) => {
      const runtimeInfo = runtimeData[item.id];
      if (runtimeInfo) {
        return total + runtimeInfo.runtime;
      }
      return total;
    }, 0);

    const exactTime = allItems.reduce((total, item) => {
      const runtimeInfo = runtimeData[item.id];
      if (runtimeInfo && !runtimeInfo.isEstimated) {
        return total + runtimeInfo.runtime;
      }
      return total;
    }, 0);

    const estimatedTime = allItems.reduce((total, item) => {
      const runtimeInfo = runtimeData[item.id];
      if (runtimeInfo && runtimeInfo.isEstimated) {
        return total + runtimeInfo.runtime;
      }
      return total;
    }, 0);

    return {
      totalItems,
      genreData,
      avgRating,
      yearData,
      mostPopular,
      topRated,
      totalWatchTime,
      exactTime,
      estimatedTime,
      runtimeLoading,
      itemsWithRuntime: Object.keys(runtimeData).length,
      watchedThisWeek,
      watchedThisMonth,
      monthData,
      yearWatchData,
      oldestWatched,
      latestReleased,
      avgDaysBetweenWatches,
      mostWatchedGenre,
      currentStreak,
    };
  }, [allItems, runtimeData]);

  if (!stats) {
    return (
      <div className="statisticsSection">
        <ContentWrapper>
          <div className="sectionHeading">Viewing Statistics</div>
          <p>No data available. Add items to Watched to see your statistics!</p>
        </ContentWrapper>
      </div>
    );
  }

  return (
    <div className="statisticsSection">
      <ContentWrapper>
        <div className="sectionHeading">Statistics</div>
        <div className="statsGrid">
          <div className="statCard">
            <div className="statValue">{stats.totalItems}</div>
            <div className="statLabel">Total Items</div>
          </div>
          <div className="statCard">
            <div className="statValue">
              {stats.runtimeLoading ? (
                <span className="loading">Loading...</span>
              ) : stats.totalWatchTime > 0 ? (
                formatWatchTime(stats.totalWatchTime)
              ) : (
                "N/A"
              )}
            </div>
            <div className="statLabel">
              Total Watch Time
              {stats.estimatedTime > 0 && !stats.runtimeLoading && (
                <span className="estimateNote"> (est.)</span>
              )}
            </div>
          </div>
          <div className="statCard">
            <div className="statValue">{stats.avgRating}</div>
            <div className="statLabel">Avg Rating</div>
          </div>
          <div className="statCard">
            <div className="statValue">{stats.watchedThisWeek}</div>
            <div className="statLabel">Watched This Week</div>
          </div>
          <div className="statCard">
            <div className="statValue">{stats.watchedThisMonth}</div>
            <div className="statLabel">Watched This Month</div>
          </div>
          <div className="statCard">
            <div
              className="statValue"
              title={
                stats.mostPopular?.title || stats.mostPopular?.name || "N/A"
              }
            >
              {truncateText(
                stats.mostPopular?.title || stats.mostPopular?.name || "N/A"
              )}
            </div>
            <div className="statLabel">Most Popular</div>
          </div>
          <div className="statCard">
            <div
              className="statValue"
              title={stats.topRated?.title || stats.topRated?.name || "N/A"}
            >
              {truncateText(
                stats.topRated?.title || stats.topRated?.name || "N/A"
              )}
            </div>
            <div className="statLabel">Top Rated</div>
          </div>
          <div className="statCard">
            <div
              className="statValue"
              title={
                stats.oldestWatched?.title || stats.oldestWatched?.name || "N/A"
              }
            >
              {truncateText(
                stats.oldestWatched?.title || stats.oldestWatched?.name || "N/A"
              )}
            </div>
            <div className="statLabel">First Watched</div>
          </div>
          <div className="statCard">
            <div
              className="statValue"
              title={
                stats.latestReleased?.title ||
                stats.latestReleased?.name ||
                "N/A"
              }
            >
              {truncateText(
                stats.latestReleased?.title ||
                  stats.latestReleased?.name ||
                  "N/A"
              )}
            </div>
            <div className="statLabel">Latest Release</div>
          </div>
          <div className="statCard">
            <div className="statValue">{stats.avgDaysBetweenWatches}</div>
            <div className="statLabel">Avg Days Between Watches</div>
          </div>
          <div className="statCard">
            <div className="statValue">
              {stats.mostWatchedGenre ? stats.mostWatchedGenre[0] : "N/A"}
            </div>
            <div className="statLabel">Most Watched Genre</div>
          </div>
          <div className="statCard">
            <div className="statValue">{stats.currentStreak}</div>
            <div className="statLabel">Current Streak (Days)</div>
          </div>
        </div>

        <div className="chartsGrid">
          {stats.genreData.length > 0 && (
            <div className="chartCard">
              <h3>Genre Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats.genreData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {stats.genreData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {stats.yearData.length > 0 && (
            <div className="chartCard">
              <h3>Release Year Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.yearData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {stats.monthData.length > 0 && (
            <div className="chartCard">
              <h3>Monthly Watching Activity</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.monthData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {stats.yearWatchData.length > 0 && (
            <div className="chartCard">
              <h3>Yearly Watching Activity</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.yearWatchData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#ffc658" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </ContentWrapper>
    </div>
  );
};

export default StatisticsSection;
