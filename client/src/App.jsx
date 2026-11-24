import React, { useEffect, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Auth from './pages/Auth'
import History from './pages/History'
import InterviewReport from './pages/InterviewReport'
import Pricing from './pages/Pricing'
import CareerTracker from './pages/CareerTracker'
import axios from 'axios'
import { useDispatch } from 'react-redux'
import { setUserData } from './redux/userSlice'
import InterviewPage from './pages/InterviewPage'
import ATSReport from './pages/ATSReport'

export const serverUrl = "http://localhost:8000"

function App() {
    const dispatch = useDispatch()
    const [isCheckingAuth, setIsCheckingAuth] = useState(true)

    useEffect(() => {
        const getUser = async () => {
            try {
                const result = await axios.get(
                    serverUrl + "/api/user/current-user",
                    { withCredentials: true }
                )
                dispatch(setUserData(result.data))
            } catch (error) {
                dispatch(setUserData(null))
            } finally {
                setIsCheckingAuth(false)
            }
        }

        getUser()
    }, [dispatch])

    if (isCheckingAuth) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f8f8fc]">
                <div className="w-8 h-8 border-4 border-[#8b5cf6] border-t-transparent rounded-full animate-spin"></div>
            </div>
        )
    }

    return (
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/history" element={<History />} />
            <Route path="/interview" element={<InterviewPage />} />
            <Route path="/ats-report" element={<ATSReport />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/career-tracker" element={<CareerTracker />} />
            <Route path="/report/:interviewId" element={<InterviewReport />} />
        </Routes>
    )
}

export default App
