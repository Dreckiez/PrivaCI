import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Repository } from '../../models/repo.model';
import { BehaviorSubject, catchError, firstValueFrom, map, Observable, of, switchMap, tap } from 'rxjs';
import { RepoService } from '../../services/repo.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-repo',
  imports: [CommonModule, RouterLink, DatePipe],
  templateUrl: './repo.html',
  styleUrl: './repo.css',
})
export class Repo {
  private repoService = inject(RepoService);
  private toastService = inject(ToastService);
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
        this.repoService.getRepos(page, this.limit).pipe(
          catchError(err => {
            this.toastService.show('Failed to load repositories.', 'error');
            return of({ data: [], pagination: {totalItems: 0, totalPages: 1}});
          })
        )
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
    if (this.isSyncing) return;
    
    this.isSyncing = true;
    
    try {
      await firstValueFrom(this.repoService.syncRepos());
      this.toastService.show("Successfully synced with GitHub.", "success");
      this.pageSubject.next(this.currentPage); 
      
    } catch (error) {
      this.toastService.show("Failed to sync with GitHub. Please try again.", "error");
    } finally {
      this.isSyncing = false;
    }
  }

  async scanRepo(githubRepoId: string) {
    if (this.scanningStates[githubRepoId]) return;

    this.scanningStates[githubRepoId] = true;

    try {
      await firstValueFrom(this.repoService.scanAll(githubRepoId));
      this.toastService.show("Repository scan completed successfully.", "success");
      this.pageSubject.next(this.currentPage); 
    } catch (error) {
      this.toastService.show("Scan failed. The repository might be too large and timed out.", "error");
    } finally {
      this.scanningStates[githubRepoId] = false;
    }
  }

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
