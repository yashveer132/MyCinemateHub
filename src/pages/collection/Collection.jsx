import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import dayjs from "dayjs";
import ContentWrapper from "../../components/contentWrapper/ContentWrapper";
import Img from "../../components/lazyLoadImage/Img";
import Carousel from "../../components/carousel/Carousel";
import { fetchDataFromApi } from "../../utils/api";
import "./style.scss";

const Collection = () => {
  const { id } = useParams();
  const [collection, setCollection] = useState(null);
  const [loading, setLoading] = useState(true);
  const { url } = useSelector((state) => state.home);

  useEffect(() => {
    fetchCollection();
  }, [id]);

  const fetchCollection = async () => {
    setLoading(true);
    try {
      const data = await fetchDataFromApi(`/collection/${id}`);
      if (data && data.parts) {
        data.parts = data.parts.map((movie) => ({
          ...movie,
          media_type: "movie",
        }));
      }
      setCollection(data);
    } catch (error) {
      console.error("Error fetching collection:", error);
    }
    setLoading(false);
  };

  const handleMovieClick = (movieId) => {
    navigate(`/movie/${movieId}`);
  };

  if (loading) {
    return (
      <div className="collectionPage">
        <div className="collectionHeader skeleton"></div>
        <ContentWrapper>
          <div className="carouselSection">
            <Carousel data={[]} loading={true} endpoint="movie" />
          </div>
        </ContentWrapper>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="collectionPage">
        <ContentWrapper>
          <div className="errorMessage">Collection not found</div>
        </ContentWrapper>
      </div>
    );
  }

  return (
    <div className="collectionPage">
      <div className="collectionHeader">
        <div className="backdropImg">
          {collection.backdrop_path && (
            <Img src={url.backdrop + collection.backdrop_path} />
          )}
          <div className="opacity-layer"></div>
        </div>
        <ContentWrapper>
          <div className="headerContent">
            {collection.poster_path && (
              <div className="posterBlock">
                <Img src={url.poster + collection.poster_path} />
              </div>
            )}
            <div className="detailsBlock">
              <h1 className="collectionTitle">{collection.name}</h1>
              {collection.overview && (
                <p className="collectionOverview">{collection.overview}</p>
              )}
              <div className="collectionInfo">
                <div className="infoItem">
                  <span className="label">Total Movies:</span>
                  <span className="value">{collection.parts?.length || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </ContentWrapper>
      </div>

      <div className="carouselSection">
        <Carousel
          data={collection.parts?.sort((a, b) => {
            const dateA = a.release_date
              ? dayjs(a.release_date)
              : dayjs("9999-12-31");
            const dateB = b.release_date
              ? dayjs(b.release_date)
              : dayjs("9999-12-31");
            return dateA.diff(dateB);
          })}
          loading={loading}
          endpoint="movie"
          title="All Movies in Collection"
        />
      </div>
    </div>
  );
};

export default Collection;
