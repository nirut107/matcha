// src/lib/fetchWithAuth.ts

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  let res = await fetch(url, {
    ...options,
    credentials: "include",
  });

  if (res.status === 401) {
    await fetch("http://localhost:3001/auth/refresh", {
      method: "POST",
      credentials: "include",
    });

    res = await fetch(url, {
      ...options,
      credentials: "include",
    });
  }
  if (res.status == 401) {
    window.location.href = "/auth/login";
  }

  return res;
}
