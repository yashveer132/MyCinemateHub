import React, { useRef } from "react";
import { useParams } from "react-router-dom";

import useFetch from "../../hooks/useFetch";
import DetailsBanner from "./detailsBanner/DetailsBanner";
import Cast from "./cast/Cast";
import VideosSection from "./videosSection/VideosSection";
import Similar from "./carousels/Similar";
import Recommendation from "./carousels/Recommendation";
import WatchProviders from "./watchProviders/WatchProviders";
import Collections from "../../components/collections/Collections";
import Reviews from "../../components/reviews/Reviews";

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
  const { data: collection } = useFetch(
    data?.belongs_to_collection?.id
      ? `/collection/${data.belongs_to_collection.id}`
      : null
  );
  const recommendationsRef = useRef(null);

  return (
    <div>
      <DetailsBanner
        video={data?.results?.[0]}
        crew={credits?.crew}
        recommendationsRef={recommendationsRef}
      />
      <WatchProviders data={watchProviders?.results?.IN} />
      <Cast data={credits?.cast} loading={creditsLoading} />
      <VideosSection data={data} loading={loading} />
      {collection && <Collections data={[collection]} loading={loading} />}
      <Reviews data={reviews} />
      <Similar mediaType={mediaType} id={id} />
      <div ref={recommendationsRef}>
        <Recommendation mediaType={mediaType} id={id} />
      </div>
    </div>
  );
};

export default Details;
