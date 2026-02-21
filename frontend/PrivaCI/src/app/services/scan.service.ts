import { Injectable } from "@angular/core";
import { ScanResult, ScanDetail } from "../models/scan.model";
import { Observable, of } from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class ScanService {

    private mockData: ScanResult[] = [
        {
            id: 'scan-001',
            repoName: 'frontend-dashboard',
            branch: 'main',
            timestamp: new Date(),
            status: 'SAFE',
            piiCount: 0,
            keysCount: 0,
            commitHash: 'a1b2c3d'
        },
        {
            id: 'scan-002',
            repoName: 'backend-api',
            branch: 'feature/apiTest',
            timestamp: new Date(Date.now() - 3600000),
            status: 'CRITICAL',
            piiCount: 5,
            keysCount: 1,
            commitHash: 'f9e8d7c'
        },
        {
            id: 'scan-003',
            repoName: 'auth-service',
            branch: 'origin',
            timestamp: new Date(Date.now() - 7200000),
            status: 'WARNING',
            piiCount: 2,
            keysCount: 0,
            commitHash: 'b4c5d6e'
        }
    ];

    private mockDetail: ScanDetail[] = [
        {
            branch: 'main',
            type: 'KEY',
            file: 'src/config/aws-config.ts',
            line: 14,
            severity: 'CRITICAL',
            description: 'Exposed AWS Secret Access Key detected.',
            snippet: '13 | export const config = {\n14 |   secretAccessKey: "AKIAIOSFODNN7EXAMPLE",\n15 |   region: "us-east-1"\n16 | };'
        },
        {
            branch: 'main',
            type: 'PII',
            file: 'src/controllers/user.controller.ts',
            line: 42,
            severity: 'WARNING',
            description: 'Potential logging of plain-text email address.',
            snippet: '41 | const user = await db.find({ id: req.body.id });\n42 | console.log("Login attempt for email: ", user.email);\n43 | return res.status(200);'
        }
    ];

    getRecentScans(): Observable<ScanResult[]> {
        return of(this.mockData);
    }

    getScanDetails(repoName: string, branch: string): Observable<ScanDetail[]> {
        return of(this.mockDetail);
    }
}