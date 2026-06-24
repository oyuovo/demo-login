import type {
  RegisterRequest,
  RegisterResponse,
  LoginRequest,
  LoginResponse,
  MeResponse,
  ResourceAContent,
  ResourceBContent,
  ApiError,
} from "@community-gate/contracts";

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl ?? "";
  }

  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = { ...options.headers as Record<string, string> ?? {} };
    if (options.body && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }

    const res = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers,
      credentials: "include",
    });

    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as ApiError;
      throw new ApiErrorResponse(res.status, body);
    }

    if (res.status === 204) return undefined as T;

    return res.json() as Promise<T>;
  }

  register(body: RegisterRequest): Promise<RegisterResponse> {
    return this.request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  login(body: LoginRequest): Promise<LoginResponse> {
    return this.request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  logout(): Promise<void> {
    return this.request("/api/auth/logout", { method: "POST" });
  }

  me(): Promise<MeResponse> {
    return this.request("/api/auth/me");
  }

  getResourceA(): Promise<ResourceAContent> {
    return this.request("/api/resources/a");
  }

  getResourceB(): Promise<ResourceBContent> {
    return this.request("/api/resources/b");
  }
}

export class ApiErrorResponse extends Error {
  status: number;
  body: ApiError;

  constructor(status: number, body: ApiError) {
    super(body.message ?? "请求失败");
    this.status = status;
    this.body = body;
  }
}

export const api = new ApiClient();
