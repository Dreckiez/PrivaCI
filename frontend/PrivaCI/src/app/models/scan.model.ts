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

export interface DashboardData {
  stats: {
    totalScans: number;
    todayScans: number;
    criticalScans: number;
    safeScans: number;
  };
  recentScans: ScanResult[];
}

export type SecretType = 'KEY' | 'PII';

export interface ScanFinding {
  type: SecretType;
  file: string;
  line: number;
  severity: 'WARNING' | 'CRITICAL';
  description: string;
  snippet: string;
}

export interface CurrentScan {
  commitHash: string;
  scannedAt: string;
  findings: ScanFinding[];
}