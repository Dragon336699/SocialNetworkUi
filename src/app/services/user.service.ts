import { apiClient } from '../environments/axiosClient'
import { GoogleLoginRequest } from '../types/User/Request/googleLoginReq'
import { LoginRequest, RegisterRequest } from '../types/User/Request/loginReq'
import { LoginResponse } from '../types/User/Response/loginResponse'

export const userService = {
  async login(loginRequest: LoginRequest): Promise<LoginResponse> {
    const { data } = await apiClient.post<LoginResponse>('user/login', loginRequest)
    return data
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
