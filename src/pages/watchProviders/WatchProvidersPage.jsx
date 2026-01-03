import React, { useState, useEffect, useRef } from "react";
import dayjs from "dayjs";
import ContentWrapper from "../../components/contentWrapper/ContentWrapper";
import SwitchTabs from "../../components/switchTabs/SwitchTabs";
import Carousel from "../../components/carousel/Carousel";
import Spinner from "../../components/spinner/Spinner";
import { fetchDataFromApi } from "../../utils/api";
import "./style.scss";

const WatchProvidersPage = () => {
  const [regions, setRegions] = useState([]);
  const [movieProviders, setMovieProviders] = useState([]);
  const [tvProviders, setTvProviders] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState("US");
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [mediaType, setMediaType] = useState("movie");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [providersLoading, setProvidersLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const providersPerPage = 18;
  const resultsRef = useRef(null);

  useEffect(() => {
    const fetchRegions = async () => {
      const regionsRes = await fetchDataFromApi("/watch/providers/regions");
      if (regionsRes?.results) {
        setRegions(regionsRes.results);
      }
    };
    fetchRegions();
  }, []);

  useEffect(() => {
    const fetchProviders = async () => {
      setProvidersLoading(true);
      try {
        const [movieRes, tvRes] = await Promise.all([
          fetchDataFromApi("/watch/providers/movie", {
            watch_region: selectedRegion,
          }),
          fetchDataFromApi("/watch/providers/tv", {
            watch_region: selectedRegion,
          }),
        ]);

        if (movieRes?.results) {
          const sortedMovie =
            selectedRegion !== "US"
              ? [...movieRes.results].sort((a, b) => {
                  const aUs = a.display_priorities?.US || 0;
                  const bUs = b.display_priorities?.US || 0;
                  return bUs - aUs;
                })
              : movieRes.results;
          setMovieProviders(sortedMovie);
        }
        if (tvRes?.results) {
          const sortedTv =
            selectedRegion !== "US"
              ? [...tvRes.results].sort((a, b) => {
                  const aUs = a.display_priorities?.US || 0;
                  const bUs = b.display_priorities?.US || 0;
                  return bUs - aUs;
                })
              : tvRes.results;
          setTvProviders(sortedTv);
        }
      } catch (error) {
        console.error("Error fetching providers:", error);
      }
      setProvidersLoading(false);
    };

    fetchProviders();
  }, [selectedRegion]);

  useEffect(() => {
    if (selectedProvider) {
      fetchContent();
    }
  }, [selectedProvider, selectedRegion, mediaType]);

  const fetchContent = async () => {
    if (!selectedProvider) return;

    setLoading(true);
    console.log(
      "Fetching content for provider:",
      selectedProvider,
      "region:",
      selectedRegion,
      "mediaType:",
      mediaType
    );
    try {
      const today = dayjs().format("YYYY-MM-DD");
      const params = {
        with_watch_providers: selectedProvider,
        watch_region: selectedRegion,
        sort_by: "popularity.desc",
        "vote_average.gte": 6,
        "vote_count.gte": 10,
        page: 1,
      };

      if (mediaType === "movie") {
        params["primary_release_date.lte"] = today;
        params["primary_release_date.gte"] = dayjs()
          .subtract(2, "year")
          .format("YYYY-MM-DD");
      } else {
        params["first_air_date.lte"] = today;
        params["first_air_date.gte"] = dayjs()
          .subtract(2, "year")
          .format("YYYY-MM-DD");
        params.with_status = "0|2|3";
      }

      console.log("API params:", params);
      const response = await fetchDataFromApi(`/discover/${mediaType}`, params);
      console.log("API response:", response);
      const results = (response?.results || []).map((item) => ({
        ...item,
        media_type: mediaType,
      }));

      setData(results);
      console.log("Set data:", results.length, "items");
    } catch (error) {
      console.error("Error fetching content:", error);
      setData([]);
    }
    setLoading(false);
  };

  const onMediaTypeChange = (tab) => {
    setMediaType(tab.toLowerCase());
    setSelectedProvider(null);
    setData([]);
    setCurrentPage(1);
  };

  const onRegionChange = (regionCode) => {
    setSelectedRegion(regionCode);
    setSelectedProvider(null);
    setData([]);
    setCurrentPage(1);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const onProviderSelect = (providerId) => {
    setSelectedProvider(providerId);
    setTimeout(() => {
      if (resultsRef.current) {
        resultsRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }, 100);
  };

  const currentProviders = (
    mediaType === "movie" ? movieProviders : tvProviders
  ).filter((provider) =>
    provider.provider_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(currentProviders.length / providersPerPage);
  const startIndex = (currentPage - 1) * providersPerPage;
  const endIndex = startIndex + providersPerPage;
  const paginatedProviders = currentProviders.slice(startIndex, endIndex);

  const selectedRegionName =
    regions.find((r) => r.iso_3166_1 === selectedRegion)?.english_name ||
    selectedRegion;

  if (providersLoading) {
    return (
      <div className="watchProvidersPage">
        <ContentWrapper>
          <Spinner />
        </ContentWrapper>
      </div>
    );
  }

  return (
    <div className="watchProvidersPage">
      <ContentWrapper>
        <div className="pageHeader">
          <h1>Watch Providers</h1>
          <p>
            Discover movies and TV shows available on your favorite streaming
            services
          </p>
        </div>

        <div className="filtersSection">
          <div className="filterGroup">
            <label>Media Type:</label>
            <SwitchTabs
              data={["Movie", "TV"]}
              onTabChange={onMediaTypeChange}
            />
          </div>

          <div className="filterGroup">
            <label>Region:</label>
            <select
              value={selectedRegion}
              onChange={(e) => onRegionChange(e.target.value)}
              className="regionSelect"
            >
              {regions.map((region) => (
                <option key={region.iso_3166_1} value={region.iso_3166_1}>
                  {region.english_name}
                </option>
              ))}
            </select>
          </div>

          <div className="filterGroup">
            <label>Search:</label>
            <input
              type="text"
              placeholder="Search providers..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="searchInput"
            />
          </div>
        </div>

        <div className="providersSection">
          <h2 className="centeredTitle">
            Select a Provider in {selectedRegionName}
          </h2>
          <div className="providersGrid">
            {paginatedProviders.map((provider) => (
              <div
                key={provider.provider_id}
                className={`providerCard ${
                  selectedProvider === provider.provider_id ? "selected" : ""
                }`}
                onClick={() => onProviderSelect(provider.provider_id)}
              >
                <img
                  src={`https://image.tmdb.org/t/p/original${provider.logo_path}`}
                  alt={provider.provider_name}
                  className="providerLogo"
                />
                <span className="providerName">{provider.provider_name}</span>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="pageBtn"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>

              <span className="pageInfo" style={{ color: "#ffffff" }}>
                Page {currentPage} of {totalPages}
              </span>

              <button
                className="pageBtn"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </div>

        {selectedProvider && (
          <div className="contentSection" ref={resultsRef}>
            <h2>
              {mediaType === "movie" ? "Movies" : "TV Shows"} on{" "}
              {
                currentProviders.find((p) => p.provider_id === selectedProvider)
                  ?.provider_name
              }
            </h2>
            {loading ? (
              <Spinner />
            ) : data.length > 0 ? (
              <Carousel data={data} loading={loading} endpoint={mediaType} />
            ) : (
              <div className="noContent">
                <p>
                  No content found for this provider in the selected region.
                </p>
              </div>
            )}
          </div>
        )}
      </ContentWrapper>
    </div>
  );
};

export default WatchProvidersPage;
