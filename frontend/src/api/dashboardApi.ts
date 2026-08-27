import type { Dashboard } from '../types'
import { request } from './http'
export const dashboardApi = { get: () => request<Dashboard>('/dashboard') }
