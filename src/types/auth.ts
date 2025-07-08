export interface AuthResult {
  success: boolean;
  error?: string;
  message?: string;
  profile?: Record<string, unknown>;
}

export interface LoginData {
  email: string;
  password: string;
  remember: boolean;
}

export interface ResetPasswordData {
  uid: string;
  token: string;
  newPassword: string;
  confirmPassword: string;
}
