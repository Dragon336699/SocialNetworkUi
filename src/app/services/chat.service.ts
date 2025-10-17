import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr'
import { CHAT_HUB_URL } from '../environments/environment'
import { SendMessageRequest } from '../types/Message/Requests/MessageReq'
import { SendMessageResponse } from '../types/Message/Responses/messageResponses'
import { MessageDto } from '../types/Message/messge.dto'
import { Message } from 'postcss'
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

  async acknowledgeMessage(messageId: string): Promise<boolean | null> {
    if (!connection) {
      console.log('Connection not ready yet!')
      return null
    }
    try {
      const updateMessageStatus = await connection.invoke<boolean>('AcknowledgeMessage', messageId)
      return updateMessageStatus
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
  }
}
