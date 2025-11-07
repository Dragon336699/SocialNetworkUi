import React, { createContext, ReactNode, useContext, useState } from 'react'
const UnreadContext = createContext<any>(null)

export function UnreadProvider({ children }: { children: ReactNode }) {
  const [unreadMessages, setUnreadMessages] = useState(0)

  return <UnreadContext.Provider value={{ unreadMessages, setUnreadMessages }}>{children}</UnreadContext.Provider>
}

export function useUnread() {
  return useContext(UnreadContext)
}
