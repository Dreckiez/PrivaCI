const API_BASE = "http://localhost:3000/api";

export const API_ENDPOINTS = {
    repo: {
        getAll: `${API_BASE}/repo`,
    },
    auth: {
        login: `${API_BASE}/auth/login`,
        logout: `${API_BASE}/auth/logout`,
        me: `${API_BASE}/auth/me`
    }
}