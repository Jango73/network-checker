import fs from 'fs/promises';
import path from 'path';
import { HistoryEntry } from '../../types/history';

const HISTORY_PATH = path.join(process.cwd(), 'history.json');

export class HistoryService {
  /**
   * Load scan history from history.json.
   * @returns Array of history entries.
   */
  async loadHistory(): Promise<HistoryEntry[]> {
    try {
      const data = await fs.readFile(HISTORY_PATH, 'utf-8');
      const history = JSON.parse(data) as HistoryEntry[];
      // Sort history by timestamp in descending order
      return history.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        await this.saveHistory([]);
        return [];
      }
      throw new Error(`Failed to load history: ${(error as Error).message}`);
    }
  }

  /**
   * Save scan history to history.json.
   * @param entries Array of history entries to save.
   * @param maxSize Maximum size of history file in MB.
   */
  async saveHistory(
    entries: HistoryEntry[],
    maxSize: number = 10
  ): Promise<void> {
    try {
      // Sort entries by timestamp in descending order before saving
      const sortedEntries = entries.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      const data = JSON.stringify(sortedEntries, null, 2);
      const sizeInMB = Buffer.byteLength(data, 'utf8') / (1024 * 1024);

      if (sizeInMB > maxSize) {
        // Calculate total and risky connections for trimming
        const groupedByScan = sortedEntries.reduce(
          (acc, entry) => {
            const scanDate = entry.timestamp.split('T')[0];
            if (!acc[scanDate]) {
              acc[scanDate] = {
                entries: [],
                totalConnections: 0,
                riskyConnections: 0,
              };
            }
            acc[scanDate].entries.push(entry);
            acc[scanDate].totalConnections++;
            if (entry.isRisky || entry.isSuspicious) {
              acc[scanDate].riskyConnections++;
            }
            return acc;
          },
          {} as {
            [key: string]: {
              entries: HistoryEntry[];
              totalConnections: number;
              riskyConnections: number;
            };
          }
        );

        // Sort scans by date and keep newest until within size limit
        const sortedScans = Object.keys(groupedByScan).sort().reverse();
        let totalSize = 0;
        const trimmedEntries: HistoryEntry[] = [];
        for (const scanDate of sortedScans) {
          const scanEntries = groupedByScan[scanDate].entries;
          const scanSize =
            Buffer.byteLength(JSON.stringify(scanEntries), 'utf8') /
            (1024 * 1024);
          if (totalSize + scanSize <= maxSize) {
            trimmedEntries.push(...scanEntries);
            totalSize += scanSize;
          } else {
            break;
          }
        }
        await fs.writeFile(
          HISTORY_PATH,
          JSON.stringify(trimmedEntries, null, 2)
        );
      } else {
        await fs.writeFile(HISTORY_PATH, data);
      }
    } catch (error) {
      throw new Error(`Failed to save history: ${(error as Error).message}`);
    }
  }

  /**
   * Clear scan history.
   */
  async clearHistory(): Promise<void> {
    try {
      await fs.writeFile(HISTORY_PATH, JSON.stringify([], null, 2));
    } catch (error) {
      throw new Error(`Failed to clear history: ${(error as Error).message}`);
    }
  }

  /**
   * Export scan history to JSON or CSV.
   * @param format Export format ('json' or 'csv').
   * @param outputPath Path to save the exported file.
   */
  async exportHistory(
    format: 'json' | 'csv',
    outputPath: string
  ): Promise<void> {
    try {
      const entries = await this.loadHistory();

      if (format === 'json') {
        await fs.writeFile(outputPath, JSON.stringify(entries, null, 2));
      } else if (format === 'csv') {
        const headers = [
          'scanDate',
          'totalConnections',
          'riskyConnections',
          'ip',
          'country',
          'isp',
          'org',
          'city',
          'lat',
          'lon',
          'pid',
          'processName',
          'processPath',
          'isRisky',
          'isSuspicious',
          'suspicionReason',
        ];
        const groupedByScan = entries.reduce(
          (acc, entry) => {
            const scanDate = entry.timestamp.split('T')[0];
            if (!acc[scanDate]) {
              acc[scanDate] = {
                entries: [],
                totalConnections: 0,
                riskyConnections: 0,
              };
            }
            acc[scanDate].entries.push(entry);
            acc[scanDate].totalConnections++;
            if (entry.isRisky || entry.isSuspicious) {
              acc[scanDate].riskyConnections++;
            }
            return acc;
          },
          {} as {
            [key: string]: {
              entries: HistoryEntry[];
              totalConnections: number;
              riskyConnections: number;
            };
          }
        );

        const rows: string[] = [];
        for (const scanDate of Object.keys(groupedByScan)) {
          const { entries, totalConnections, riskyConnections } =
            groupedByScan[scanDate];
          entries.forEach(entry => {
            rows.push(
              [
                scanDate,
                totalConnections.toString(),
                riskyConnections.toString(),
                entry.ip,
                entry.country || '',
                entry.provider || '',
                entry.organization || '',
                entry.city || '',
                entry.lat.toString(),
                entry.lon.toString(),
                entry.pid.toString(),
                entry.process || '',
                entry.processPath || '',
                entry.isRisky.toString(),
                entry.isSuspicious.toString(),
                entry.suspicionReason || '',
              ]
                .map(val => `"${val.replace(/"/g, '""')}"`)
                .join(',')
            );
          });
        }
        await fs.writeFile(outputPath, [headers.join(','), ...rows].join('\n'));
      }
    } catch (error) {
      throw new Error(`Failed to export history: ${(error as Error).message}`);
    }
  }
}
