import { API_BASE } from '../constant';

async function request(url: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

const JSON_HEADERS = { 'Content-Type': 'application/json' };

// Tìm bản ghi trên MockAPI theo BIT240160_Id (id sinh ở client). MockAPI filter dạng "chứa"
// nên phải so khớp chính xác lại ở client.
async function findRemote(resource: string, id: string): Promise<{ id: string } | null> {
  const res = await request(`${API_BASE}/${resource}?BIT240160_Id=${encodeURIComponent(id)}`);
  if (res.status === 404) return null; // MockAPI trả 404 khi không có kết quả
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const arr = await res.json();
  if (!Array.isArray(arr)) return null;
  return arr.find((x: any) => x && x.BIT240160_Id === id) ?? null;
}

// "Upsert": có rồi thì PUT, chưa có thì POST -> sync lặp lại cũng không sinh bản ghi trùng
export async function pushUpsert(resource: string, item: { BIT240160_Id: string }) {
  const remote = await findRemote(resource, item.BIT240160_Id);
  const body = JSON.stringify(item);
  const res = remote
    ? await request(`${API_BASE}/${resource}/${remote.id}`, { method: 'PUT', headers: JSON_HEADERS, body })
    : await request(`${API_BASE}/${resource}`, { method: 'POST', headers: JSON_HEADERS, body });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

export async function pushDelete(resource: string, id: string) {
  const remote = await findRemote(resource, id);
  if (!remote) return;
  const res = await request(`${API_BASE}/${resource}/${remote.id}`, { method: 'DELETE' });
  if (!res.ok && res.status !== 404) throw new Error(`HTTP ${res.status}`);
}

export async function fetchAll(resource: string): Promise<any[]> {
  const res = await request(`${API_BASE}/${resource}`);
  if (res.status === 404) return [];
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const arr = await res.json();
  return Array.isArray(arr) ? arr : [];
}
