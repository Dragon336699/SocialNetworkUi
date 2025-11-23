import { apiClient } from '../environments/axiosClient'
import { BaseResponse } from '../types/Base/Responses/baseResponse'
import { SentFriendRequestData } from '../types/Relations/relations'

export const relationService = {
  async addFriend(userId: string): Promise<{ data: BaseResponse; status: number }> {
    const response = await apiClient.post<BaseResponse>(
      `/friend-request/send`,
      { receiverId: userId },
      {
        withCredentials: true
      }
    )
    return { data: response.data, status: response.status }
  },

  async cancelFriendRequest(userId: string): Promise<{ data: BaseResponse; status: number }> {
    const response = await apiClient.post<BaseResponse>(
      `/friend-request/cancel`,
      { receiverId: userId },
      {
        withCredentials: true
      }
    )
    return { data: response.data, status: response.status }
  },

  async getSentFriendRequest(
    userId: string,
    skip?: number,
    take?: number
  ): Promise<{ data: SentFriendRequestData[]; status: number }> {
    const response = await apiClient.get<SentFriendRequestData[]>(`/friend-request/sent/${userId}`, {
      params: { skip, take },
      withCredentials: true
    })
    return { data: response.data, status: response.status }
  }
}
