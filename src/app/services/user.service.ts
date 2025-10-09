import { apiClient } from '../environments/axiosClient'
import { LoginResponse, BaseResponse, VerifyOTPResponse } from '../types/User/Response/loginResponse'
import { GoogleLoginRequest } from '../types/User/Request/User/googleLoginReq'
import { RegisterRequest } from '../types/User/Request/User/registerReq'
import { LoginRequest } from '../types/User/Request/User/loginReq'
import { RequestOTPRequest, VerifyOTPRequest } from '../types/User/Request/User/otpReq'
import { ChangePasswordRequest, ResetPasswordRequest } from '../types/User/Request/User/passwordReq'

export const userService = {
  async login(loginRequest: LoginRequest): Promise<LoginResponse> {
    const { data } = await apiClient.post<LoginResponse>('user/login', loginRequest)
    return data
  },

  async requestOTP(requestOTPRequest: RequestOTPRequest): Promise<BaseResponse> {
    const { data } = await apiClient.post<BaseResponse>('user/forgetPassword/getOTP', null, {
      params: { email: requestOTPRequest.email }
    })
    return data
  },

  async verifyOTP(verifyOTPRequest: VerifyOTPRequest): Promise<VerifyOTPResponse> {
    const { data: response } = await apiClient.post<VerifyOTPResponse>(
      'user/forgetPassword/validateOTP',
      verifyOTPRequest
    )
    return response
  },

  async resetPassword(resetPasswordRequest: ResetPasswordRequest): Promise<BaseResponse> {
    const { data: response } = await apiClient.post<BaseResponse>(
      'user/forgetPassword/resetPassword',
      resetPasswordRequest
    )
    return response
  },

  async changePassword(changePasswordRequest: ChangePasswordRequest): Promise<BaseResponse> {
    const { data: response } = await apiClient.post<BaseResponse>('user/changePassword', changePasswordRequest)
    return response
  },

  async register(registerRequest: RegisterRequest): Promise<LoginResponse> {
    const { data } = await apiClient.post<LoginResponse>('user/register', registerRequest)
    return data
  },

  async googleLogin(request: GoogleLoginRequest): Promise<LoginResponse> {
    const { data } = await apiClient.post<LoginResponse>('user/googleLogin', request)
    return data
  }
}
