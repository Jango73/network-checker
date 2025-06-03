import { exec } from 'child_process';
import { promisify } from 'util';
import { Connection } from '../../types/network';
import { isValidIP } from '../utils/ip';

const execAsync = promisify(exec);

export class NetstatService {
    /**
     * Execute netstat and parse active network connections.
     * @returns List of connections with IP, port, and PID.
     */
    async getConnections(): Promise<Connection[]> {
        try {
            const { stdout } = await execAsync('netstat -ano');
            const connections = this.parseNetstatOutput(stdout);
            return connections;
        } catch (error) {
            throw new Error(
                `Failed to execute netstat: ${(error as Error).message}`
            );
        }
    }

    /**
     * Parse netstat output into structured connection data, grouping by IP and PID.
     * @param output Raw netstat output.
     * @returns Array of Connection objects.
     */
    private parseNetstatOutput(output: string): Connection[] {
        const connections: Connection[] = [];
        const uniqueConnections = new Map<string, Connection>();

        const lines = output.split('\n');

        for (const line of lines) {
            // Skip headers or empty lines
            if (!line.trim() || line.includes('Proto')) continue;

            // Match netstat output like:
            // "  TCP    192.168.1.100:50307  172.217.20.14:443  ESTABLISHED  1224"
            // "  TCP    [::1]:52962  [::1]:5173  CLOSE_WAIT  552"
            // "  TCP    [2a01:cb00:1d1f:a100:2bc5:3a77:9be6:f344]:52645  [2a01:cb00:1d1f:a100:368a:aeff:fe1e:9d5c]:53  ESTABLISHED  3760"
            // "  UDP    192.168.1.100:1234   *:*                 5678"
            const match = line.match(
                /^\s*(TCP|UDP)\s+(\[?[\w:.*%]+\]?:[\d*]+)\s+(\[?[\w:.*%]+\]?:[\d*]+|\*:0)\s+(\w+)?\s*(\d+)/i
            );
            if (match) {
                const [
                    ,
                    protocol,
                    localAddrPort,
                    remoteAddrPort,
                    state = '',
                    pid,
                ] = match;

                // Split address and port
                const localMatch = localAddrPort.match(
                    /(\[?[\w:.*%]+\]?):(\d+|\*)/
                );
                const remoteMatch = remoteAddrPort.match(
                    /(\[?[\w:.*%]+\]?):(\d+|\*)/
                );

                if (localMatch && remoteMatch) {
                    let [, localAddress, localPort] = localMatch;
                    let [, remoteAddress, remotePort] = remoteMatch;

                    // Clean IPv6 brackets and interface suffix
                    localAddress = localAddress
                        .replace(/[\[\]]/g, '')
                        .replace(/%\d+$/, '');
                    remoteAddress = remoteAddress
                        .replace(/[\[\]]/g, '')
                        .replace(/%\d+$/, '');

                    // Validate IPs and ensure remoteAddress is not empty for TCP connections
                    if (
                        isValidIP(localAddress) &&
                        (remoteAddress === '*' || isValidIP(remoteAddress)) &&
                        (protocol === 'UDP' || remoteAddress !== '')
                    ) {
                        const key = `${remoteAddress}-${pid}`; // Unique key by IP and PID
                        if (!uniqueConnections.has(key)) {
                            uniqueConnections.set(key, {
                                protocol: protocol.toUpperCase() as
                                    | 'TCP'
                                    | 'UDP',
                                localAddress,
                                localPort:
                                    localPort === '*'
                                        ? 0
                                        : parseInt(localPort, 10),
                                remoteAddress:
                                    remoteAddress === '*' ? '' : remoteAddress,
                                remotePort:
                                    remotePort === '*'
                                        ? 0
                                        : parseInt(remotePort, 10),
                                state: state.trim(),
                                pid: parseInt(pid, 10),
                            });
                        }
                    }
                }
            }
        }

        return Array.from(uniqueConnections.values());
    }
}
