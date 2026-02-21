import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { AuthService } from "../services/auth.service";

export const authGuard: CanActivateFn = async () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (!auth.authenticated) await auth.loadUser();

    if (!auth.authenticated) {
        await router.navigate(['/login']);
        return false;
    }

    return true;
}