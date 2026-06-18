import { injectable } from 'tsyringe';
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';

type BackendRequestConfig = AxiosRequestConfig & {
  token?: string;
};

interface BackendResponse<T> {
  message: string;
  data: T
}

@injectable()
export class BackendDataSource {
  private readonly url: string|undefined;
  private readonly client: AxiosInstance;
  private authToken: string | null = null;

  constructor() {
    this.url = process.env.EXPO_PUBLIC_BACKEND_URL;

    if (!this.url) {
      throw new Error('Backend URL not found in environment variables');
    }

    this.client = axios.create({
      baseURL: this.url,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  setAuthToken(token: string | null): void {
    this.authToken = token;
  }

  async get<TResponse>(
    path: string,
    config?: BackendRequestConfig
  ): Promise<TResponse> {
    try {
      const response = await this.client.get<BackendResponse<TResponse>>(path, this.buildConfig(config));
      return response.data.data;
    } catch (error) {
      throw this.toDatasourceError(error);
    }
  }

  async post<TResponse, TBody = unknown>(
    path: string,
    body?: TBody,
    config?: BackendRequestConfig
  ): Promise<TResponse> {
    try {
      const response = await this.client.post<BackendResponse<TResponse>>(path, body, this.buildConfig(config));
      console.log(path)
      console.log(response.data.data)
      return response.data.data;
    } catch (error) {
      throw this.toDatasourceError(error);
    }
  }

  async put<TResponse, TBody = unknown>(
    path: string,
    body?: TBody,
    config?: BackendRequestConfig
  ): Promise<TResponse> {
    try {
      const response = await this.client.put<BackendResponse<TResponse>>(path, body, this.buildConfig(config));
      return response.data.data;
    } catch (error) {
      throw this.toDatasourceError(error);
    }
  }

  async patch<TResponse, TBody = unknown>(
    path: string,
    body?: TBody,
    config?: BackendRequestConfig
  ): Promise<TResponse> {
    try {
      const response = await this.client.patch<BackendResponse<TResponse>>(path, body, this.buildConfig(config));
      return response.data.data;
    } catch (error) {
      throw this.toDatasourceError(error);
    }
  }

  private buildConfig(config?: BackendRequestConfig): AxiosRequestConfig {
    const requestToken = config?.token ?? this.authToken;
    const authorization = requestToken
      ? requestToken.startsWith('Bearer ')
        ? requestToken
        : `Bearer ${requestToken}`
      : null;

    const headers = {
      ...(config?.headers ?? {}),
      ...(authorization ? { Authorization: authorization } : {}),
    };

    const { token: _token, ...axiosConfig } = config ?? {};

    return {
      ...axiosConfig,
      headers,
    };
  }

  private toDatasourceError(error: unknown): Error {
    if (!axios.isAxiosError(error)) {
      return new Error('Unexpected error calling backend API');
    }

    const axiosError = error as AxiosError<{ message?: string }>;
    const status = axiosError.response?.status;
    const message =
      axiosError.response?.data?.message ??
      axiosError.message ??
      'Backend request failed';

    return new Error(status ? `[${status}] ${message}` : message);
  }

}