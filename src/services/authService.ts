import { api } from '@/lib/api';
import type { User } from '@/types';
import { z } from 'zod';

export const loginSchema = z.object({
  emailOrUsername: z.string().min(1, "Email or username is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type LoginData = z.infer<typeof loginSchema>;

interface LoginResponse {
  success: boolean;
  user: User;
  message: string;
}
interface GenericSuccessResponse {
  success: boolean;
  message: string;
}

export const authService = {
  async login(data: LoginData): Promise<LoginResponse> {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  async logout(): Promise<{ success: boolean; message: string }> {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  async checkAuth(): Promise<{ success: boolean; user: User }> {
    const response = await api.get('/auth/check-auth');
    return response.data;
  },
  async refreshToken  (): Promise<GenericSuccessResponse>  {
    const response = await api.get('/auth/refresh');
    return response.data;
  }
  
};