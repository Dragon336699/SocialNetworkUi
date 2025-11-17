import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import Cookies from 'js-cookie'
import { userService } from '@/app/services/user.service'
import { UserDto } from '../types/User/user.dto'

interface UserState {
  isLoggedIn: boolean
  user: UserDto | null
  setUser: (user: UserDto) => void
  setIsLoggedIn: (isLoggedIn: boolean) => void
  fetchUser: () => Promise<void>
  logout: () => void
}

const cookieStorage = createJSONStorage(() => ({
  getItem: (name: string): string | null => Cookies.get(name) ?? null,
  setItem: (name: string, value: string): void => {
    Cookies.set(name, value, {
      expires: 7,
      path: '/',
      secure: true,
      sameSite: 'Lax'
    })
  },
  removeItem: (name: string): void => {
    Cookies.remove(name)
  }
}))

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      isLoggedIn: false,
      user: null,

      setUser: (user) => set({ user }),
      setIsLoggedIn: (isLoggedIn) => set({ isLoggedIn }),

      logout: () => {
        set({ isLoggedIn: false, user: null })
        Cookies.remove('user-storage')
      },

      fetchUser: async () => {
        try {
          const res = await userService.getUserInfoByToken()
          if (res.status === 200 && res.data) {
            const resData = res.data as UserDto
            set({ user: resData, isLoggedIn: true })
          } else {
            set({ user: null, isLoggedIn: false })
          }
        } catch {
          set({ user: null, isLoggedIn: false })
        }
      }
    }),
    {
      name: 'user-storage',
      storage: cookieStorage,
      partialize: (state) => ({
        isLoggedIn: state.isLoggedIn,
        user: state.user
      })
    }
  )
)
