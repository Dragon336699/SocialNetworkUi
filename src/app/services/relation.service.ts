import { apiClient } from '../environments/axiosClient'
import { BaseResponse } from '../types/Base/Responses/baseResponse'
import { ResponseHasData } from '../types/Base/Responses/ResponseHasData'
import { UserDto } from '../types/User/user.dto'
import { SentFriendRequestData, SuggestUsers } from '../types/UserRelation/userRelation'

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

  async approveFriendRequest(senderId: string): Promise<{ data: BaseResponse; status: number }> {
    const response = await apiClient.post<BaseResponse>(
      `friend-request/approve`,
      { senderId: senderId },
      {
        withCredentials: true
      }
    )
    return { data: response.data, status: response.status }
  },

  async declineFriendRequest(senderId: string): Promise<{ data: BaseResponse; status: number }> {
    const response = await apiClient.post<BaseResponse>(
      `friend-request/decline`,
      { senderId: senderId },
      {
        withCredentials: true
      }
    )
    return { data: response.data, status: response.status }
  },

  async getFriendRequestsReceived(
    page?: number,
    pageSize?: number
  ): Promise<{ data: BaseResponse | ResponseHasData<SentFriendRequestData[]>; status: number }> {
    const response = await apiClient.get<BaseResponse | ResponseHasData<SentFriendRequestData[]>>(
      `friend-request/received`,
      {
        params: { page, pageSize },
        withCredentials: true
      }
    )
    return { data: response.data, status: response.status }
  },

  async getFriendRequestsSent(
    page?: number,
    pageSize?: number
  ): Promise<{ data: ResponseHasData<SentFriendRequestData[]>; status: number }> {
    const response = await apiClient.get<ResponseHasData<SentFriendRequestData[]>>(`friend-request/sent`, {
      params: { page, pageSize },
      withCredentials: true
    })
    return { data: response.data, status: response.status }
  },

  async getFriendsList(
    userId?: string,
    skip?: number,
    take?: number
  ): Promise<{ data: ResponseHasData<UserDto[]>; status: number }> {
    const response = await apiClient.get<ResponseHasData<UserDto[]>>(`user-relation/friends`, {
      params: { userId, skip, take },
      withCredentials: true
    })
    return { data: response.data, status: response.status }
  },

  async unFriend(userId: string): Promise<{ data: BaseResponse; status: number }> {
    const response = await apiClient.post<BaseResponse>(
      `user-relation/unfriend`,
      { targetUserId: userId },
      {
        withCredentials: true
      }
    )
    return { data: response.data, status: response.status }
  },

  async followUser(userId: string): Promise<{ data: BaseResponse; status: number }> {
    const response = await apiClient.post<BaseResponse>(
      `user-relation/follow`,
      { targetUserId: userId },
      {
        withCredentials: true
      }
    )
    return { data: response.data, status: response.status }
  },

  async unfollowUser(userId: string): Promise<{ data: BaseResponse; status: number }> {
    const response = await apiClient.post<BaseResponse>(
      `user-relation/unfollow`,
      { targetUserId: userId },
      {
        withCredentials: true
      }
    )
    return { data: response.data, status: response.status }
  },

  async getFollowersList(
    userId?: string,
    skip?: number,
    take?: number
  ): Promise<{ data: ResponseHasData<UserDto[]>; status: number }> {
    const response = await apiClient.get<ResponseHasData<UserDto[]>>(`user-relation/followers`, {
      params: { userId, skip, take },
      withCredentials: true
    })
    return { data: response.data, status: response.status }
  },

  async getFollowingList(
    userId?: string,
    skip?: number,
    take?: number
  ): Promise<{ data: ResponseHasData<UserDto[]>; status: number }> {
    const response = await apiClient.get<ResponseHasData<UserDto[]>>(`user-relation/following`, {
      params: { userId, skip, take },
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

  async cancelFriendRequest(receiverId: string): Promise<{ data: BaseResponse; status: number }> {
    const response = await apiClient.post<BaseResponse>(
      `/friend-request/cancel`,
      { receiverId: receiverId },
      {
        withCredentials: true
      }
    )
    return { data: response.data, status: response.status }
  },

  async getSuggestFriends(
    skip?: number,
    take?: number
  ): Promise<{ data: ResponseHasData<SuggestUsers[]>; status: number }> {
    const response = await apiClient.get<ResponseHasData<SuggestUsers[]>>(`user-relation/suggest`, {
      params: { skip, take },
      withCredentials: true
    })
    return { data: response.data, status: response.status }
  },

  async blockUser(userId: string): Promise<{ data: BaseResponse; status: number }> {
    const response = await apiClient.post<BaseResponse>(
      `user-relation/block`,
      { targetUserId: userId },
      {
        withCredentials: true
      }
    )
    return { data: response.data, status: response.status }
  },

  async unblockUser(userId: string): Promise<{ data: BaseResponse; status: number }> {
    const response = await apiClient.post<BaseResponse>(
      `user-relation/unblock`,
      { targetUserId: userId },
      {
        withCredentials: true
      }
    )
    return { data: response.data, status: response.status }
  },

  async getBlockedUsers(skip?: number, take?: number): Promise<{ data: ResponseHasData<UserDto[]>; status: number }> {
    const response = await apiClient.get<ResponseHasData<UserDto[]>>(`user-relation/blocked-users`, {
      params: { skip, take },
      withCredentials: true
    })
    return { data: response.data, status: response.status }
  }
}
