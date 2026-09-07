export async function apiPatch(url: string, body: Record<string, unknown>) {
  const res = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Failed to update");
  return res.json();
}

export async function apiPost(url: string, body: Record<string, unknown>) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Failed to create");
  return res.json();
}

export async function apiDelete(url: string) {
  const res = await fetch(url, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete");
}
