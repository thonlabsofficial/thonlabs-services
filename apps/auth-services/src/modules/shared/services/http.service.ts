import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

@Injectable()
export class HTTPService {
  private readonly logger = new Logger(HTTPService.name);
  private readonly http: AxiosInstance;
  private readonly deductedFields = [
    'password',
    'client_id',
    'client_secret',
    'token',
    'code',
    'access_token',
    'refresh_token',
    'id_token',
    'email',
  ];

  constructor() {
    this.http = axios.create();
  }

  private async request(options: AxiosRequestConfig): Promise<AxiosResponse> {
    this.logger.log(
      `Req ${options.method} ${options.url} ${JSON.stringify(this.sanitize(options.data))}`,
    );

    const response = await this.http.request(options);

    this.logger.log(
      `Res ${options.method} ${options.url} ${JSON.stringify(this.sanitize(response.data))}`,
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

  private sanitize(data: any) {
    if (typeof data === 'object') {
      data = Object.keys(data).reduce((acc, key) => {
        if (this.deductedFields.includes(key)) {
          acc[key] = '****';
        } else {
          acc[key] = data[key];
        }

        return acc;
      }, {});
    } else if (typeof data === 'string') {
      const params = new URLSearchParams(data);
      const maskedParams = new URLSearchParams();
      for (const [key, value] of params.entries()) {
        if (this.deductedFields.includes(key)) {
          maskedParams.append(key, '****');
        } else {
          maskedParams.append(key, value);
        }
      }
      data = maskedParams.toString();
    }

    return data;
  }
}
