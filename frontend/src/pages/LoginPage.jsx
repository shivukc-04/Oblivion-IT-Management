import { Link, useNavigate } from 'react-router'
import { ArrowLeftIcon } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import axios from 'axios'
const LoginPage = () => {
    const [userId, setuserId] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLaoding] = useState(false)
    const navigate = useNavigate("/")
    async function handleSubmit(e){
        e.preventDefault()//prevent refresh
        if(!userId.trim() || !password.trim()){
            toast.error("Required Fields are Empty")
            return
        }
        setLaoding(true)
        try {
            //get thr response from backend
            const res = await axios.post("http://localhost:5250/api/auth/login", {userId, password})
            const {token, user} = res.data
            // store token in localStorage for testing ONLY
            localStorage.setItem("authToken", token)
            localStorage.setItem("userRole", user.role)
            toast.success("You are Logged In")
            navigate("/")
        } catch (error) {
            if (error.response.status === 401){
              toast.error("userId or password is wrong")
              return
            }
            if(error.response.status === 404){
              toast.error("unable to login")
              console.error(error)
              return
            }
        }finally{
            setLaoding(false)
        }
    }

  return (
    <div  data-theme = 'fantasy' className='min-h-screen bg-base-200'>
      <div className='container mx-auto px-4 py-8'>
        <div className='max-w-2xl mx-auto'>
          <Link to = {"/"} className='btn btn-ghost mb-6'>
          <ArrowLeftIcon className='size-5'/>
          Back to Home
          </Link>
          <div className='card bg-base-100'>
            <div className='card-body'>
              <h2 className='card-title text-4xl mx-auto my-auto'>Login</h2>
              <form onSubmit={handleSubmit}>
                <div className='form-control mb-4'>
                  <label className='label'>
                    <span className='label-text'>userId</span>
                  </label>
                  <input type = "text" placeholder='Type your userId' className='input input-bordered' value = {userId} onChange={(e)=>setuserId(e.target.value)}/>
                </div>
                <div className='form-control mb-4'>
                  <label className='label'>
                    <span className='label-text'>Password</span>
                  </label>
                  <input type = 'password' placeholder='Type your password' className='input input-bordered' value = {password} onChange={(e)=>setPassword(e.target.value)}/>
                </div>
                <div className='card-actions justify-end'>
                  <button type = "submit" className='btn btn-secondary' disabled = {loading}>
                    {loading? "Logging in...": "Login"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
