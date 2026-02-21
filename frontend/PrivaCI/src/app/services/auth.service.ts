import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { inject } from "@angular/core";
import { firstValueFrom } from "rxjs";

@Injectable({ 
    providedIn: 'root'
})
export class AuthService {
    private http = inject(HttpClient);

    user: any = null;
    authenticated = false;

    async loadUser() {
        try {
            const res: any = await firstValueFrom(
                this.http.get('http://localhost:3000/api/auth/me', {
                    withCredentials: true
                })
            );

            this.user = res.user;
            this.authenticated = true;
        } catch {
            this.user = null;
            this.authenticated = false;
        }
    }

    async logout() {
        try {
            await firstValueFrom(
                this.http.post('http://localhost:3000/api/auth/logout', {}, {
                    withCredentials: true
                })
            )

            this.user = null;
            this.authenticated = false;
        } catch (error) {
            
        }
    }
}
