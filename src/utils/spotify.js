import axios from "axios";

const SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET;
const SPOTIFY_BASE_URL = "https://api.spotify.com/v1";

let accessToken = null;
let tokenExpiry = null;

const getSpotifyAccessToken = async () => {
  if (accessToken && tokenExpiry && Date.now() < tokenExpiry) {
    return accessToken;
  }

  try {
    const auth = btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`);

    const response = await axios.post(
      "https://accounts.spotify.com/api/token",
      "grant_type=client_credentials",
      {
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    accessToken = response.data.access_token;
    tokenExpiry = Date.now() + (response.data.expires_in - 60) * 1000; // Refresh 1 min early

    return accessToken;
  } catch (error) {
    console.error(
      "Error getting Spotify access token:",
      error.response?.data || error.message
    );
    return null;
  }
};

export const fetchSpotifyData = async (endpoint, params = {}) => {
  try {
    const token = await getSpotifyAccessToken();
    if (!token) return null;

    const response = await axios.get(`${SPOTIFY_BASE_URL}${endpoint}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params,
    });

    return response.data;
  } catch (error) {
    console.error(
      `Error fetching Spotify data for ${endpoint}:`,
      error.response?.data || error.message
    );
    return null;
  }
};
