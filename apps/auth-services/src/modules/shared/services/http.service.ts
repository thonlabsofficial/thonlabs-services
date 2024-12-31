import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

@Injectable()
export class HTTPService {
  private readonly logger = new Logger(HTTPService.name);
  private readonly http: AxiosInstance;

  constructor() {
    this.http = axios.create();
  }

  private async request(options: AxiosRequestConfig): Promise<AxiosResponse> {
    const payload = options.data;

    this.logger.log(
      `Req ${options.method} ${options.url}: ${JSON.stringify(payload)}`,
    );

    const response = await this.http.request(options);

    this.logger.log(
      `Res ${options.method} ${options.url}: ${JSON.stringify(response.data)}`,
    );

    return response;
  }

  async get(options: AxiosRequestConfig): Promise<AxiosResponse> {
    return this.request({ ...options, method: 'GET' });
  }

  async post(options: AxiosRequestConfig): Promise<AxiosResponse> {
    return this.request({ ...options, method: 'POST' });
  }

  async put(options: AxiosRequestConfig): Promise<AxiosResponse> {
    return this.request({ ...options, method: 'PUT' });
  }

  async delete(options: AxiosRequestConfig): Promise<AxiosResponse> {
    return this.request({ ...options, method: 'DELETE' });
  }

  async patch(options: AxiosRequestConfig): Promise<AxiosResponse> {
    return this.request({ ...options, method: 'PATCH' });
  }
}
