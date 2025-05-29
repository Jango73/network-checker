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
  isSuspicious: boolean;
  suspicionReason: string;
  count?: number;
}

// Structure for canvas coordinates
interface CanvasCoordinates {
  x: number;
  y: number;
}

// Utility functions
const transformToMapCoordinates = (lat: number, lon: number): CanvasCoordinates => {
  const x = ((lon + 180) / 360) * 100; // Longitude: -180..180 to 0..100%
  const latRad = (lat * Math.PI) / 180;
  const mercatorY = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
  const maxMercatorY = Math.log(Math.tan(Math.PI / 4 + (85 * Math.PI) / 360));
  const minMercatorY = Math.log(Math.tan(Math.PI / 4 + (-85 * Math.PI) / 360));
  const y = (1 - (mercatorY - minMercatorY) / (maxMercatorY - minMercatorY)) * 100;
  return { x, y };
};

const clusterConnections = (
  connections: MapConnection[],
  canvasWidth: number,
  canvasHeight: number,
): MapConnection[] => {
  const clustered: MapConnection[] = [];
  const pixelThreshold = 10;

  for (const conn of connections) {
    const { x: xPercent, y: yPercent } = transformToMapCoordinates(conn.lat, conn.lon);
    const x = (xPercent / 100) * canvasWidth;
    const y = (yPercent / 100) * canvasHeight;

    let added = false;
    for (const cluster of clustered) {
      const { x: clusterXPercent, y: clusterYPercent } = transformToMapCoordinates(
        cluster.lat,
        cluster.lon,
      );
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
      canvas.width = mapContainerRef.current!.clientWidth;
      canvas.height = mapContainerRef.current!.clientHeight;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const clustered = clusterConnections(connections, canvas.width, canvas.height);
      clustered.forEach((conn) => {
        const { x: xPercent, y: yPercent } = transformToMapCoordinates(conn.lat, conn.lon);
        const x = (xPercent / 100) * canvas.width;
        const y = (yPercent / 100) * canvas.height;

        // Draw pin
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, 2 * Math.PI);
        ctx.fillStyle = conn.isRisky || conn.isSuspicious ? 'red' : 'green';
        ctx.fill();
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Pulsing effect for risky pins
        if (conn.isRisky || conn.isSuspicious) {
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
    if (!canvasRef.current || !tooltipRef.current || !mapContainerRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const clustered = clusterConnections(
      connections.map((conn, i) => ({
        ip: conn.remoteAddress,
        lat: scanResults[i]?.lat || 0,
        lon: scanResults[i]?.lon || 0,
        country: scanResults[i]?.country || '',
        city: scanResults[i]?.city || '',
        pid: conn.pid,
        protocol: conn.protocol,
        isRisky: scanResults[i]?.isRisky || false,
        isSuspicious: scanResults[i]?.isSuspicious || false,
        suspicionReason: scanResults[i]?.suspicionReason || '',
      })),
      canvas.width,
      canvas.height,
    );

    let tooltipContent = '';
    for (const conn of clustered) {
      const { x: xPercent, y: yPercent } = transformToMapCoordinates(conn.lat, conn.lon);
      const x = (xPercent / 100) * canvas.width;
      const y = (yPercent / 100) * canvas.height;
      if (Math.sqrt((mouseX - x) ** 2 + (y - mouseY) ** 2) < 10) {
        tooltipContent = `
          <b>${t('ip')}:</b> ${conn.ip}<br>
          <b>${t('country')}:</b> ${conn.country}<br>
          <b>${t('city')}:</b> ${conn.city}<br>
          ${conn.isRisky || conn.isSuspicious ? `<b>${t('reason')}:</b> ${conn.suspicionReason}` : ''}
        `;
        break;
      }
    }

    if (tooltipContent) {
      tooltipRef.current.innerHTML = tooltipContent;
      tooltipRef.current.style.display = 'block';

      // Adjust tooltip position relative to canvas and ensure it stays within bounds
      const tooltipWidth = tooltipRef.current.offsetWidth;
      const tooltipHeight = tooltipRef.current.offsetHeight;
      const containerWidth = mapContainerRef.current.clientWidth;
      const containerHeight = mapContainerRef.current.clientHeight;

      let tooltipX = e.clientX - rect.left + 15; // Closer to cursor
      let tooltipY = e.clientY - rect.top - 10; // Above cursor

      // Prevent tooltip from going out of bounds
      if (tooltipX + tooltipWidth > containerWidth) {
        tooltipX = containerWidth - tooltipWidth - 5;
      }
      if (tooltipX < 0) {
        tooltipX = 5;
      }
      if (tooltipY + tooltipHeight > containerHeight) {
        tooltipY = containerHeight - tooltipHeight - 5;
      }
      if (tooltipY < 0) {
        tooltipY = 5;
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
    const connectionsWithGeo: MapConnection[] = connections.map((conn, i) => ({
      ip: conn.remoteAddress,
      lat: scanResults[i]?.lat || 0,
      lon: scanResults[i]?.lon || 0,
      country: scanResults[i]?.country || '',
      city: scanResults[i]?.city || '',
      pid: conn.pid,
      protocol: conn.protocol,
      isRisky: scanResults[i]?.isRisky || false,
      isSuspicious: scanResults[i]?.isSuspicious || false,
      suspicionReason: scanResults[i]?.suspicionReason || '',
    }));
    drawMap(connectionsWithGeo);
  };

  useEffect(() => {
    const connectionsWithGeo: MapConnection[] = connections.map((conn, i) => ({
      ip: conn.remoteAddress,
      lat: scanResults[i]?.lat || 0,
      lon: scanResults[i]?.lon || 0,
      country: scanResults[i]?.country || '',
      city: scanResults[i]?.city || '',
      pid: conn.pid,
      protocol: conn.protocol,
      isRisky: scanResults[i]?.isRisky || false,
      isSuspicious: scanResults[i]?.isSuspicious || false,
      suspicionReason: scanResults[i]?.suspicionReason || '',
    }));

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
        <div
          ref={tooltipRef}
          style={{
            position: 'absolute',
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '8px',
            borderRadius: '4px',
            display: 'none',
            pointerEvents: 'none',
            zIndex: 10, // Ensure tooltip is above canvas
          }}
        ></div>
      </div>
    </div>
  );
}