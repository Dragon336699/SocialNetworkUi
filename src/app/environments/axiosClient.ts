import axios from 'axios'
import { API_AI_URL, API_BASE_URL } from '../environments/environment'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' }
})

export const apiAIClient = axios.create({
  baseURL: API_AI_URL,
  headers: { 'Content-Type': 'application/json' }
})
