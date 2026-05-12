const AUTH_KEY = "steampanel_auth";

export function setAuth(value: boolean) {
  sessionStorage.setItem(AUTH_KEY, value ? "1" : "0");
}

export function isAuthenticated(): boolean {
  return sessionStorage.getItem(AUTH_KEY) === "1";
}

export function logout() {
  sessionStorage.removeItem(AUTH_KEY);
}
