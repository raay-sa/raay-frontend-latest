import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Where we'll stash the tokens so your AuthProvider/ProtectedRoute can pick them up
 * (We save to a couple of common keys to be safe.)
 */
const SAVE_TOKENS = (token, refreshToken) => {
    try {
        localStorage.setItem("token", token);        // common
        if (refreshToken) {
            localStorage.setItem("refresh_token", refreshToken);
        }
    } catch { }
    try {
        localStorage.setItem("authToken", token);    // some apps use this
    } catch { }
    try {
        localStorage.setItem("raay.sso.token", token); // namespaced backup
    } catch { }
};

/** Parse token + redirect from hash (#token=...&redirect=/student) or query (?token=...) */
function readParams() {
    const fromHash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    let token = fromHash.get("token");
    let refreshToken = fromHash.get("refresh_token");
    let redirect = fromHash.get("redirect");

    if (!token) {
        const fromQuery = new URLSearchParams(window.location.search);
        token = fromQuery.get("token");
        refreshToken = refreshToken || fromQuery.get("refresh_token");
        redirect = redirect || fromQuery.get("redirect");
    }

    // sanitize redirect: must be an in-app path
    if (!redirect || !redirect.startsWith("/")) {
        redirect = "/student";
    }
    
    // If redirect is /trainee, change it to /student
    if (redirect === "/trainee") {
        redirect = "/student";
    }

    return { token, refreshToken, redirect };
}

export default function TokenLogin() {
    const location = useLocation(); // just to keep react-router happy

    useEffect(() => {
        const { token, refreshToken, redirect } = readParams();

        if (!token) {
            // no token — back to login
            window.location.replace("/login");
            return;
        }

        // 1) Save tokens so your AuthProvider/ProtectedRoute can use them
        SAVE_TOKENS(token, refreshToken);

        // 2) (Optional, best practice) If you have an API to exchange the token for an HttpOnly cookie,
        //    do it here, then redirect in .finally().
        // fetch("/api/sso/exchange", {
        //   method: "POST",
        //   headers: { "Content-Type": "application/json" },
        //   credentials: "include",
        //   body: JSON.stringify({ token }),
        // })
        // .catch(() => {})
        // .finally(() => {
        //   // clear hash from the URL (cosmetic)
        //   try { history.replaceState(null, "", "/token-login"); } catch {}
        //   // 3) Hard redirect so AuthProvider re-initializes with token present
        //   window.location.replace(redirect);
        // });

        // If you don’t have an exchange endpoint, just continue:
        try {
            history.replaceState(null, "", "/token-login"); // remove token from address bar
        } catch { }
        // 3) Hard redirect so your AuthProvider initializes with the new token
        window.location.replace(redirect);
    }, []);

    return (
        <div className="h-screen flex items-center justify-center">
            <p>Signing you in…</p>
        </div>
    );
}
