import React from "react";
import { useParams } from "react-router-dom";

import useFetch from "../../hooks/useFetch";
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

const Details = () => {
  const { mediaType, id } = useParams();
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
      <WatchProviders data={watchProviders?.results?.IN} />
      <Cast data={credits?.cast} loading={creditsLoading} />
      <VideosSection data={data} loading={loading} />
      {mediaType === "tv" && (
        <Seasons data={details} loading={detailsLoading} />
      )}
      <TranslationsSection mediaType={mediaType} id={id} />
      {mediaType === "movie" && <ReleaseDatesSection id={id} />}
      {mediaType === "tv" && <ScreenedTheatricallySection id={id} />}
      <Reviews
        data={reviews}
        mediaType={mediaType}
        mediaId={id}
        mediaTitle={details?.title || details?.name}
      />
      <Similar mediaType={mediaType} id={id} />
      <div>
        <Recommendation mediaType={mediaType} id={id} />
      </div>
    </div>
  );
};

export default Details;
