import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchDataFromApi } from "../../utils/api";
import WatchParty from "./WatchParty";
import Spinner from "../spinner/Spinner";

const WatchPartyLoader = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    const loadWatchParty = async () => {
      try {
        if (!roomId) {
          navigate("/");
          return;
        }

        const [movieId, videoId] = roomId.split("-");

        if (!movieId || !videoId) {
          navigate("/");
          return;
        }

        const movieData = await fetchDataFromApi(`/movie/${movieId}`);
        if (!movieData) {
          navigate("/");
          return;
        }

        setData({ movieData, videoId });
        setLoading(false);
      } catch (error) {
        navigate("/");
      }
    };

    loadWatchParty();
  }, [roomId, navigate]);

  if (loading) return <Spinner initial={true} />;

  return data ? (
    <WatchParty
      videoId={data.videoId}
      movieData={data.movieData}
      onClose={() => navigate("/")}
    />
  ) : null;
};

export default WatchPartyLoader;
