import { useEffect, useRef } from 'react';
import { useI18n } from '@renderer/hooks/useI18n';
import { useStore } from '@renderer/store';
import styles from './MapPage.module.css';
import mapImage from '@assets/map.jpg';

interface MapConnection {
  ip: string;
  lat: number;
  lon: number;
  country: string;
  city: string;
  pid: number;
  protocol: string;
  isRisky: boolean;
  suspicionReason: string;
  count?: number;
}

// Structure for canvas coordinates
interface CanvasCoordinates {
  x: number;
  y: number;
}

// Utility functions
const transformToMapCoordinates = (
  lat: number,
  lon: number
): CanvasCoordinates => {
  const x = ((lon + 180) / 360) * 100; // Longitude: -180..180 to 0..100%
  const latRad = (lat * Math.PI) / 180;
  const mercatorY = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
  const maxMercatorY = Math.log(Math.tan(Math.PI / 4 + (85 * Math.PI) / 360));
  const minMercatorY = Math.log(Math.tan(Math.PI / 4 + (-85 * Math.PI) / 360));
  const y =
    (1 - (mercatorY - minMercatorY) / (maxMercatorY - minMercatorY)) * 100;
  return { x, y };
};

const clusterConnections = (
  connections: MapConnection[],
  canvasWidth: number,
  canvasHeight: number
): MapConnection[] => {
  const clustered: MapConnection[] = [];
  const pixelThreshold = 10;

  for (const conn of connections) {
    const { x: xPercent, y: yPercent } = transformToMapCoordinates(
      conn.lat,
      conn.lon
    );
    const x = (xPercent / 100) * canvasWidth;
    const y = (yPercent / 100) * canvasHeight;

    let added = false;
    for (const cluster of clustered) {
      const { x: clusterXPercent, y: clusterYPercent } =
        transformToMapCoordinates(cluster.lat, cluster.lon);
      const clusterX = (clusterXPercent / 100) * canvasWidth;
      const clusterY = (clusterYPercent / 100) * canvasHeight;
      const distance = Math.sqrt((x - clusterX) ** 2 + (y - clusterY) ** 2);
      if (distance < pixelThreshold) {
        cluster.ip += `, ${conn.ip}`; // Aggregate IPs
        cluster.count = (cluster.count || 1) + 1;
        added = true;
        break;
      }
    }
    if (!added) {
      clustered.push({ ...conn, count: 1 });
    }
  }
  return clustered;
};

export default function MapPage() {
  const { t } = useI18n();
  const { connections, scanResults } = useStore();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  /**
   * Draw connections on the canvas.
   */
  const drawMap = (connections: MapConnection[]) => {
    if (!canvasRef.current || !mapContainerRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.src = mapImage;
    img.onload = () => {
      const containerWidth = mapContainerRef.current!.clientWidth;
      const containerHeight = mapContainerRef.current!.clientHeight;
      const imgAspectRatio = img.width / img.height;
      const containerRatio = containerWidth / containerHeight;

      if (containerRatio > imgAspectRatio) {
        canvas.height = containerHeight;
        canvas.width = containerHeight * imgAspectRatio;
      } else {
        canvas.width = containerWidth;
        canvas.height = containerWidth / imgAspectRatio;
      }

      canvas.style.width = `${canvas.width}px`;
      canvas.style.height = `${canvas.height}px`;

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const clustered = clusterConnections(
        connections,
        canvas.width,
        canvas.height
      );
      clustered.forEach(conn => {
        const { x: xPercent, y: yPercent } = transformToMapCoordinates(
          conn.lat,
          conn.lon
        );
        const x = (xPercent / 100) * canvas.width;
        const y = (yPercent / 100) * canvas.height;

        // Draw pin
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, 2 * Math.PI);
        ctx.fillStyle = conn.isRisky ? 'red' : 'green';
        ctx.fill();
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Pulsing effect for risky pins
        if (conn.isRisky) {
          ctx.beginPath();
          ctx.arc(x, y, 12 + Math.sin(Date.now() / 500) * 2, 0, 2 * Math.PI);
          ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
          ctx.stroke();
        }

        // Draw cluster count
        if (conn.count && conn.count > 1) {
          ctx.fillStyle = 'white';
          ctx.font = '12px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(conn.count.toString(), x, y);
        }
      });
    };
  };

  /**
   * Handle mouse move to show tooltip.
   */
  const handleMouseMove = (e: MouseEvent) => {
    if (!canvasRef.current || !tooltipRef.current || !mapContainerRef.current) {
      console.warn('Missing canvas, tooltip, or container references');
      return;
    }

    const container = mapContainerRef.current;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const connectionsWithGeo: MapConnection[] = connections
      .map((conn, i) => ({
        ip: conn.remoteAddress,
        lat: scanResults[i]?.lat || 0,
        lon: scanResults[i]?.lon || 0,
        country: scanResults[i]?.country || '',
        city: scanResults[i]?.city || '',
        pid: conn.pid,
        protocol: conn.protocol,
        isRisky: scanResults[i]?.isRisky || false,
        suspicionReason: scanResults[i]?.suspicionReason || '',
      }))
      .filter(conn => conn.lat !== 0 && conn.lon !== 0);

    const clustered = clusterConnections(
      connectionsWithGeo,
      canvas.width,
      canvas.height
    );

    let tooltipContent = '';
    let nearestConn: MapConnection | null = null;
    let minDistance = Infinity;

    for (const conn of clustered) {
      const { x: xPercent, y: yPercent } = transformToMapCoordinates(
        conn.lat,
        conn.lon
      );
      const x = (xPercent / 100) * canvas.width;
      const y = (yPercent / 100) * canvas.height;
      const distance = Math.sqrt((mouseX - x) ** 2 + (mouseY - y) ** 2);
      if (distance < 10 && distance < minDistance) {
        minDistance = distance;
        nearestConn = conn;
      }
    }

    if (nearestConn) {
      tooltipContent = `
        <b>${t('ip')}:</b> ${nearestConn.ip}<br>
        <b>${t('country')}:</b> ${nearestConn.country}<br>
        <b>${t('city')}:</b> ${nearestConn.city}<br>
        ${nearestConn.isRisky ? `<b>${t('reason')}:</b> ${nearestConn.suspicionReason}` : ''}
      `;
      tooltipRef.current.innerHTML = tooltipContent;
      tooltipRef.current.style.display = 'block';

      // Position tooltip relative to canvas
      const tooltipWidth = tooltipRef.current.offsetWidth;
      const tooltipHeight = tooltipRef.current.offsetHeight;
      let tooltipX = e.clientX + 15;
      let tooltipY = e.clientY - tooltipHeight - 10;

      // Keep tooltip within canvas bounds
      if (tooltipX + tooltipWidth > canvas.width) {
        tooltipX = canvas.width - tooltipWidth - 5;
      }
      if (tooltipX < 0) {
        tooltipX = 5;
      }
      if (tooltipY < 0) {
        tooltipY = e.clientX + 10; // Below cursor if above top
      }
      if (tooltipY + tooltipHeight > canvas.height) {
        tooltipY = canvas.height - tooltipHeight - 5;
      }

      tooltipRef.current.style.left = `${tooltipX}px`;
      tooltipRef.current.style.top = `${tooltipY}px`;
    } else {
      tooltipRef.current.style.display = 'none';
    }
  };

  /**
   * Handle window resize to update canvas size.
   */
  const handleResize = () => {
    const connectionsWithGeo: MapConnection[] = connections
      .map((conn, i) => ({
        ip: conn.remoteAddress,
        lat: scanResults[i]?.lat || 0,
        lon: scanResults[i]?.lon || 0,
        country: scanResults[i]?.country || '',
        city: scanResults[i]?.city || '',
        pid: conn.pid,
        protocol: conn.protocol,
        isRisky: scanResults[i]?.isRisky || false,
        suspicionReason: scanResults[i]?.suspicionReason || '',
      }))
      .filter(conn => conn.lat !== 0 && conn.lon !== 0);
    drawMap(connectionsWithGeo);
  };

  useEffect(() => {
    const connectionsWithGeo: MapConnection[] = connections
      .map((conn, i) => ({
        ip: conn.remoteAddress,
        lat: scanResults[i]?.lat || 0,
        lon: scanResults[i]?.lon || 0,
        country: scanResults[i]?.country || '',
        city: scanResults[i]?.city || '',
        pid: conn.pid,
        protocol: conn.protocol,
        isRisky: scanResults[i]?.isRisky || false,
        suspicionReason: scanResults[i]?.suspicionReason || '',
      }))
      .filter(conn => conn.lat !== 0 && conn.lon !== 0);

    drawMap(connectionsWithGeo);

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('resize', handleResize);
      return () => {
        canvas.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [connections, scanResults, t]);

  return (
    <div className={styles.container}>
      <h1>{t('map')}</h1>
      <div ref={mapContainerRef} className={styles.map}>
        <canvas ref={canvasRef} className={styles.canvas}></canvas>
        <div ref={tooltipRef} className={styles.tooltip}></div>
      </div>
    </div>
  );
}
