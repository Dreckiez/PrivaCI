import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { API_ENDPOINTS } from "../utils/url.util";
import { PaginatedReposResponse, RepoDetailsResponse } from "../models/repo.model";

@Injectable({
  providedIn: 'root'
})
export class RepoService {
    private http = inject(HttpClient);

    getRepos(page: number, limit: number): Observable<PaginatedReposResponse> {
        return this.http.get<any>(`${API_ENDPOINTS.repo.getAll}?page=${page}&limit=${limit}`, {
            withCredentials: true
        });
    }

    getRepoDetail(githubRepoId: string, branch: string): Observable<RepoDetailsResponse> {
        return this.http.get<RepoDetailsResponse>(`${API_ENDPOINTS.repo.getDetail(githubRepoId, branch)}`, {
            withCredentials: true
        });
    }
}