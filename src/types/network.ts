/**
 * Network connection details from netstat.
 */
export interface Connection {
    protocol: 'TCP' | 'UDP';
    localAddress: string;
    localPort: number;
    remoteAddress: string;
    remotePort: number;
    state: string;
    pid: number;
}

/**
 * Result of a network scan with geolocation and risk evaluation.
 */
export interface ScanResult {
    ip: string;
    country: string;
    provider: string;
    organization: string;
    city: string;
    lat: number;
    lon: number;
    pid: number;
    process: string;
    processPath: string;
    isSigned: boolean;
    isRisky: boolean;
    suspicionReason: string;
}

/**
 * Process evaluation result.
 */
export interface ProcessEvaluation {
    isRisky: boolean;
    reason: string;
}
