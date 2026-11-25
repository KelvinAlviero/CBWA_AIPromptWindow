// Every call to the Express backend goes through here. This file replaces
// authService.js: there are no credentials in the frontend any more. The
// browser automatically sends the HttpOnly "token" cookie; JavaScript never
// sees it.

async function request(path, options = {}) {
  const res = await fetch(path, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body.error) message = body.error;
    } catch {
      // response had no JSON body
    }
    const error = new Error(message);
    error.status = res.status;
    throw error;
  }

  return res.status === 204 ? null : res.json();
}

export const api = {
  me: () => request("/api/me"),
  list: () => request("/api/capsules"),
  create: (data) => request("/api/capsules", { method: "POST", body: JSON.stringify(data) }),
  update: (id, data) =>
    request(`/api/capsules/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  remove: (id) => request(`/api/capsules/${id}`, { method: "DELETE" }),
  logout: () => request("/auth/logout", { method: "POST" }),
};
