import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map, switchMap } from 'rxjs/operators';
import { CommonModule, DatePipe } from '@angular/common';
import { ScanLog } from '../../components/scan-log/scan-log';
import { BranchSelector } from '../../components/branch-selector/branch-selector';
import { combineLatest, firstValueFrom } from 'rxjs';
import { RepoDetailsData } from '../../models/repo.model';
import { RepoService } from '../../services/repo.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-repo-details',
  imports: [CommonModule, DatePipe, RouterLink, ScanLog, BranchSelector],
  templateUrl: './repo-details.html',
  styleUrl: './repo-details.css',
})
export class RepoDetails {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private repoService = inject(RepoService);
  private toastService = inject(ToastService);

  private cdr = inject(ChangeDetectorRef);

  data: RepoDetailsData | null = null;
  isLoading = true;
  isScanning = false;
  
  ngOnInit() {
    combineLatest([
      this.route.paramMap,
      this.route.queryParamMap
    ]).subscribe(([params, queryParams]) => {
      const id = params.get('id');
      const branch = queryParams.get('branch') || 'main';

      if (id) this.fetchRepoDetails(id, branch);
    })
  }

  get openFindings() {
    return this.data?.currentScan?.findings?.filter((f: any) => f.status === 'OPEN') || [];
  }

  get ignoredFindings() {
    return this.data?.currentScan?.findings?.filter((f: any) => f.status === 'IGNORED') || [];
  }

  refreshData() {
    const id = this.route.snapshot.paramMap.get('id');
    const branch = this.data?.selectedBranch || 'main';
    if (id) {
      this.fetchRepoDetails(id, branch);
    }
  }

  async fetchRepoDetails(id: string, branch: string) {
    this.isLoading = true;
    this.cdr.detectChanges();
    try {
      const response = await firstValueFrom(
        this.repoService.getRepoDetail(id, branch)
      );

      this.data = response.data;
    } catch (error) {
      this.toastService.show("Failed to load repository details.", "error");
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  onBranchChange(branchName: string) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {branch: branchName},
      queryParamsHandling: 'merge'
    })
  }

  async scanAllBranches() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id || this.isScanning) return;
    
    this.isScanning = true;
    this.cdr.detectChanges();
    
    try {
      await firstValueFrom(this.repoService.scanAll(id));
      await this.fetchRepoDetails(id, this.data?.selectedBranch || 'main');
      this.toastService.show("Successfully scanned all branches.", "success");
    } catch (error) {
      this.toastService.show("Scan failed. The repository might be too large and timed out.", "error");
    } finally {
      this.isScanning = false;
      this.cdr.detectChanges();
    }
  }

  async scanCurrentBranch() {
    const id = this.route.snapshot.paramMap.get('id');
    const branch = this.data?.selectedBranch;
    if (!id || !branch || this.isScanning) return;
    
    this.isScanning = true;
    this.cdr.detectChanges();
    
    try {
      await firstValueFrom(this.repoService.scanBranch(id, branch));
      await this.fetchRepoDetails(id, branch);
      this.toastService.show(`Successfully scanned branch: ${branch}`, "success");
    } catch (error) {
      this.toastService.show("Scan failed. The branch might be too large and timed out.", "error");
    } finally {
      this.isScanning = false;
      this.cdr.detectChanges();
    }
  }

}
