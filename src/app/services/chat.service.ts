import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr'
import { CHAT_HUB_URL } from '../environments/environment'
import { SendMessageRequest } from '../types/Message/Requests/MessageReq'
import { SendMessageResponse } from '../types/Message/Responses/messageResponses'
let connection: HubConnection | null = null

export const chatService = {
  async start() {
    if (connection) return connection
    connection = new HubConnectionBuilder()
      .withUrl(CHAT_HUB_URL, { withCredentials: true })
      .configureLogging(LogLevel.Information)
      .withAutomaticReconnect()
      .build()

    try {
      await connection.start()
      console.log('SinalR connected')
    } catch (err) {
      console.log('SignalR connection failed', err)
    }
  },

  onReceivePrivateMessage(callback: (message: string) => void) {
    if (!connection) {
      console.log('Connection not ready yet!')
      return
    }
    connection.on('ReceivePrivateMessage', callback)
  },

  async onSendPrivateMessage(request: SendMessageRequest): Promise<SendMessageResponse | null> {
    if (!connection) {
      console.log('Connection not ready yet!')
      return null
    }
    try {
      const response =  await connection.invoke<SendMessageResponse>('SendMessage', request)
      return response
    } catch (err) {
      console.log(err)
      return null
    }
  }
}
