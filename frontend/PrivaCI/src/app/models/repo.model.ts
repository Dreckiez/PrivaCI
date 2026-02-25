export interface Repository {
  id: string;
  github_repo_id: string;
  name: string;
  is_private: boolean;
  main_language: string;
  status: 'Safe' | 'Warning' | 'Critical' | 'Unscanned';
  lastScanned: Date | null;
}

export interface PaginatedReposResponse {
  data: Repository[];
  pagination: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
  };
}
