import React from 'react'
import { Link } from 'react-router'
import { ArrowLeftIcon } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import api from '../services/axiosConfig.js'
const RegisterPage = () => {
    const [userId, setuserId] = useState("")
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [email, setEmail] = useState("")
    const [role, setRole] = useState("")
    const [loading, setLaoding] = useState(false)
    async function handleSubmit(e) {
      e.preventDefault()
      if(!userId.trim() || !password.trim() || !username.trim() || !email.trim() || !role.trim()){
            toast.error("Required Fields are Empty")
            return
        }
        setLaoding(true)
        try {
            //get the response from backend
            await api.post("/auth/register", {userId, username, password, email, role})
            toast.success("New user created")
        } catch (error) {
            if (error.response.status === 409){
              toast.error("user already exists")
              return
            }
            if (err.response?.status === 403) {
              toast.error('Access denied. Insufficient Role');
              navigate('/');
              return;
            }
            if(error.response.status === 400){
              toast.error("Sign In failed")
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
              <h2 className='card-title text-4xl mx-auto my-auto'>Sign Up</h2>
              <form onSubmit={handleSubmit}>
                <div className='form-control mb-4'>
                  <label className='label'>
                    <span className='label-text'>User id</span>
                  </label>
                  <input type = "text" placeholder='Type  user id' className='input input-bordered' value = {userId} onChange={(e)=>setuserId(e.target.value)}/>
                </div>
                <div className='form-control mb-4'>
                  <label className='label'>
                    <span className='label-text'>Username</span>
                  </label>
                  <input type = "text" placeholder='Type user username' className='input input-bordered' value = {username} onChange={(e)=>setUsername(e.target.value)}/>
                </div>
                <div className='form-control mb-4'>
                  <label className='label'>
                    <span className='label-text'>Password</span>
                  </label>
                  <input type = 'password' placeholder='Type user password' className='input input-bordered' value = {password} onChange={(e)=>setPassword(e.target.value)}/>
                </div>
                <div className='form-control mb-4'>
                  <label className='label'>
                    <span className='label-text'>Role</span>
                  </label>
                  <input type = "text" placeholder='Type user role' className='input input-bordered' value = {role} onChange={(e)=>setRole(e.target.value)}/>
                </div>
                <div className='form-control mb-4'>
                  <label className='label'>
                    <span className='label-text'>Email</span>
                  </label>
                  <input type = "text" placeholder='Type user email' className='input input-bordered' value = {email} onChange={(e)=>setEmail(e.target.value)}/>
                </div>
                <div className='card-actions justify-end'>
                  <button type = "submit" className='btn btn-secondary' disabled = {loading}>
                    {loading? "Signing up...":"Sign Up"}
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

export default RegisterPage
