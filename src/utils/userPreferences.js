export const getUserStats = (userState) => {
  const { favorites, watchLater, watched } = userState;

  return {
    totalItems: favorites.length + watchLater.length + watched.length,
    favoriteGenres: getMostFrequentGenres(favorites),
    watchTime: estimateWatchTime([...watchLater, ...watched]),
    recentActivity: getRecentActivity(userState),
  };
};

const getMostFrequentGenres = (movies) => {
  const genreCount = {};

  movies.forEach((movie) => {
    if (movie.genre_ids) {
      movie.genre_ids.forEach((genreId) => {
        genreCount[genreId] = (genreCount[genreId] || 0) + 1;
      });
    }
  });

  return Object.entries(genreCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([genreId]) => parseInt(genreId));
};

const estimateWatchTime = (movies) => {
  const totalMinutes = movies.reduce((total, movie) => {
    return total + (movie.media_type === "tv" ? 45 : 120);
  }, 0);

  const hours = Math.floor(totalMinutes / 60);
  return hours;
};

const getRecentActivity = (userState) => {
  const { favorites, watchLater, watched } = userState;
  return [...favorites, ...watchLater, ...watched].slice(-5);
};

export const getEmptyStateConfig = (type) => {
  const configs = {
    favorites: {
      title: "No Favorites Yet",
      description:
        "Start building your collection by adding movies and TV shows to your favorites. Click the heart icon on any movie card to get started!",
      actionText: "Browse Movies",
      actionPath: "/explore/movie",
    },
    watchLater: {
      title: "Watch Later List is Empty",
      description:
        "Save movies and TV shows you want to watch later. Never forget about that interesting title you discovered!",
      actionText: "Discover Movies",
      actionPath: "/explore/movie",
    },
    watched: {
      title: "No Watched Items",
      description:
        "Keep track of what you've watched by marking items as complete. Build your viewing history and discover patterns in your taste!",
      actionText: "Start Watching",
      actionPath: "/",
    },
  };

  return configs[type] || configs.favorites;
};

export const exportUserData = (userState) => {
  const data = {
    exportDate: new Date().toISOString(),
    ...userState,
    stats: getUserStats(userState),
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `cinemate-profile-${
    new Date().toISOString().split("T")[0]
  }.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const importUserData = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);

        if (data.favorites && data.watchLater && data.watched) {
          resolve({
            favorites: data.favorites || [],
            watchLater: data.watchLater || [],
            watched: data.watched || [],
          });
        } else {
          reject(new Error("Invalid file format"));
        }
      } catch (error) {
        reject(new Error("Failed to parse file"));
      }
    };

    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
};
