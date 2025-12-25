import { apiClient } from '../environments/axiosClient'

export const interactionService = {
  searchUser(targetUserId: string) {
    apiClient.post(
      `interaction/search`,
      { targetUserId: targetUserId },
      {
        withCredentials: true
      }
    )
  },

  viewUser(targetUserId: string) {
    apiClient.post(
      `interaction/view`,
      { targetUserId: targetUserId },
      {
        withCredentials: true
      }
    )
  },

  likePostOfUser(targetUserId: string) {
    apiClient.post(
      `interaction/like`,
      { targetUserId: targetUserId },
      {
        withCredentials: true
      }
    )
  },
}
