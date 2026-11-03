import { readFileSync } from 'node:fs';
import type { APIRequestContext } from '@playwright/test';

const API = 'http://localhost:3000/api/v1';

export function authHeaders() {
  const state = JSON.parse(readFileSync('e2e/.auth/admin.json', 'utf-8'));
  const origin = state.origins.find((o: { origin: string }) => o.origin.includes('4200'));
  const token = origin?.localStorage.find((i: { name: string }) => i.name === 'auth_token')?.value;
  return { Authorization: `Bearer ${token}` };
}

export async function getFirstRestaurantId(request: APIRequestContext): Promise<string> {
  const res = await request.get(`${API}/restaurants`, { headers: authHeaders() });
  const body = await res.json();
  const list = Array.isArray(body) ? body : body.data;
  return list[0].id;
}

export async function getFirstDishId(request: APIRequestContext, restaurantId: string): Promise<string> {
  const res = await request.get(`${API}/restaurants/${restaurantId}/dishes`, { headers: authHeaders() });
  const body = await res.json();
  const list = Array.isArray(body) ? body : body.data;
  return list[0].id;
}

export async function listDishes(request: APIRequestContext, restaurantId: string) {
  const res = await request.get(`${API}/restaurants/${restaurantId}/dishes`, { headers: authHeaders() });
  const body = await res.json();
  return (Array.isArray(body) ? body : body.data) as Array<{ id: string; name: string }>;
}

/** Borra por API los platos cuyo nombre coincide (limpieza de los platos creados por E2E). */
export async function deleteDishesByName(request: APIRequestContext, restaurantId: string, name: string) {
  for (const dish of (await listDishes(request, restaurantId)).filter((d) => d.name === name)) {
    await request.delete(`${API}/restaurants/${restaurantId}/dishes/${dish.id}`, { headers: authHeaders() });
  }
}
