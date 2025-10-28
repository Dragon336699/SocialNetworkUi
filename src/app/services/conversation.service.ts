import { apiClient } from '../environments/axiosClient'
import { BaseResponse } from '../types/Base/Responses/baseResponse'
import { ResponseHasData } from '../types/Base/Responses/ResponseHasData'
import { ConversationDto } from '../types/Conversation/conversation.dto'

export const conversationService = {
  async getConversation(conversationId: string): Promise<{ data: BaseResponse | ConversationDto; status: number }> {
    const response = await apiClient.get<BaseResponse | ResponseHasData<ConversationDto>>(
      `conversation/getConversation?conversationId=${conversationId}`,
      {
        withCredentials: true
      }
    )
    return { data: response.data, status: response.status }
  },
  async getAllConversationsByUser(): Promise<{
    data: BaseResponse | ResponseHasData<ConversationDto[]>
    status: number
  }> {
    const response = await apiClient.get<BaseResponse | ResponseHasData<ConversationDto[]>>(
      `conversation/getAllConversationsByUser`,
      {
        withCredentials: true
      }
    )
    return { data: response.data, status: response.status }
  }
}
