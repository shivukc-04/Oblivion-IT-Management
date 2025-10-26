import axios from 'axios'

const api = axios.create({
    baseURL: 'http://localhost:5250/api'
})

//add token for every request
api.interceptors.request.use((config)=>{
    const token = localStorage.getItem("authToken")
    if (token) {
        //add token to 'Authorization' header
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
    },(error)=>{
        return Promise.reject(error)
    }
)
export default api
