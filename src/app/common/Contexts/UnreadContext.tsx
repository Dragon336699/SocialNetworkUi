import { chatService } from '@/app/services/chat.service'
import { messageService } from '@/app/services/message.service'
import { ResponseHasData } from '@/app/types/Base/Responses/ResponseHasData'
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react'
const UnreadContext = createContext<any>(null)

export function UnreadProvider({ children }: { children: ReactNode }) {
  const [unreadMessages, setUnreadMessages] = useState(0)
  const baseTitle = 'FriCon'

  const getUnreadMessage = async () => {
    const response = await messageService.getUnreadMessagesNumber()
    const resData = response.data as ResponseHasData<number>
    setUnreadMessages(resData.data as number)
    document.title = resData.data === 0 ? baseTitle : `(${resData.data}) ${baseTitle}`
  }

  useEffect(() => {
    getUnreadMessage()
    chatService.onReceivePrivateMessage(async (newReceivedMessage) => {
      const updateMessageStatus = await chatService.updateMessageStatus({
        messageId: newReceivedMessage.id,
        status: 'Delivered'
      })
      getUnreadMessage()
      if (!updateMessageStatus) return
    })
  }, [])

  return <UnreadContext.Provider value={{ unreadMessages, setUnreadMessages }}>{children}</UnreadContext.Provider>
}

export function useUnread() {
  return useContext(UnreadContext)
}
