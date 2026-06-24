import axios from 'axios'

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5002'}/api`

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      const refreshToken = localStorage.getItem('refreshToken')
      if (refreshToken) {
        try {
          const res = await axios.post(`${API_URL}/auth/refresh`, { refreshToken })
          const { accessToken, refreshToken: newRefresh } = res.data.data
          localStorage.setItem('accessToken', accessToken)
          localStorage.setItem('refreshToken', newRefresh)
          original.headers.Authorization = `Bearer ${accessToken}`
          return api(original)
        } catch {
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  }
)

export const authAPI = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/profile'),
  refreshToken: (token: string) => api.post('/auth/refresh', { refreshToken: token }),
}

export const documentAPI = {
  upload: (formData: FormData) => api.post('/documents', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getAll: () => api.get('/documents'),
  getById: (id: string) => api.get(`/documents/${id}`),
  addSigners: (id: string, signers: any[]) => api.post(`/documents/${id}/signers`, { signers }),
  addFields: (id: string, fields: any[]) => api.post(`/documents/${id}/fields`, { fields }),
  send: (id: string) => api.post(`/documents/${id}/send`),
  delete: (id: string) => api.delete(`/documents/${id}`),
}

export const signingAPI = {
  getByToken: (token: string) => api.get(`/sign/${token}`),
  sign: (token: string, signatures: any[]) => api.post(`/sign/${token}/sign`, { signatures }),
  decline: (token: string, reason?: string) => api.post(`/sign/${token}/decline`, { reason }),
}

export default api
