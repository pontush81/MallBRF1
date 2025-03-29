import { httpClient } from './httpClient';
import { AxiosRequestConfig } from 'axios';

export class BaseService {
  protected endpoint: string;
  
  constructor(endpoint: string) {
    this.endpoint = endpoint;
  }
  
  protected async get<T>(path: string = '', config?: AxiosRequestConfig): Promise<T> {
    try {
      console.log(`Calling API: GET ${this.endpoint}${path}`);
      const response = await httpClient.get(`${this.endpoint}${path}`, config);
      console.log(`API response for GET ${this.endpoint}${path}:`, {
        status: response.status,
        dataType: typeof response.data,
        isArray: Array.isArray(response.data),
        dataLength: Array.isArray(response.data) ? response.data.length : null
      });
      return response.data;
    } catch (error) {
      console.error(`Error in GET ${this.endpoint}${path}:`, error);
      console.error('Request details:', {
        endpoint: this.endpoint,
        path,
        fullUrl: `${this.endpoint}${path}`,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }
  
  protected async post<T>(path: string = '', data: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await httpClient.post(`${this.endpoint}${path}`, data, config);
      return response.data;
    } catch (error) {
      console.error(`Error in POST ${this.endpoint}${path}:`, error);
      throw error;
    }
  }
  
  protected async put<T>(path: string = '', data: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await httpClient.put(`${this.endpoint}${path}`, data, config);
      return response.data;
    } catch (error) {
      console.error(`Error in PUT ${this.endpoint}${path}:`, error);
      throw error;
    }
  }
  
  protected async delete<T>(path: string = '', config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await httpClient.delete(`${this.endpoint}${path}`, config);
      return response.data;
    } catch (error) {
      console.error(`Error in DELETE ${this.endpoint}${path}:`, error);
      throw error;
    }
  }
  
  // Helper method for handling API errors
  protected handleApiError(error: any, defaultMessage: string = 'Ett fel uppstod'): null {
    if (error.response) {
      // Specific handling for status codes if needed
      if (error.response.status === 404) {
        console.log('Resource not found');
      } else if (error.response.status === 409) {
        console.log('Conflict detected');
      }
      
      // Log the error
      console.error('API error:', error.response.status, error.response.data);
    } else {
      console.error(defaultMessage, error);
    }
    return null;
  }
} 