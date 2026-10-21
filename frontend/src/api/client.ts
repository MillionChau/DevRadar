/**
 * DevRadar API HTTP Client
 * Kết nối tập trung qua YARP API Gateway (http://localhost:5000).
 * Tự động chèn Bearer Token, xử lý refresh token khi 401 và logging lỗi.
 */

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:5000';

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined | null>;
  skipAuth?: boolean;
}

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

class ApiClient {
  private baseUrl: string;
  private isRefreshing = false;
  private refreshSubscribers: Array<(token: string) => void> = [];

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  private getAccessToken(): string | null {
    return localStorage.getItem('devradar_access_token');
  }

  private getRefreshToken(): string | null {
    return localStorage.getItem('devradar_refresh_token');
  }

  private setTokens(accessToken: string, refreshToken?: string) {
    localStorage.setItem('devradar_access_token', accessToken);
    if (refreshToken) {
      localStorage.setItem('devradar_refresh_token', refreshToken);
    }
  }

  public clearTokens() {
    localStorage.removeItem('devradar_access_token');
    localStorage.removeItem('devradar_refresh_token');
    localStorage.removeItem('devradar_user');
  }

  private onTokenRefreshed(token: string) {
    this.refreshSubscribers.forEach((cb) => cb(token));
    this.refreshSubscribers = [];
  }

  private addRefreshSubscriber(cb: (token: string) => void) {
    this.refreshSubscribers.push(cb);
  }

  private async refreshAuthToken(): Promise<string | null> {
    const refreshToken = this.getRefreshToken();
    const accessToken = this.getAccessToken();

    if (!refreshToken || !accessToken) {
      this.clearTokens();
      return null;
    }

    try {
      const response = await fetch(`${this.baseUrl}/identity/api/v1/Auth/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accessToken, refreshToken }),
      });

      if (!response.ok) {
        this.clearTokens();
        return null;
      }

      const resData = await response.json();
      const newAccessToken = resData.data?.accessToken || resData.accessToken;
      const newRefreshToken = resData.data?.refreshToken || resData.refreshToken;

      if (newAccessToken) {
        this.setTokens(newAccessToken, newRefreshToken);
        return newAccessToken;
      }
      return null;
    } catch {
      this.clearTokens();
      return null;
    }
  }

  public async request<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { params, skipAuth = false, headers = {}, ...customConfig } = options;

    let url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

    if (params) {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
      const queryString = queryParams.toString();
      if (queryString) {
        url += (url.includes('?') ? '&' : '?') + queryString;
      }
    }

    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    if (!skipAuth) {
      const token = this.getAccessToken();
      if (token) {
        defaultHeaders['Authorization'] = `Bearer ${token}`;
      }
    }

    const config: RequestInit = {
      ...customConfig,
      headers: {
        ...defaultHeaders,
        ...(headers as Record<string, string>),
      },
    };

    try {
      const response = await fetch(url, config);

      // Xử lý 401: Thử làm mới token và gọi lại
      if (response.status === 401 && !skipAuth) {
        if (!this.isRefreshing) {
          this.isRefreshing = true;
          const newToken = await this.refreshAuthToken();
          this.isRefreshing = false;

          if (newToken) {
            this.onTokenRefreshed(newToken);
            return this.request<T>(endpoint, options);
          }
        } else {
          // Đang có luồng làm mới, đợi token mới
          return new Promise<T>((resolve, reject) => {
            this.addRefreshSubscriber(async (token: string) => {
              try {
                const retryConfig = {
                  ...options,
                  headers: {
                    ...(options.headers as Record<string, string>),
                    Authorization: `Bearer ${token}`,
                  },
                };
                const result = await this.request<T>(endpoint, retryConfig);
                resolve(result);
              } catch (err) {
                reject(err);
              }
            });
          });
        }
      }

      if (!response.ok) {
        let errorData: any;
        try {
          errorData = await response.json();
        } catch {
          errorData = { message: response.statusText };
        }
        const message = errorData?.message || errorData?.title || `Request failed with status ${response.status}`;
        throw new ApiError(response.status, message, errorData);
      }

      // Xử lý response rỗng (204 No Content)
      if (response.status === 204) {
        return null as unknown as T;
      }

      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(0, (error as Error).message || 'Lỗi kết nối mạng tới API Gateway');
    }
  }

  public get<T = any>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  public post<T = any>(endpoint: string, data?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  public put<T = any>(endpoint: string, data?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  public patch<T = any>(endpoint: string, data?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  public delete<T = any>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
export default apiClient;
