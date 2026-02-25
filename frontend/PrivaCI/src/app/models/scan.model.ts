export type ScanStatus = 'SAFE' | 'WARNING' | 'CRITICAL' | 'UNSCANNED';

export interface ScanResult {
    id: string;
    repoName: string;
    branch: string;
    commitHash: string;
    timestamp: Date;
    status: ScanStatus;
    piiCount: number;
    keysCount: number;
}

export type SecretType = 'KEY' | 'PII';

export interface ScanDetail {
    branch: string;
    type: SecretType;
    file: string;
    line: number;
    severity: ScanStatus;
    description: string;
    snippet: string;
}