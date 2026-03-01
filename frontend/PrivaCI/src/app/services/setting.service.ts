import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { API_ENDPOINTS } from '../utils/url.util';

@Injectable({
  providedIn: 'root'
})
export class SettingService {
  private http = inject(HttpClient);
  
  async getCustomRules(): Promise<any[]> {
    return await firstValueFrom(
      this.http.get<any[]>(API_ENDPOINTS.setting.getCustomRules, { withCredentials: true })
    );
  }

  async addCustomRule(rule: { name: string; regex: string; severity: string }): Promise<any> {
    return await firstValueFrom(
      this.http.post<any>(API_ENDPOINTS.setting.createCustomRules, rule, { withCredentials: true })
    );
  }

  async deleteCustomRule(id: number): Promise<void> {
    return await firstValueFrom(
      this.http.delete<void>(API_ENDPOINTS.setting.deleteCustomRules(id), { withCredentials: true })
    );
  }
}