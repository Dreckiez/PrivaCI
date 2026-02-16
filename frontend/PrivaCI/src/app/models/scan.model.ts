export type ScanStatus = 'SAFE' | 'WARNING' | 'CRITICAL';

export interface ScanResult {
    id: string;
    repoName: string;
    timestamp: Date;
    status: ScanStatus;
    piiDetected: number;
    secretsFound: number;
    commitHash: string;
}