// src/lib/fetchWithAuth.ts

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  let res = await fetch(url, {
    ...options,
    credentials: "include",
  });

  if (res.status === 401) {
    console.log("🔄 Access token expired, attempting refresh...");

    const refreshRes = await fetch("http://localhost:3001/auth/refresh", {
      method: "POST",
      credentials: "include",
    });
    console.log("======================")

    if (refreshRes.ok) {
      await new Promise(resolve => setTimeout(resolve, 50));
      res = await fetchWithAuth(url, {
        ...options,
        credentials: "include",
      });
      console.log(res)
      if (res.status === 401) {
        window.location.href = "/auth/login";
      }
      
      return res; 
    } else {
      window.location.href = "/auth/login";
    }
  }

  return res;
}
