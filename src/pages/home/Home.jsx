import React from "react";
import "./style.scss";
import HeroBanner from "./heroBanner/HeroBanner";
import Trending from "./trending/Trending";
import Popular from "./popular/Popular";
import TopRated from "./topRated/topRated";
import LatestVideos from "./latestVideos/LatestVideos";
import WatchProviders from "./watchProviders/WatchProviders";
import ComingSoon from "./comingSoon/ComingSoon";
import MovieCollections from "./movieCollections/MovieCollections";
import MovieLength from "./movieLength/MovieLength";
import MovieByYear from "./movieByYear/MovieByYear";
import AwardWinners from "./awardWinners/AwardWinners";

const Home = () => {
  return (
    <div className="homePage">
      <HeroBanner />
      <Trending />
      <Popular />
      <AwardWinners />
      <WatchProviders />
      <ComingSoon />
      <MovieCollections />
      <LatestVideos />
      <TopRated />
      <MovieLength />
      <MovieByYear />
    </div>
  );
};

export default Home;
