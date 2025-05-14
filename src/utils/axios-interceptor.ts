import axios from 'axios'

const createAPIResource = (accessToken: string) => {
  const instance = axios.create({
    baseURL: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1`,
  })

  instance.interceptors.request.use(
    config => {
      if (accessToken) {
        config.headers['Authorization'] = `Bearer ${accessToken}`
      }
      if (config.data instanceof FormData) {
        config.headers['Content-Type'] = 'multipart/form-data'
      } else {
        config.headers['Content-Type'] = 'application/json'
      }
      return config
    },
    (error: { response: { data: any } }) => {
      console.error('Request error:', error)
      return Promise.reject(error?.response?.data ?? error)
    },
  )

  instance.interceptors.response.use(
    response => {
      return response?.data || {}
    },
    error => {
      return Promise.reject(error?.response?.data ?? error)
    },
  )

  return instance
}

export { createAPIResource }
