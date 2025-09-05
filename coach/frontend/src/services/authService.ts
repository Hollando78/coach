import { apiClient } from './apiClient';
import { User } from '../types';

interface AuthResponse {
  user: User;
  message: string;
}

interface MeResponse {
  user: User | null;
}

class AuthService {
  async login(email: string, password: string): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>('/auth/login', { email, password });
  }

  async signup(email: string, password: string): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>('/auth/signup', { email, password });
  }

  async logout(): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>('/auth/logout');
  }

  async me(): Promise<MeResponse> {
    return apiClient.get<MeResponse>('/auth/me');
  }
}

export const authService = new AuthService();