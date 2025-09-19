import React, { useState } from "react";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  FaHeart,
  FaRegHeart,
  FaBookmark,
  FaRegBookmark,
  FaCheck,
  FaUndo,
} from "react-icons/fa";

import "./style.scss";
import Img from "../lazyLoadImage/Img";
import CircleRating from "../circleRating/CircleRating";
import Genres from "../genres/Genres";
import PosterFallback from "../../assets/no-poster.png";
import {
  addToFavorites,
  removeFromFavorites,
  addToWatchLater,
  removeFromWatchLater,
  addToWatched,
  removeFromWatched,
  moveToWatchLater,
} from "../../store/userSlice";

const MovieCard = ({ data, fromSearch, mediaType }) => {
  const { url } = useSelector((state) => state.home);
  const { favorites, watchLater, watched } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showActions, setShowActions] = useState(false);

  const posterUrl = data.poster_path
    ? url.poster + data.poster_path
    : PosterFallback;

  const movieData = {
    id: data.id,
    title: data.title || data.name,
    poster_path: data.poster_path,
    release_date: data.release_date || data.first_air_date,
    vote_average: data.vote_average,
    genre_ids: data.genre_ids,
    media_type: data.media_type || mediaType || "movie",
  };

  const isFavorite = favorites.some((item) => item.id === data.id);
  const isInWatchLater = watchLater.some((item) => item.id === data.id);
  const isWatched = watched.some((item) => item.id === data.id);

  const handleClick = () => {
    const type = data.media_type || mediaType || "movie";
    navigate(`/${type}/${data.id}`);
  };

  const handleActionClick = (e, action) => {
    e.stopPropagation();
    action();
  };

  const toggleFavorite = () => {
    if (isFavorite) {
      dispatch(removeFromFavorites(data.id));
    } else {
      dispatch(addToFavorites(movieData));
    }
  };

  const toggleWatchLater = () => {
    if (isInWatchLater) {
      dispatch(removeFromWatchLater(data.id));
    } else {
      dispatch(addToWatchLater(movieData));
    }
  };

  const toggleWatched = () => {
    if (isWatched) {
      dispatch(removeFromWatched(data.id));
    } else {
      dispatch(addToWatched(movieData));
    }
  };

  const moveToWatchLaterAction = () => {
    dispatch(moveToWatchLater(movieData));
  };

  return (
    <div
      className="movieCard"
      onClick={handleClick}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="posterBlock">
        <Img className="posterImg" src={posterUrl} />

        <div className={`actionButtons ${showActions ? "show" : ""}`}>
          <button
            className={`actionBtn favoriteBtn ${isFavorite ? "active" : ""}`}
            onClick={(e) => handleActionClick(e, toggleFavorite)}
            title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
          >
            {isFavorite ? <FaHeart /> : <FaRegHeart />}
          </button>

          <button
            className={`actionBtn watchLaterBtn ${
              isInWatchLater ? "active" : ""
            }`}
            onClick={(e) => handleActionClick(e, toggleWatchLater)}
            title={
              isInWatchLater ? "Remove from Watch Later" : "Add to Watch Later"
            }
          >
            {isInWatchLater ? <FaBookmark /> : <FaRegBookmark />}
          </button>

          <button
            className={`actionBtn watchedBtn ${isWatched ? "active" : ""}`}
            onClick={(e) =>
              handleActionClick(
                e,
                isWatched ? moveToWatchLaterAction : toggleWatched
              )
            }
            title={isWatched ? "Move to Watch Later" : "Mark as Watched"}
          >
            {isWatched ? <FaUndo /> : <FaCheck />}
          </button>
        </div>

        {!fromSearch && (
          <React.Fragment>
            <CircleRating rating={(data.vote_average || 0).toFixed(1)} />
            <Genres data={data.genre_ids?.slice(0, 2) || []} />
          </React.Fragment>
        )}
      </div>
      <div className="textBlock">
        <span className="title">{data.title || data.name}</span>
        <span className="date">
          {dayjs(data.release_date || data.first_air_date).format(
            "MMM D, YYYY"
          )}
        </span>
      </div>
    </div>
  );
};

export default MovieCard;
