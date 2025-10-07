export interface LoginRequest {
  email: string
  password: string
}

export interface RequestOTPRequest {
  email: string
}

export interface VerifyOTPRequest {
  email: string
  otp: string
}

export interface ResetPasswordRequest {
  email: string
  resetPasswordToken: string
  newPassword: string
}