const API_BASE = import.meta.env.VITE_API_BASE_URL
	? `${import.meta.env.VITE_API_BASE_URL}/api`
	: '/api';

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
	const res = await fetch(`${API_BASE}${path}`, {
		...options,
		headers: { 'Content-Type': 'application/json', ...options?.headers },
	});
	if (!res.ok) {
		const err = await res.json().catch(() => ({ error: res.statusText }));
		throw new Error((err as { error?: string }).error ?? `HTTP ${res.status}`);
	}
	return res.json() as Promise<T>;
}

export { apiFetch };
