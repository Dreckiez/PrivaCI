import { ScanStatus } from "./scan.model";

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
