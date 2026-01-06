import { HttpTransportType, HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr'
import { CHAT_HUB_URL } from '../environments/environment'
import { SendMessageRequest } from '../types/Message/Requests/MessageReq'
import { SendMessageResponse } from '../types/Message/Responses/messageResponses'
import { MessageDto } from '../types/Message/messge.dto'
import { UpdateStatusMessageRequest } from '../types/Message/Requests/updateStatusMessageReq'
import { UserDto } from '../types/User/user.dto'
import { NotificationDto } from '../types/Notification/notification.dto'
import { ResponseHasData } from '../types/Base/Responses/ResponseHasData'
import { apiAIClient } from '../environments/axiosClient'
let connection: HubConnection | null = null

export const chatService = {
  async start(
    onPrivateMessage?: (msg: MessageDto) => void,
    onNotification?: (noti: NotificationDto) => void,
    onUpdateUser?: (user: UserDto) => void
  ) {
    if (connection) return connection
    connection = new HubConnectionBuilder()
      .withUrl(CHAT_HUB_URL, {
        withCredentials: true,
        transport: HttpTransportType.WebSockets | HttpTransportType.LongPolling,
        skipNegotiation: false
      })
      .configureLogging(LogLevel.Information)
      .withAutomaticReconnect()
      .build()

    try {
      if (onPrivateMessage) {
        connection.on('ReceivePrivateMessage', onPrivateMessage)
      }

      if (onNotification) {
        connection.on('SendPrivateNoti', onNotification)
      }
      await connection.start()
      console.log('SinalR connected')
    } catch (err) {
      console.log('SignalR connection failed', err)
    }
  },

  onReceivePrivateMessage(callback: (privateResponse: MessageDto) => void) {
    if (!connection) {
      console.log('Connection not ready yet!')
      return
    }
    connection.on('ReceivePrivateMessage', callback)
  },

  offReceivePrivateMessage() {
    if (!connection) {
      console.log('Connection not ready yet!')
      return
    }
    connection?.off('ReceivePrivateMessage')
  },

  async onSendPrivateMessage(request: SendMessageRequest): Promise<SendMessageResponse | null> {
    if (!connection) {
      console.log('Connection not ready yet!')
      return null
    }
    try {
      const response = await connection.invoke<SendMessageResponse>('SendMessage', request)
      return response
    } catch (err) {
      console.log(err)
      return null
    }
  },

  async updateMessageStatus(request: UpdateStatusMessageRequest): Promise<boolean | null> {
    if (!connection) {
      console.log('Connection not ready yet!')
      return null
    }
    try {
      const status = await connection.invoke<boolean>('UpdateMessageStatus', request)
      return status
    } catch (err) {
      return null
    }
  },

  getUpdatedMessage(callback: (newestMessage: MessageDto) => void) {
    if (!connection) {
      console.log('Connection not ready yet!')
      return
    }
    connection.on('UpdatedMessage', callback)
  },

  updateUser(callback: (user: UserDto) => void) {
    if (!connection) {
      console.log('Connection not ready yet!')
      return
    }
    connection.on('UpdateUser', callback)
  },

  updateNotification(callback: (noti: NotificationDto) => void) {
    if (!connection) {
      console.log('Connection not ready yet!')
      return
    }
    connection.on('SendPrivateNoti', callback)
  },

  async askChatbot(question: string): Promise<{ data: ResponseHasData<string>; status: number }> {
    const response = await apiAIClient.post<ResponseHasData<string>>(
      'chatbot/qa',
      { question },
      {
        withCredentials: true
      }
    )
    return { data: response.data, status: response.status }
  }
}
