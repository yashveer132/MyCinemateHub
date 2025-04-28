import { useEffect, useState, useCallback } from "react";
import Peer from "peerjs";

export const usePeerJS = (roomId) => {
  const [peer, setPeer] = useState(null);
  const [connections, setConnections] = useState(new Set());
  const [userCount, setUserCount] = useState(1);
  const [isHost, setIsHost] = useState(false);

  useEffect(() => {
    const peer = new Peer(roomId, {
      host: "peerjs-server.herokuapp.com",
      secure: true,
    });

    peer.on("open", (id) => {
      setPeer(peer);
      setIsHost(true);

      const urlParams = new URLSearchParams(window.location.search);
      const hostId = urlParams.get("host");

      if (hostId && hostId !== id) {
        setIsHost(false);
        const conn = peer.connect(hostId);
        handleNewConnection(conn);
      }
    });

    peer.on("connection", handleNewConnection);

    return () => {
      connections.forEach((conn) => conn.close());
      peer.destroy();
    };
  }, [roomId]);

  const handleNewConnection = useCallback((conn) => {
    conn.on("open", () => {
      setConnections((prev) => new Set([...prev, conn]));
      setUserCount((prev) => prev + 1);
    });

    conn.on("close", () => {
      setConnections((prev) => {
        const next = new Set(prev);
        next.delete(conn);
        return next;
      });
      setUserCount((prev) => prev - 1);
    });
  }, []);

  const broadcast = useCallback(
    (type, data) => {
      connections.forEach((conn) => {
        conn.send({ type, data });
      });
    },
    [connections]
  );

  return { peer, connections, userCount, isHost, broadcast };
};
