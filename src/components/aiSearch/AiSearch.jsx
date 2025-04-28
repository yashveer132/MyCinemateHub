import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./style.scss";
import { extractSearchParams } from "../../utils/gemini";
import { fetchDataFromApi } from "../../utils/api";
import ContentWrapper from "../contentWrapper/ContentWrapper";
import Spinner from "../spinner/Spinner";

const AiSearch = () => {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSearch = async () => {
    if (!query) return;

    setLoading(true);
    const params = await extractSearchParams(query);

    if (!params) {
      setLoading(false);
      return;
    }

    const apiQuery = {
      with_genres: params.genres.join(","),
      sort_by: params.sort + ".desc",
      ...(params.year && {
        primary_release_date_gte: `${params.year.start}-01-01`,
        primary_release_date_lte: `${params.year.end}-12-31`,
      }),
      with_keywords: params.keywords.join(","),
    };

    navigate(`/ai-search/results`, {
      state: {
        naturalQuery: query,
        params: apiQuery,
        mediaType: params.mediaType,
      },
    });

    setLoading(false);
  };

  return (
    <div className="aiSearch">
      <ContentWrapper>
        <div className="searchInput">
          <input
            type="text"
            placeholder="Try: 'Show me sci-fi thrillers about space'"
            onChange={(e) => setQuery(e.target.value)}
            onKeyUp={(e) => e.key === "Enter" && handleSearch()}
          />
          <button onClick={handleSearch}>
            {loading ? <Spinner /> : "Search"}
          </button>
        </div>
      </ContentWrapper>
    </div>
  );
};

export default AiSearch;
