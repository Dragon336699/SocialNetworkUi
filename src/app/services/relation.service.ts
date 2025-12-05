import { apiClient } from '../environments/axiosClient'
import { BaseResponse } from '../types/Base/Responses/baseResponse'
import { SentFriendRequestData } from '../types/Relations/relations'
import { RelationData } from '../types/UserRelation/userRelation'

export const relationService = {
  async addFriend(userId: string): Promise<{ data: BaseResponse; status: number }> {
    const response = await apiClient.post<BaseResponse>(
      `friend-request/send`,
      { receiverId: userId },
      {
        withCredentials: true
      }
    )
    return { data: response.data, status: response.status }
  },

  async respondFriendRequest(requestId: string, status: boolean): Promise<{ data: BaseResponse; status: number }> {
    const response = await apiClient.post<BaseResponse>(
      `friend-request/respond`,
      { requestId, status },
      {
        withCredentials: true
      }
    )
    return { data: response.data, status: response.status }
  },

  async getFriendRequestsReceived(page?: number, pageSize?: number): Promise<{ data: RelationData; status: number }> {
    const response = await apiClient.get<RelationData>(`friend-request/received`, {
      params: { page, pageSize },
      withCredentials: true
    })
    return { data: response.data, status: response.status }
  },

  async getFriendRequestsSent(page?: number, pageSize?: number): Promise<{ data: BaseResponse; status: number }> {
    const response = await apiClient.get<BaseResponse>(`friend-request/sent`, {
      params: { page, pageSize },
      withCredentials: true
    })
    return { data: response.data, status: response.status }
  },

  async getFriendsList(page?: number, pageSize?: number): Promise<{ data: RelationData; status: number }> {
    const response = await apiClient.get<RelationData>(`user-relation/friends`, {
      params: { page, pageSize },
      withCredentials: true
    })
    return { data: response.data, status: response.status }
  },

  async removeFriend(userId: string): Promise<{ data: BaseResponse; status: number }> {
    const response = await apiClient.delete<BaseResponse>(`user-relation/remove-friend`, {
      data: userId,
      withCredentials: true
    })
    return { data: response.data, status: response.status }
  },

  async followUser(userId: string): Promise<{ data: BaseResponse; status: number }> {
    const response = await apiClient.post<BaseResponse>(`user-relation/follow`, userId, {
      withCredentials: true
    })
    return { data: response.data, status: response.status }
  },

  async unfollowUser(userId: string): Promise<{ data: BaseResponse; status: number }> {
    const response = await apiClient.post<BaseResponse>(`user-relation/unfollow`, userId, {
      withCredentials: true
    })
    return { data: response.data, status: response.status }
  },

  async getFollowersList(page?: number, pageSize?: number): Promise<{ data: RelationData; status: number }> {
    const response = await apiClient.get<RelationData>(`user-relation/followers`, {
      params: { page, pageSize },
      withCredentials: true
    })
    return { data: response.data, status: response.status }
  },

  async getFollowingList(page?: number, pageSize?: number): Promise<{ data: RelationData; status: number }> {
    const response = await apiClient.get<RelationData>(`user-relation/following`, {
      params: { page, pageSize },
      withCredentials: true
    })
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
  }
}
