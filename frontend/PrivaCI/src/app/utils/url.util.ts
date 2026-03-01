const API_BASE = "http://localhost:3000/api";

export const API_ENDPOINTS = {
    scan: {
        getScan: `${API_BASE}/scan`,
        updateFinding: `${API_BASE}/scan/findings`
    },
    repo: {
        getAll: `${API_BASE}/repo`,
        getDetail: (id: string, branch: string) => `${API_BASE}/repo/${id}/details?branch=${encodeURIComponent(branch)}`,
        syncRepos: `${API_BASE}/repo/sync`,
        scanBranch: (id: string) => `${API_BASE}/repo/${id}/scanBranch`,
        scanAllBranches: (id: string) => `${API_BASE}/repo/${id}/scanAll`,
    },
    auth: {
        login: `${API_BASE}/auth/login`,
        logout: `${API_BASE}/auth/logout`,
        me: `${API_BASE}/auth/me`,
        deleteAcc: `${API_BASE}/auth/account`
    }
}