import { Injectable } from "@angular/core";
import { ScanResult } from "../models/scan.model";
import { Observable, of } from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class ScanService {

    private mockData: ScanResult[] = [
        {
            id: 'scan-001',
            repoName: 'frontend-dashboard',
            timestamp: new Date(),
            status: 'SAFE',
            piiDetected: 0,
            secretsFound: 0,
            commitHash: 'a1b2c3d'
        },
        {
            id: 'scan-002',
            repoName: 'backend-api',
            timestamp: new Date(Date.now() - 3600000),
            status: 'CRITICAL',
            piiDetected: 5,
            secretsFound: 1,
            commitHash: 'f9e8d7c'
        },
        {
            id: 'scan-003',
            repoName: 'auth-service',
            timestamp: new Date(Date.now() - 7200000),
            status: 'WARNING',
            piiDetected: 2,
            secretsFound: 0,
            commitHash: 'b4c5d6e'
        }
    ];

    getRecentScans(): Observable<ScanResult[]> {
        return of(this.mockData);
    }
}