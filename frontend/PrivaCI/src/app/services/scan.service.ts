import { Injectable, inject } from "@angular/core";
import { DashboardData, ScanResult } from "../models/scan.model";
import { map, Observable, of } from "rxjs";
import { HttpClient } from "@angular/common/http";
import { API_ENDPOINTS } from "../utils/url.util";

@Injectable({
  providedIn: 'root'
})
export class ScanService {
    private http = inject(HttpClient);

    getDashboardOverview(): Observable<DashboardData> {
        return this.http.get<any>(`${API_ENDPOINTS.scan.getScan}`, {
            withCredentials: true
        }).pipe(
            map(response => ({
                stats: response.stats,
                recentScans: response.recentScans.map((scan: any) => ({
                    id: scan.github_repo_id,
                    repoName: scan.repo_name,
                    branch: scan.branch,
                    timestamp: new Date(scan.scanned_at),
                    status: scan.status,
                    piiCount: scan.pii_count,
                    keysCount: scan.key_count,
                    commitHash: scan.commit_hash
                }))
            }))
        );
    }

    updateFindingStatus(findingId: number, status: 'OPEN' | 'IGNORED'): Observable<any> {
        return this.http.post(`${API_ENDPOINTS.scan.updateFinding}`, 
            { findingId, status },
            { withCredentials: true }
        );
    }
}