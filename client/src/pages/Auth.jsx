import React, { useState } from 'react'
import { FaRobot, FaShieldAlt } from "react-icons/fa"
import { IoSparkles } from "react-icons/io5"
import { motion } from "motion/react"
import { FcGoogle } from "react-icons/fc"
import { signInWithPopup } from 'firebase/auth'
import { auth, provider } from '../utils/firebase'
import axios from "axios"
import { serverUrl } from "../App"
import { useDispatch } from 'react-redux'
import { setUserData } from '../redux/userSlice'
import { useNavigate } from 'react-router-dom'

function Auth({ isModel = false }) {
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)

    const handleGoogleAuth = async () => {
        try {
            setLoading(true)
            const response = await signInWithPopup(auth, provider)
            const user = response.user
            const name = user.displayName
            const email = user.email

            const result = await axios.post(
                serverUrl + "/api/auth/google",
                { name, email },
                { withCredentials: true }
            )

            dispatch(setUserData(result.data))
            navigate("/", { replace: true })

        } catch (error) {
            console.error("Google login error:", error)
            console.error("Firebase error code:", error.code)
            console.error("Backend error:", error.response?.data)
            console.error("Error message:", error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className={`w-full
        ${isModel
            ? "py-5"
            : "min-h-screen bg-linear-to-br from-[#F7F5FF] via-[#F1EDFF] to-[#FAF9FF] flex items-center justify-center px-5 py-16"
        }`}>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
                className={`w-full
                ${isModel ? "max-w-md p-8 rounded-3xl" : "max-w-lg p-10 md:p-12 rounded-4xl"}
                bg-white shadow-[0_20px_60px_rgba(99,91,255,0.10)] border border-[#EAE5FF]`}
            >

                <div className='flex items-center justify-center gap-3 mb-8'>
                    <div className='bg-[#7657E8] text-white p-3 rounded-2xl shadow-lg shadow-purple-200'>
                        <FaRobot size={22} />
                    </div>

                    <div>
                        <h2 className='font-bold text-xl text-[#211B3A]'>
                            MockAura <span className='text-[#7657E8]'>AI</span>
                        </h2>
                        <p className='text-[10px] tracking-[2px] uppercase text-gray-400 font-medium'>
                            Practice Smarter
                        </p>
                    </div>
                </div>

                <div className='text-center mb-8'>
                    <div className='inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F1EDFF] text-[#7657E8] text-xs font-semibold mb-5'>
                        <IoSparkles size={15} />
                        AI Powered Interview Preparation
                    </div>

                    <h1 className='text-3xl md:text-[34px] font-bold text-[#211B3A] leading-tight mb-4'>
                        Your Dream Job
                        <span className='block text-[#7657E8] mt-1'>
                            Starts With Practice.
                        </span>
                    </h1>

                    <p className='text-gray-500 text-sm md:text-base leading-relaxed max-w-sm mx-auto'>
                        Practice real-world interviews, improve your answers, and build confidence with your personal AI interview coach.
                    </p>
                </div>

                <motion.button
                    onClick={handleGoogleAuth}
                    disabled={loading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className='w-full flex items-center justify-center gap-3 py-4 bg-white border border-[#E5E1EF] hover:border-[#7657E8] hover:bg-[#FAF9FF] text-[#211B3A] font-semibold rounded-2xl shadow-sm transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed'
                >
                    <FcGoogle size={23} />
                    {loading ? "Signing you in..." : "Continue with Google"}
                </motion.button>

                <div className='flex items-center justify-center gap-2 mt-6 text-xs text-gray-400'>
                    <FaShieldAlt className='text-[#7657E8]' />
                    Secure authentication powered by Google
                </div>

                <div className='mt-8 pt-6 border-t border-gray-100 text-center'>
                    <p className='text-xs text-gray-400'>
                        Your journey to interview confidence starts here.
                    </p>
                </div>

            </motion.div>
        </div>
    )
}

export default Auth
