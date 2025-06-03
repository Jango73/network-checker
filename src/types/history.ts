export interface History {
    process: string;
    isRisky: boolean;
}

export interface HistoryEntry {
    timestamp: string;
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
