import { apiClient } from '../environments/axiosClient'
import { BaseResponse } from '../types/Base/Responses/baseResponse'

export const relationService = {
  async addFriend(userId: string): Promise<{ data: BaseResponse; status: number }> {
    const response = await apiClient.post<BaseResponse>(`user/friend-request/send`, userId, {
      withCredentials: true
    })
    return { data: response.data, status: response.status }
  }
}
