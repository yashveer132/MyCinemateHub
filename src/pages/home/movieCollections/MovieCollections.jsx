import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  BsFillArrowLeftCircleFill,
  BsFillArrowRightCircleFill,
} from "react-icons/bs";
import ContentWrapper from "../../../components/contentWrapper/ContentWrapper";
import Img from "../../../components/lazyLoadImage/Img";
import { fetchDataFromApi } from "../../../utils/api";
import "./style.scss";

const MovieCollections = () => {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(false);
  const { url } = useSelector((state) => state.home);
  const navigate = useNavigate();
  const carouselContainer = useRef();

  const popularCollectionIds = [
    { id: 1241, name: "Harry Potter Collection" },
    { id: 86311, name: "The Avengers Collection" },
    { id: 131295, name: "Captain America Collection" },
    { id: 131292, name: "Iron Man Collection" },
    { id: 131296, name: "Thor Collection" },
    { id: 529, name: "The Lord of the Rings Collection" },
    { id: 121938, name: "The Hobbit Collection" },
    { id: 2344, name: "The Matrix Collection" },
    { id: 645, name: "James Bond Collection" },
    { id: 1575, name: "Star Trek: The Original Series Collection" },
    { id: 9485, name: "The Fast and the Furious Collection" },
    { id: 87359, name: "Mission: Impossible Collection" },
    { id: 8945, name: "Pirates of the Caribbean Collection" },
    { id: 10, name: "Star Wars Collection" },
    { id: 404609, name: "John Wick Collection" },
    { id: 328, name: "Jurassic Park Collection" },
    { id: 535313, name: "Godzilla Collection" },
    { id: 263, name: "The Dark Knight Collection" },
    { id: 556, name: "Spider-Man Collection" },
    { id: 573436, name: "Venom Collection" },
    { id: 125574, name: "DC Extended Universe" },
    { id: 535790, name: "Guardians of the Galaxy Collection" },
    { id: 726871, name: "X-Men Collection" },
    { id: 8091, name: "Alien Collection" },
    { id: 2980, name: "Ghostbusters Collection" },
    { id: 9743, name: "The Hangover Collection" },
    { id: 735, name: "The Godfather Collection" },
    { id: 623, name: "Kung Fu Panda Collection" },
    { id: 137697, name: "Toy Story Collection" },

    { id: 528, name: "The Terminator Collection" },
    { id: 448150, name: "Deadpool Collection" },
    { id: 264, name: "Back to the Future Collection" },
    { id: 84, name: "Indiana Jones Collection" },
    { id: 8528, name: "Mad Max Collection" },
    { id: 8650, name: "Transformers Collection" },
    { id: 31562, name: "The Bourne Collection" },
    { id: 137696, name: "Monsters, Inc. Collection" },
    { id: 468222, name: "The Incredibles Collection" },
    { id: 304, name: "Ocean's Collection" },
    { id: 2150, name: "Shrek Collection" },
    { id: 87118, name: "Cars Collection" },
    { id: 544670, name: "Fantastic Beasts Collection" },
    { id: 295130, name: "Maze Runner Collection" },
    { id: 256322, name: "The Purge Collection" },
    { id: 131635, name: "The Hunger Games Collection" },
    { id: 86066, name: "Despicable Me Collection" },
    { id: 313086, name: "The Conjuring Universe" },
    { id: 8918, name: "Ice Age Collection" },
    { id: 573693, name: "Venom Collection" },

    { id: 100110, name: "Dhoom Collection" },
    { id: 259693, name: "Baahubali Collection" },
    { id: 474386, name: "Krrish Collection" },
    { id: 623642, name: "Dabangg Collection" },
    { id: 434082, name: "Munna Bhai Collection" },
    { id: 508783, name: "Hera Pheri Collection" },
    { id: 623474, name: "Housefull Collection" },
    { id: 436359, name: "Don Collection" },
    { id: 653880, name: "Stree Collection" },
  ];

  useEffect(() => {
    const fetchCollections = async () => {
      setLoading(true);

      try {
        const collectionPromises = popularCollectionIds.map(
          async (collection) => {
            try {
              const data = await fetchDataFromApi(
                `/collection/${collection.id}`
              );
              if (data && data.parts && data.parts.length > 0) {
              } else {
              }
              return data;
            } catch (err) {
              console.error(`❌ Error fetching ${collection.name}:`, err);
              return null;
            }
          }
        );

        const results = await Promise.all(collectionPromises);

        const validCollections = results.filter(
          (item) => item && item.parts && item.parts.length > 0
        );

        const sortedCollections = validCollections.sort(
          (a, b) => b.parts.length - a.parts.length
        );

        setCollections(sortedCollections);
      } catch (error) {
        console.error("❌ Error fetching collections:", error);
        setCollections([]);
      }
      setLoading(false);
    };

    fetchCollections();
  }, []);

  const handleCollectionClick = (collectionId) => {
    navigate(`/collection/${collectionId}`);
  };

  const navigation = (dir) => {
    const container = carouselContainer.current;
    const scrollAmount =
      dir === "left"
        ? container.scrollLeft - (container.offsetWidth + 20)
        : container.scrollLeft + (container.offsetWidth + 20);

    container.scrollTo({
      left: scrollAmount,
      behavior: "smooth",
    });
  };

  const skeleton = () => {
    return (
      <div className="skeletonItem">
        <div className="posterBlock skeleton"></div>
        <div className="textBlock">
          <div className="title skeleton"></div>
          <div className="subtitle skeleton"></div>
        </div>
      </div>
    );
  };

  return (
    <div className="carousel movieCollectionsSection">
      <ContentWrapper>
        <span className="carouselTitle">Popular Movie Collections</span>
        {collections?.length > 0 && !loading && (
          <>
            <BsFillArrowLeftCircleFill
              className="carouselLeftNav arrow"
              onClick={() => navigation("left")}
            />
            <BsFillArrowRightCircleFill
              className="carouselRighttNav arrow"
              onClick={() => navigation("right")}
            />
          </>
        )}

        {!loading ? (
          <div className="collectionsCarousel" ref={carouselContainer}>
            {collections.map((collection) => (
              <div
                key={collection.id}
                className="collectionCard"
                onClick={() => handleCollectionClick(collection.id)}
              >
                <div className="posterBlock">
                  {collection.poster_path ? (
                    <Img src={url.poster + collection.poster_path} />
                  ) : collection.backdrop_path ? (
                    <Img src={url.backdrop + collection.backdrop_path} />
                  ) : (
                    <div className="noImage">
                      <span>No Image</span>
                    </div>
                  )}
                  <div className="overlay">
                    <div className="viewDetails">View Collection</div>
                  </div>
                </div>
                <div className="textBlock">
                  <div className="title">{collection.name}</div>
                  <div className="movieCount">
                    {collection.parts.length}{" "}
                    {collection.parts.length === 1 ? "Movie" : "Movies"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="loadingSkeleton">
            {skeleton()}
            {skeleton()}
            {skeleton()}
            {skeleton()}
            {skeleton()}
            {skeleton()}
          </div>
        )}
      </ContentWrapper>
    </div>
  );
};

export default MovieCollections;
