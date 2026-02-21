export type ScanStatus = 'SAFE' | 'WARNING' | 'CRITICAL';

export interface ScanResult {
    id: string;
    repoName: string;
    commitHash: string;
    timestamp: Date;
    status: ScanStatus;
    piiCount: number;
    keysCount: number;
}