import { apiClient } from '../environments/axiosClient'
import { LoginRequest, RequestOTPRequest, VerifyOTPRequest, ResetPasswordRequest, ChangePasswordRequest } from '../types/User/Request/loginReq'
import { LoginResponse, BaseResponse, VerifyOTPResponse } from '../types/User/Response/loginResponse'

export const userService = {
  async login(loginRequest: LoginRequest): Promise<LoginResponse> {
    const { data } = await apiClient.post<LoginResponse>('user/login', loginRequest)
    return data
  },

  async requestOTP(requestOTPRequest: RequestOTPRequest): Promise<BaseResponse> {
    const { data } = await apiClient.post<BaseResponse>('user/forgetPassword/getOTP', null,
      { params: { email: requestOTPRequest.email } 
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
  }
}
