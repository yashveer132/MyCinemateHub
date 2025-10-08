import { createSlice } from "@reduxjs/toolkit";

const saveToLocalStorage = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
  }
};

const loadFromLocalStorage = (key, defaultValue = []) => {
  try {
    const item = localStorage.getItem(key);
    if (!item) return defaultValue;

    const parsed = JSON.parse(item);

    if (key === "cinemate_watched" && Array.isArray(parsed)) {
      const migrated = parsed.map((item) => {
        if (!item.watchedAt) {
          return {
            ...item,
            watchedAt: new Date().toISOString(),
          };
        }
        return item;
      });
      localStorage.setItem(key, JSON.stringify(migrated));
      return migrated;
    }

    return parsed;
  } catch (error) {
    console.error(`Error loading ${key} from localStorage:`, error);
    return defaultValue;
  }
};

const initialState = {
  favorites: loadFromLocalStorage("cinemate_favorites", []),
  watchLater: loadFromLocalStorage("cinemate_watchLater", []),
  watched: loadFromLocalStorage("cinemate_watched", []),
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    addToFavorites: (state, action) => {
      const movie = action.payload;
      const exists = state.favorites.find((item) => item.id === movie.id);
      if (!exists) {
        state.favorites.push(movie);
        saveToLocalStorage("cinemate_favorites", state.favorites);
      }
    },
    removeFromFavorites: (state, action) => {
      const movieId = action.payload;
      state.favorites = state.favorites.filter((item) => item.id !== movieId);
      saveToLocalStorage("cinemate_favorites", state.favorites);
    },

    addToWatchLater: (state, action) => {
      const movie = action.payload;
      const exists = state.watchLater.find((item) => item.id === movie.id);
      if (!exists) {
        state.watchLater.push(movie);
        saveToLocalStorage("cinemate_watchLater", state.watchLater);
      }
    },
    removeFromWatchLater: (state, action) => {
      const movieId = action.payload;
      state.watchLater = state.watchLater.filter((item) => item.id !== movieId);
      saveToLocalStorage("cinemate_watchLater", state.watchLater);
    },

    addToWatched: (state, action) => {
      const { movie, review } = action.payload;
      const exists = state.watched.find((item) => item.id === movie.id);
      if (!exists) {
        const watchedItem = {
          ...movie,
          watchedAt: new Date().toISOString(),
          review: review || null,
        };
        state.watched.push(watchedItem);
        saveToLocalStorage("cinemate_watched", state.watched);

        state.watchLater = state.watchLater.filter(
          (item) => item.id !== movie.id
        );
        saveToLocalStorage("cinemate_watchLater", state.watchLater);
      }
    },
    updateWatchedReview: (state, action) => {
      const { movieId, review } = action.payload;
      const item = state.watched.find((item) => item.id === movieId);
      if (item) {
        item.review = review;
        saveToLocalStorage("cinemate_watched", state.watched);
      }
    },
    removeFromWatched: (state, action) => {
      const movieId = action.payload;
      state.watched = state.watched.filter((item) => item.id !== movieId);
      saveToLocalStorage("cinemate_watched", state.watched);
    },

    clearAllPreferences: (state) => {
      state.favorites = [];
      state.watchLater = [];
      state.watched = [];
      localStorage.removeItem("cinemate_favorites");
      localStorage.removeItem("cinemate_watchLater");
      localStorage.removeItem("cinemate_watched");
    },

    moveToWatchLater: (state, action) => {
      const movie = action.payload;

      state.watched = state.watched.filter((item) => item.id !== movie.id);
      saveToLocalStorage("cinemate_watched", state.watched);

      const exists = state.watchLater.find((item) => item.id === movie.id);
      if (!exists) {
        state.watchLater.push(movie);
        saveToLocalStorage("cinemate_watchLater", state.watchLater);
      }
    },
  },
});

export const {
  addToFavorites,
  removeFromFavorites,
  addToWatchLater,
  removeFromWatchLater,
  addToWatched,
  updateWatchedReview,
  removeFromWatched,
  clearAllPreferences,
  moveToWatchLater,
} = userSlice.actions;

export default userSlice.reducer;
