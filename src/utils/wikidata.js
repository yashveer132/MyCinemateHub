import axios from "axios";

const WIKIDATA_SPARQL_URL = "https://query.wikidata.org/sparql";


const parseWikidataAwards = (bindings) => {
  return bindings.map((binding, index) => {
    const label = binding.awardLabel?.value || "";
    const type = binding.type?.value || "Won";
    const dateVal = binding.date?.value || "";
    const year = dateVal ? new Date(dateVal).getFullYear() : null;
    const recipient = binding.recipientLabel?.value;

    let awardName = "Film Festival / Critic Award";
    let categoryName = label;

    const lowerLabel = label.toLowerCase();
    if (lowerLabel.includes("academy award") || lowerLabel.includes("oscar")) {
      awardName = "Academy Awards (Oscars)";
      categoryName = label.replace(/Academy Award for\s+/i, "");
    } else if (lowerLabel.includes("golden globe")) {
      awardName = "Golden Globe Awards";
      categoryName = label.replace(/Golden Globe Award for\s+/i, "");
    } else if (lowerLabel.includes("bafta")) {
      awardName = "BAFTA Awards";
      categoryName = label.replace(/BAFTA Award for\s+/i, "");
    } else if (
      lowerLabel.includes("palme d'or") ||
      lowerLabel.includes("cannes")
    ) {
      awardName = "Cannes Film Festival";
      if (lowerLabel === "palme d'or") {
        categoryName = "Palme d'Or (Best Film)";
      }
    } else if (lowerLabel.includes("emmy")) {
      awardName = "Primetime Emmy Awards";
      categoryName = label
        .replace(/Primetime Emmy Award for\s+/i, "")
        .replace(/Emmy Award for\s+/i, "");
    } else if (lowerLabel.includes("grammy")) {
      awardName = "Grammy Awards";
      categoryName = label.replace(/Grammy Award for\s+/i, "");
    } else if (lowerLabel.includes("screen actors guild")) {
      awardName = "Screen Actors Guild (SAG) Awards";
      categoryName = label.replace(/Screen Actors Guild Award for\s+/i, "");
    } else if (lowerLabel.includes("critics' choice")) {
      awardName = "Critics' Choice Awards";
      categoryName = label.replace(
        /Critics' Choice (Movie )?Award for\s+/i,
        "",
      );
    } else if (lowerLabel.includes("sundance")) {
      awardName = "Sundance Film Festival";
    } else if (lowerLabel.includes("national board of review")) {
      awardName = "National Board of Review";
      categoryName = label
        .replace(/National Board of Review Award for\s+/i, "")
        .replace(/National Board of Review\s+/i, "");
    } else if (lowerLabel.includes("los angeles film critics")) {
      awardName = "Los Angeles Film Critics";
      categoryName = label.replace(/Los Angeles Film Critics Association Award for\s+/i, "");
    } else if (lowerLabel.includes("new york film critics")) {
      awardName = "New York Film Critics Circle";
      categoryName = label.replace(/New York Film Critics Circle Award for\s+/i, "");
    } else if (lowerLabel.includes("chicago film critics")) {
      awardName = "Chicago Film Critics Association";
      categoryName = label.replace(/Chicago Film Critics Association Award for\s+/i, "");
    } else if (lowerLabel.includes("london film critics")) {
      awardName = "London Film Critics' Circle";
      categoryName = label.replace(/London Film Critics' Circle Award for\s+/i, "");
    } else if (lowerLabel.includes("venice film festival")) {
      awardName = "Venice Film Festival";
    } else if (lowerLabel.includes("berlin international film festival") || lowerLabel.includes("golden bear") || lowerLabel.includes("silver bear")) {
      awardName = "Berlin Film Festival";
    } else if (lowerLabel.includes("toronto international film festival")) {
      awardName = "Toronto Film Festival";
    }

    if (categoryName) {
      categoryName =
        categoryName.charAt(0).toUpperCase() + categoryName.slice(1);
    }

    return {
      id: `wikidata_${index}_${year || "unknown"}_${type}`,
      award: awardName,
      category: categoryName,
      result: type,
      year: year || "N/A",
      nominees: recipient ? [recipient] : [],
    };
  });
};


export const fetchAwardsFromWikidata = async (imdbId) => {
  if (!imdbId) return [];

  const sparqlQuery = `
    SELECT ?type ?awardLabel ?date ?recipientLabel WHERE {
      ?movie wdt:P345 "${imdbId}" .
      {
        ?movie p:P166 ?statement .
        ?statement ps:P166 ?award .
        BIND("Won" AS ?type)
      } UNION {
        ?movie p:P1411 ?statement .
        ?statement ps:P1411 ?award .
        BIND("Nominated" AS ?type)
      }
      OPTIONAL { ?statement pq:P585 ?date . }
      OPTIONAL { ?statement pq:P381 ?rec1 . }
      OPTIONAL { ?statement pq:P1346 ?rec2 . }
      OPTIONAL { ?statement pq:P382 ?rec3 . }
      BIND(COALESCE(?rec1, ?rec2, ?rec3) AS ?recipient)
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
    }
    ORDER BY DESC(?date)
  `;

  try {
    const response = await axios.get(WIKIDATA_SPARQL_URL, {
      params: {
        query: sparqlQuery,
        format: "json",
      },
      headers: {
        Accept: "application/sparql-results+json",
      },
      timeout: 5000,
    });

    const bindings = response.data?.results?.bindings || [];
    return parseWikidataAwards(bindings);
  } catch (error) {
    console.error("[WIKIDATA] SPARQL query failed:", error);
    return [];
  }
};
