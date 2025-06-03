import { create } from 'zustand';
import { Config } from '../../types/config';
import { Connection } from '../../types/network';
import { HistoryEntry } from '../../types/history';

type MessageType = 'success' | 'error' | 'warning' | 'info';

interface Message {
    id: number;
    type: MessageType;
    text: string;
}

interface ScanResult {
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

interface StoreState {
    config: Config;
    setConfig: (config: Config) => void;
    connections: Connection[];
    setConnections: (connections: Connection[]) => void;
    scanResults: ScanResult[];
    setScanResults: (results: ScanResult[]) => void;
    history: HistoryEntry[];
    setHistory: (history: HistoryEntry[]) => void;
    messages: Message[];
    messageQueue: Message[];
    addMessage: (type: MessageType, text: string) => void;
    removeMessage: (id: number) => void;
    isScanning: boolean;
    setIsScanning: (value: boolean) => void;
    pathRecurrence: Map<string, number>;
    incrementPathRecurrence: (path: string) => void;
    getPathRecurrence: (path: string) => number;
}

let messageIdCounter = 1;

export const useStore = create<StoreState>((set, get) => ({
    config: {
        bannedIPs: [],
        riskyCountries: [],
        riskyProviders: [],
        trustedIPs: [],
        trustedProcesses: [],
        darkMode: false,
        language: 'en',
        scanInterval: 60000,
        maxHistorySize: 10,
        periodicScan: true,
    },
    setConfig: config => set({ config }),

    connections: [],
    setConnections: connections => set({ connections }),

    scanResults: [],
    setScanResults: results => set({ scanResults: results }),

    history: [],
    setHistory: history =>
        set({
            history: history.sort(
                (a, b) =>
                    new Date(b.timestamp).getTime() -
                    new Date(a.timestamp).getTime()
            ),
        }),

    messages: [],
    messageQueue: [],
    addMessage: (type, text) => {
        const id = messageIdCounter++;
        const newMessage = { id, type, text };
        set(state => {
            const totalMessages =
                state.messages.length + state.messageQueue.length + 1;
            setTimeout(() => {
                get().removeMessage(id);
            }, 5000 * totalMessages);
            return {
                messages:
                    state.messages.length === 0 ? [newMessage] : state.messages,
                messageQueue:
                    state.messages.length === 0
                        ? state.messageQueue
                        : [...state.messageQueue, newMessage],
            };
        });
    },
    removeMessage: id =>
        set(state => {
            const updatedMessages = state.messages.filter(msg => msg.id !== id);
            const nextMessage =
                state.messageQueue.length > 0 ? [state.messageQueue[0]] : [];
            const updatedQueue = state.messageQueue.slice(1);
            return { messages: nextMessage, messageQueue: updatedQueue };
        }),

    isScanning: false,
    setIsScanning: value => set({ isScanning: value }),

    pathRecurrence: new Map<string, number>(),
    incrementPathRecurrence: (path: string) => {
        set(state => {
            const newRecurrence = new Map(state.pathRecurrence);
            newRecurrence.set(path, (newRecurrence.get(path) || 0) + 1);
            return { pathRecurrence: newRecurrence };
        });
    },
    getPathRecurrence: (path: string) => {
        return get().pathRecurrence.get(path) || 0;
    },
}));
