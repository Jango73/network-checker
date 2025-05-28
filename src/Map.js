const { useState, useEffect, useRef } = React;

const NetworkMap = ({ connections, isDarkMode }) => {
  const mapContainerRef = useRef(null);
  const imageRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0, imageWidth: 0, imageHeight: 0 });

  // Update dimensions when window resizes or image loads
  useEffect(() => {
    const updateDimensions = () => {
      if (mapContainerRef.current && imageRef.current && imageRef.current.complete) {
        const { width, height } = mapContainerRef.current.getBoundingClientRect();
        const { width: imageWidth, height: imageHeight } = imageRef.current.getBoundingClientRect();
        setDimensions({ width, height, imageWidth, imageHeight });
      }
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    if (imageRef.current) {
      imageRef.current.addEventListener('load', updateDimensions);
    }
    const observer = new ResizeObserver(updateDimensions);
    if (mapContainerRef.current) {
      observer.observe(mapContainerRef.current);
    }
    return () => {
      window.removeEventListener('resize', updateDimensions);
      if (imageRef.current) {
        imageRef.current.removeEventListener('load', updateDimensions);
      }
      observer.disconnect();
    };
  }, []);

  // Cluster connections within 0.5% of map size
  const clusterConnections = () => {
    const clusters = [];
    const processed = new Set();

    // Filter out connections with invalid coordinates
    const validConnections = connections.filter(
      conn => conn.lat != null && conn.lon != null && !isNaN(conn.lat) && !isNaN(conn.lon)
    );

    validConnections.forEach((conn, i) => {
      if (processed.has(i)) return;

      // Mercator projection to percentages
      const x = ((conn.lon + 180) / 360) * 100; // Longitude: -180..180 to 0..100%
      const latRad = (conn.lat * Math.PI) / 180;
      // Simplified Mercator: map latitude -85..85 to 0..100%
      const mercatorY = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
      const maxMercatorY = Math.log(Math.tan(Math.PI / 4 + (85 * Math.PI) / 360));
      const minMercatorY = Math.log(Math.tan(Math.PI / 4 + (-85 * Math.PI) / 360));
      // Invert y to place positive latitudes (north) at y < 50%
      const y = (1 - (mercatorY - minMercatorY) / (maxMercatorY - minMercatorY)) * 100;

      const cluster = { x, y, connections: [conn], isRisky: conn.isRisky };
      processed.add(i);

      validConnections.forEach((otherConn, j) => {
        if (i === j || processed.has(j)) return;
        const x2 = ((otherConn.lon + 180) / 360) * 100;
        const latRad2 = (otherConn.lat * Math.PI) / 180;
        const mercatorY2 = Math.log(Math.tan(Math.PI / 4 + latRad2 / 2));
        const y2 = (1 - (mercatorY2 - minMercatorY) / (maxMercatorY - minMercatorY)) * 100;
        if (Math.hypot(x2 - x, y2 - y) < 0.5) { // 0.5% threshold
          cluster.connections.push(otherConn);
          cluster.isRisky = cluster.isRisky || otherConn.isRisky;
          processed.add(j);
        }
      });

      clusters.push(cluster);
    });

    return clusters;
  };

  const clusters = clusterConnections();

  return (
    <div className={`map-container ${isDarkMode ? 'dark' : ''}`} ref={mapContainerRef}>
      <img src="../res/map.jpg" alt="World Map" ref={imageRef} />
      <div
        className="pin-container"
        style={{
          width: dimensions.imageWidth ? `${dimensions.imageWidth}px` : '100%',
          height: dimensions.imageHeight ? `${dimensions.imageHeight}px` : '100%',
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      >
        {clusters.length > 0 ? (
          clusters.map((cluster, i) => {
            const label = cluster.connections
              .map(c => {
                let msg = `IP: ${c.ip}\nCountry: ${c.country}\nCity: ${c.city || 'N/A'}`;
                if (c.isSuspicious) {
                  msg += `\nAlert: Suspect process (${c.suspicionReason})`;
                }
                return msg;
              })
              .join('\n\n');
            return (
              <div
                key={i}
                className={`pin ${cluster.isRisky || cluster.isSuspicious ? 'risky' : 'safe'}`}
                style={{ left: `${cluster.x}%`, top: `${cluster.y}%` }}
              >
                {cluster.connections.length > 1 && (
                  <span className="pin-count">{cluster.connections.length}</span>
                )}
                <div className="tooltip">{label}</div>
              </div>
            );
          })
        ) : (
          <div className="alert">No valid connections with coordinates to display.</div>
        )}
      </div>
    </div>
  );

};

// Make the component globally available
window.NetworkMap = NetworkMap;