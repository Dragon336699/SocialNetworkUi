import { apiClient } from '../environments/axiosClient'
import { BaseResponse } from '../types/Base/Responses/baseResponse'
import { GetAllPostsResponse, GetPostByIdResponse, UpdatePostResponse, DeletePostResponse } from '../types/Post/Post'

export const postService = {
  async createPost(formData: FormData): Promise<BaseResponse> {
    const { data } = await apiClient.post<BaseResponse>('post/create', formData, {
      withCredentials: true,
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return data
  },

  async getAllPosts(skip: number = 0, take: number = 10): Promise<GetAllPostsResponse> {
    const { data } = await apiClient.get('post/all', {
      params: { skip, take },
      withCredentials: true
    })
    return data
  },

  async getPostById(postId: string): Promise<GetPostByIdResponse> {
    const { data } = await apiClient.get<GetPostByIdResponse>(`post/${postId}`, {
      withCredentials: true
    })
    return data
  },

  async updatePost(postId: string, formData: FormData): Promise<UpdatePostResponse> {
    const { data } = await apiClient.put<UpdatePostResponse>(`post/${postId}`, formData, {
      withCredentials: true,
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return data
  },

  async deletePost(postId: string): Promise<DeletePostResponse> {
    const { data } = await apiClient.delete<DeletePostResponse>(`post/${postId}`, {
      withCredentials: true
    })
    return data
  }
}