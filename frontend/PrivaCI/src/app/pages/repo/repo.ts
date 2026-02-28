import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Repository } from '../../models/repo.model';
import { BehaviorSubject, firstValueFrom, map, Observable, switchMap, tap } from 'rxjs';
import { RepoService } from '../../services/repo.service';

@Component({
  selector: 'app-repo',
  imports: [CommonModule, RouterLink, DatePipe],
  templateUrl: './repo.html',
  styleUrl: './repo.css',
})
export class Repo {
  private repoService = inject(RepoService);
  private pageSubject = new BehaviorSubject<number>(1);

  limit = 9;

  totalPages = 1;
  totalItems = 0;

  repos$!: Observable<Repository[]>;

  isSyncing = false;

  scanningStates: { [key: string]: boolean } = {};

  ngOnInit() {
    this.repos$ = this.pageSubject.pipe(
      switchMap(page =>
        this.repoService.getRepos(page, this.limit)
      ),
      tap(response => {
        this.totalItems = response.pagination.totalItems;
        this.totalPages = response.pagination.totalPages;
      }),
      map(response =>
        response.data.map(repo => ({
          id: repo.id,
          github_repo_id: repo.github_repo_id,
          name: repo.name,
          is_private: repo.is_private,
          main_language: repo.main_language || 'Unknown',
          scan_status: repo.scan_status ?? "UNSCANNED",
          last_scanned_at: repo.last_scanned_at ? new Date(repo.last_scanned_at) : null
        }))
      )
    );
  }

  get currentPage() {
    return this.pageSubject.value;
  }

  get startIndex() {
    if (this.totalItems === 0) return 0;
    return (this.currentPage - 1) * this.limit + 1;
  }

  get endIndex() {
    return Math.min(this.currentPage * this.limit, this.totalItems);
  }

  async syncGitHub() {
    if (this.isSyncing) return; // Prevent double clicks
    
    this.isSyncing = true;
    
    try {
      await firstValueFrom(this.repoService.syncRepos());
      
      this.pageSubject.next(this.currentPage); 
      
    } catch (error) {
      // console.error("Failed to sync with GitHub:", error);
    } finally {
      this.isSyncing = false;
    }
  }

  async scanRepo(githubRepoId: string) {
    if (this.scanningStates[githubRepoId]) return;

    this.scanningStates[githubRepoId] = true;

    try {
      await firstValueFrom(this.repoService.scanAll(githubRepoId));
      // Refresh the list to fetch the updated scan status and badges
      this.pageSubject.next(this.currentPage); 
    } catch (error) {
      console.error("Baseline Scan Error:", error);
    } finally {
      this.scanningStates[githubRepoId] = false;
    }
  }

  // --- Actions ---
  nextPage() {
    const next = this.pageSubject.value + 1;
    if (next <= this.totalPages) {
      this.pageSubject.next(next);
    }
  }

  prevPage() {
    const prev = this.pageSubject.value - 1;
    if (prev >= 1) {
      this.pageSubject.next(prev);
    }
  }
}
