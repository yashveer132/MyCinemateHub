class PlaylistStorage {
  constructor(storageKey = "cinemate_playlists") {
    this.storageKey = storageKey;
    this.maxPlaylists = 50;
  }

  savePlaylist(name, items, query, mediaType) {
    try {
      if (!name || !name.trim()) {
        throw new Error("Playlist name is required");
      }
      if (!Array.isArray(items) || items.length === 0) {
        throw new Error("Playlist must contain at least one item");
      }

      const playlists = this.getAllPlaylists();
      const playlist = {
        id: Date.now().toString(),
        name: name.trim(),
        items: items,
        query: query || "",
        mediaType: mediaType || "movie",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const existingIndex = playlists.findIndex(
        (p) => p.name === playlist.name
      );
      if (existingIndex >= 0) {
        playlist.id = playlists[existingIndex].id;
        playlist.createdAt = playlists[existingIndex].createdAt;
        playlists[existingIndex] = playlist;
      } else {
        playlists.unshift(playlist);
      }

      if (playlists.length > this.maxPlaylists) {
        playlists.splice(this.maxPlaylists);
      }

      localStorage.setItem(this.storageKey, JSON.stringify(playlists));
      return playlist;
    } catch (error) {
      console.error("Failed to save playlist:", error);
      if (error.message.includes("Playlist")) {
        throw error;
      }
      throw new Error(
        "Unable to save playlist. Storage might be full or unavailable."
      );
    }
  }

  getAllPlaylists() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Failed to load playlists:", error);
      return [];
    }
  }

  getPlaylist(id) {
    const playlists = this.getAllPlaylists();
    return playlists.find((p) => p.id === id) || null;
  }

  deletePlaylist(id) {
    try {
      const playlists = this.getAllPlaylists();
      const filtered = playlists.filter((p) => p.id !== id);
      localStorage.setItem(this.storageKey, JSON.stringify(filtered));
      return true;
    } catch (error) {
      console.error("Failed to delete playlist:", error);
      return false;
    }
  }

  clearAllPlaylists() {
    try {
      localStorage.removeItem(this.storageKey);
      return true;
    } catch (error) {
      console.error("Failed to clear playlists:", error);
      return false;
    }
  }

  getStorageInfo() {
    try {
      const data = localStorage.getItem(this.storageKey);
      const size = data ? new Blob([data]).size : 0;
      return {
        playlistsCount: this.getAllPlaylists().length,
        storageSize: size,
        storageSizeFormatted: this.formatBytes(size),
      };
    } catch (error) {
      return { playlistsCount: 0, storageSize: 0, storageSizeFormatted: "0 B" };
    }
  }

  formatBytes(bytes) {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }
}

export const playlistStorage = new PlaylistStorage();
export default PlaylistStorage;
