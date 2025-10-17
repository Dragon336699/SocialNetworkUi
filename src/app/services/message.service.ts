import { apiClient } from '../environments/axiosClient'
import { BaseResponse } from '../types/Base/Responses/baseResponse'
import { ResponseHasData } from '../types/Base/Responses/ResponseHasData'
import { MessageDto } from '../types/Message/messge.dto'

export const messageService = {
  async getMessages(
    userId: string,
    receiverUserName: string,
    skip: number,
    take: number
  ): Promise<{ data: BaseResponse | MessageDto[]; status: number }> {
    const response = await apiClient.post<BaseResponse | ResponseHasData<MessageDto[]>>(
      'message/getMessages',
      {
        userId,
        receiverUserName,
        skip,
        take
      },
      {
        withCredentials: true
      }
    )
    return { data: response.data, status: response.status }
  }
}
