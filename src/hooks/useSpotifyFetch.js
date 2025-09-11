import { useEffect, useState } from "react";
import { fetchSpotifyData } from "../utils/spotify";

const useSpotifyFetch = (endpoint, params = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!endpoint) return;

    setLoading("loading...");
    setData(null);
    setError(null);

    fetchSpotifyData(endpoint, params)
      .then((res) => {
        setLoading(false);
        if (res) {
          setData(res);
          setError(null);
        } else {
          setError("No data received from Spotify API");
        }
      })
      .catch((err) => {
        setLoading(false);
        setError(err.message || "Something went wrong!");
        console.error("useSpotifyFetch error:", err);
      });
  }, [endpoint, JSON.stringify(params)]);

  return { data, loading, error };
};

export default useSpotifyFetch;
