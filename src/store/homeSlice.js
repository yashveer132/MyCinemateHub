import { createSlice } from "@reduxjs/toolkit";

export const homeSlice = createSlice({
  name: "home",
  initialState: {
    url: {},
    genres: {},
    aiSearch: {
      query: "",
      results: null,
    },
  },
  reducers: {
    getApiConfiguration: (state, action) => {
      state.url = action.payload;
    },
    getGenres: (state, action) => {
      state.genres = action.payload;
    },
    setAiSearchQuery: (state, action) => {
      state.aiSearch.query = action.payload;
    },
    setAiSearchResults: (state, action) => {
      state.aiSearch.results = action.payload;
    },
  },
});

export const {
  getApiConfiguration,
  getGenres,
  setAiSearchQuery,
  setAiSearchResults,
} = homeSlice.actions;

export default homeSlice.reducer;
