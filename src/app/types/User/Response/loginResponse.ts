export interface LoginResponse {
  message: string
}

export interface BaseResponse {
  message: string
}

export interface VerifyOTPResponse extends BaseResponse {
  resetPasswordToken: string
}
