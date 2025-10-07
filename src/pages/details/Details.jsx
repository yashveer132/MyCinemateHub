import React from "react";
import { useParams, useNavigate } from "react-router-dom";

import useFetch from "../../hooks/useFetch";
import ContentWrapper from "../../components/contentWrapper/ContentWrapper";
import DetailsBanner from "./detailsBanner/DetailsBanner";
import Cast from "./cast/Cast";
import VideosSection from "./videosSection/VideosSection";
import Similar from "./carousels/Similar";
import Recommendation from "./carousels/Recommendation";
import WatchProviders from "./watchProviders/WatchProviders";
import Reviews from "../../components/reviews/EnhancedReviews";
import Seasons from "./seasons/Seasons";
import TranslationsSection from "./translationsSection/TranslationsSection";
import ReleaseDatesSection from "./releaseDatesSection/ReleaseDatesSection";
import ScreenedTheatricallySection from "./screenedTheatricallySection/ScreenedTheatricallySection";
import SongsSection from "./songsSection/SongsSection";
import ProductionInsights from "./productionInsights/ProductionInsights";
import ChartsSection from "./chartsSection/ChartsSection";
import TriviaSection from "./triviaSection/TriviaSection";
import MemorableQuotesSection from "./memorableQuotesSection/MemorableQuotesSection";
import AwardsSection from "./awardsSection/AwardsSection";

const Details = () => {
  const { mediaType, id } = useParams();
  const navigate = useNavigate();
  const { data, loading } = useFetch(`/${mediaType}/${id}/videos`);
  const { data: credits, loading: creditsLoading } = useFetch(
    `/${mediaType}/${id}/credits`
  );
  const { data: watchProviders } = useFetch(
    `/${mediaType}/${id}/watch/providers`
  );
  const { data: reviews } = useFetch(`/${mediaType}/${id}/reviews`);
  const { data: details, loading: detailsLoading } = useFetch(
    `/${mediaType}/${id}`
  );

  return (
    <div>
      <DetailsBanner video={data?.results?.[0]} crew={credits?.crew} />
      {mediaType === "movie" && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            margin: "20px 0",
          }}
        >
          <button
            style={{
              padding: "12px 24px",
              background: "var(--pink)",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "1rem",
              fontWeight: "bold",
              transition: "background 0.3s",
            }}
            onClick={() => navigate(`/compare?movie1=${id}`)}
            onMouseOver={(e) =>
              (e.target.style.background = "var(--pink-hover)")
            }
            onMouseOut={(e) => (e.target.style.background = "var(--pink)")}
          >
            Compare Movie
          </button>
        </div>
      )}
      <WatchProviders data={watchProviders?.results?.IN} />
      <Cast data={credits?.cast} loading={creditsLoading} />
      <ChartsSection data={details} mediaType={mediaType} />
      <VideosSection data={data} loading={loading} />
      <Reviews
        data={reviews}
        mediaType={mediaType}
        mediaId={id}
        mediaTitle={details?.title || details?.name}
        overview={details?.overview}
      />
      <SongsSection mediaTitle={details?.title || details?.name} />
      {mediaType === "tv" && (
        <Seasons data={details} loading={detailsLoading} />
      )}
      <TranslationsSection mediaType={mediaType} id={id} />
      <ProductionInsights data={details} loading={detailsLoading} />
      <AwardsSection movieDetails={details} mediaType={mediaType} />
      <TriviaSection movieDetails={details} mediaType={mediaType} />
      {mediaType === "tv" && <ScreenedTheatricallySection id={id} />}
      {mediaType === "movie" && <ReleaseDatesSection id={id} />}
      <MemorableQuotesSection movieDetails={details} />
      <Similar mediaType={mediaType} id={id} />
      <div>
        <Recommendation mediaType={mediaType} id={id} />
      </div>
    </div>
  );
};

export default Details;
