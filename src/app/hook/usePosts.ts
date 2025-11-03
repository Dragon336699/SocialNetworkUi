import { useState, useEffect, useCallback } from 'react'
import { PostData } from '../types/Post/Post'
import { postService } from '../services/post.service'
import { message } from 'antd'

interface UsePostsReturn {
  posts: PostData[]
  loading: boolean
  error: string | null
  hasMore: boolean
  createPost: (formData: FormData) => Promise<boolean>
  loadMore: () => Promise<void>
  refetch: () => Promise<void>
  clearError: () => void
}

const POSTS_PER_PAGE = 10

export const usePosts = (): UsePostsReturn => {
  const [posts, setPosts] = useState<PostData[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState<boolean>(true)
  const [currentSkip, setCurrentSkip] = useState<number>(0)

  // Chuyển đổi dữ liệu bài đăng
  const transformPostData = (post: any): PostData => {
    return {
      ...post,
      postPrivacy: post.postPrivacy || 'Public',
      user: {
        id: post.userId || post.user?.id || '',
        firstName: post.user?.firstName || 'Unknown',
        lastName: post.user?.lastName || 'User',
        avatar: post.user?.avatarUrl || `https://api.dicebear.com/7.x/miniavs/svg?seed=${post.userId}`
      },
      postImages: post.postImages || []
    }
  }

  // Lấy danh sách bài đăng
  const fetchPosts = useCallback(
    async (reset: boolean = false) => {
      if (loading) return

      try {
        setLoading(true)
        setError(null)

        const skip = reset ? 0 : currentSkip
        const response = await postService.getAllPosts(skip, POSTS_PER_PAGE)

        if (response.message && response.message.includes('successfully')) {
          const postsData = response.posts || []
          const transformedData = postsData.map(transformPostData)

          if (reset) {
            setPosts(transformedData)
            setCurrentSkip(POSTS_PER_PAGE)
          } else {
            setPosts(prev => [...prev, ...transformedData])
            setCurrentSkip(prev => prev + POSTS_PER_PAGE)
          }
          // Kiểm tra còn bài đăng để tải không
          setHasMore(transformedData.length === POSTS_PER_PAGE)
        } else {
          throw new Error('Failed to load posts')
        }
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || error.message || 'Failed to load posts'
        setError(errorMessage)
        message.error(errorMessage)
      } finally {
        setLoading(false)
      }
    },
    [currentSkip, loading]
  )

  // Tạo bài đăng mới
  const createPost = useCallback(
    async (formData: FormData): Promise<boolean> => {
      try {
        setLoading(true)
        setError(null)

        const response = await postService.createPost(formData)

        if (response.message) {
          setCurrentSkip(0)
          await fetchPosts(true)
          message.success('Post created successfully!')
          return true
        } else {
          throw new Error(response.message || 'Failed to create post')
        }
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || 'Failed to create post'
        setError(errorMessage)
        message.error(errorMessage)
        return false
      } finally {
        setLoading(false)
      }
    },
    [fetchPosts]
  )

  // Tải thêm bài đăng
  const loadMore = useCallback(async () => {
    if (!loading && hasMore) {
      await fetchPosts(false)
    }
  }, [fetchPosts, loading, hasMore])

  // Làm mới danh sách bài đăng
  const refetch = useCallback(async () => {
    setCurrentSkip(0)
    await fetchPosts(true)
  }, [fetchPosts])

  // Xóa thông báo lỗi
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Tải bài đăng lần đầu khi component được gắn
  useEffect(() => {
    fetchPosts(true)
  },[])

  return {
    posts,
    loading,
    error,
    hasMore,
    createPost,
    loadMore,
    refetch,
    clearError
  }
}