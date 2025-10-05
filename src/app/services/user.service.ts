import { apiClient } from '../environments/axiosClient'
import { LoginRequest } from '../types/User/Request/loginReq'
import { LoginResponse } from '../types/User/Response/loginResponse'

export const userService = {
  async login(loginRequest: LoginRequest): Promise<LoginResponse> {
    const { data } = await apiClient.post<LoginResponse>('user/login', loginRequest)
    return data
  }
}
