import { ScanStatus, CurrentScan } from "./scan.model";

export interface Repository {
  id: string;
  github_repo_id: string;
  name: string;
  is_private: boolean;
  main_language: string;
  scan_status: ScanStatus;
  last_scanned_at: Date | null;
}

export interface PaginatedReposResponse {
  data: Repository[];
  pagination: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
  };
}

export interface RepoDetailsData {
  repoName: string;
  overallStatus: ScanStatus;
  branches: string[];
  selectedBranch: string;
  branchStatus: ScanStatus;
  currentScan: CurrentScan | null;
}

export interface RepoDetailsResponse {
  success: boolean;
  data: RepoDetailsData;
}
