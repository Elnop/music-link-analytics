const API_BASE = import.meta.env.VITE_API_BASE_URL
	? `${import.meta.env.VITE_API_BASE_URL}/api`
	: '/api';

export class ApiError extends Error {
	status: number;
	data?: Record<string, unknown>;

	constructor(message: string, status: number, data?: Record<string, unknown>) {
		super(message);
		this.status = status;
		this.data = data;
	}
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
	const res = await fetch(`${API_BASE}${path}`, {
		...options,
		headers: { 'Content-Type': 'application/json', ...options?.headers },
	});
	if (!res.ok) {
		const err = await res.json().catch(() => ({ error: res.statusText }));
		throw new ApiError((err as { error?: string }).error ?? `HTTP ${res.status}`, res.status, err);
	}
	return res.json() as Promise<T>;
}

export { apiFetch };
