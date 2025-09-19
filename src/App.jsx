import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { fetchDataFromApi } from "./utils/api";
import { useSelector, useDispatch } from "react-redux";
import { getApiConfiguration, getGenres } from "./store/homeSlice";
import Header from "./components/header/Header";
import Footer from "./components/footer/Footer";
import Home from "./pages/home/Home";
import Details from "./pages/details/Details";
import Person from "./pages/person/Person";
import Explore from "./pages/explore/Explore";
import SearchResult from "./pages/searchResult/SearchResult";
import PageNotFound from "./pages/404/PageNotFound";
import WatchParty from "./components/watchParty/WatchParty";
import WatchPartyLoader from "./components/watchParty/WatchPartyLoader";
import EpisodeDetails from "./pages/details/episodes/EpisodeDetails";
import SearchPeople from "./pages/searchPeople/SearchPeople";
import AIPlaylists from "./pages/aiPlaylists/AIPlaylists";
import TopMovies from "./pages/topMovies/TopMovies";
import TopShows from "./pages/topShows/TopShows";
import Profile from "./pages/profile/Profile";
function App() {
  const dispatch = useDispatch();
  const { url } = useSelector((state) => state.home);

  useEffect(() => {
    fetchApiConfig();
    genresCall();
  }, []);

  const fetchApiConfig = () => {
    fetchDataFromApi("/configuration").then((res) => {
      const url = {
        backdrop: res.images.secure_base_url + "original",
        poster: res.images.secure_base_url + "original",
        profile: res.images.secure_base_url + "original",
      };
      dispatch(getApiConfiguration(url));
    });
  };

  const genresCall = async () => {
    let promises = [];
    let endPoints = ["tv", "movie"];
    let allGenres = {};
    endPoints.forEach((url) => {
      promises.push(fetchDataFromApi(`/genre/${url}/list`));
    });
    const data = await Promise.all(promises);
    data.map(({ genres }) => {
      return genres.map((item) => (allGenres[item.id] = item));
    });
    dispatch(getGenres(allGenres));
  };

  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/:mediaType/:id" element={<Details />} />
        <Route
          path="/tv/:tvId/season/:seasonNumber/episode/:episodeNumber"
          element={<EpisodeDetails />}
        />
        <Route path="/person/:id" element={<Person />} />
        <Route path="/search/:query" element={<SearchResult />} />
        <Route path="/searchPeople" element={<SearchPeople />} />
        <Route path="/searchPeople/:query" element={<SearchPeople />} />
        <Route path="/explore/:mediaType" element={<Explore />} />
        <Route path="/watch/:roomId" element={<WatchPartyLoader />} />
        <Route path="/ai-playlists" element={<AIPlaylists />} />
        <Route path="/top-movies" element={<TopMovies />} />
        <Route path="/top-shows" element={<TopShows />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="*" element={<PageNotFound />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  );
}

export default App;
