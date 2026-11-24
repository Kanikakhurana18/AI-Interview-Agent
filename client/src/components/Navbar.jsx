
import React, { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
    FaRobot,
    FaUserAstronaut,
    FaMicrophone,
    FaFileAlt,
    FaHistory,
    FaChartLine
} from 'react-icons/fa'
import { BsCoin } from 'react-icons/bs'
import { HiOutlineLogout } from 'react-icons/hi'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { serverUrl } from '../App'
import { setUserData } from '../redux/userSlice'
import AuthModel from './AuthModel'

function Navbar() {
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const { userData } = useSelector((state) => state.user)

    const [showCreditPopup, setShowCreditPopup] = useState(false)
    const [showUserPopup, setShowUserPopup] = useState(false)
    const [showAuth, setShowAuth] = useState(false)

    const creditRef = useRef(null)
    const userRef = useRef(null)

    const userInitial =
        userData?.name?.trim()?.charAt(0)?.toUpperCase() ||
        userData?.email?.trim()?.charAt(0)?.toUpperCase()

    const closePopups = () => {
        setShowUserPopup(false)
        setShowCreditPopup(false)
    }

    useEffect(() => {
        const handleOutsideClick = (event) => {
            if (creditRef.current && !creditRef.current.contains(event.target)) {
                setShowCreditPopup(false)
            }

            if (userRef.current && !userRef.current.contains(event.target)) {
                setShowUserPopup(false)
            }
        }

        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                closePopups()
                setShowAuth(false)
            }
        }

        document.addEventListener('mousedown', handleOutsideClick)
        document.addEventListener('touchstart', handleOutsideClick)
        document.addEventListener('keydown', handleEscape)

        return () => {
            document.removeEventListener('mousedown', handleOutsideClick)
            document.removeEventListener('touchstart', handleOutsideClick)
            document.removeEventListener('keydown', handleEscape)
        }
    }, [])

    const handleNavigation = (path) => {
        closePopups()
        navigate(path)
    }

    const handleResumeApplication = () => {
        closePopups()
        navigate('/')

        setTimeout(() => {
            document.getElementById('resume-workspace')?.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            })
        }, 300)
    }

    const handleLogout = async () => {
        try {
            await axios.post(
                serverUrl + '/api/auth/logout',
                {},
                { withCredentials: true }
            )

            dispatch(setUserData(null))
            closePopups()
            navigate('/auth', { replace: true })
        } catch (error) {
            console.log('Logout error:', error)
        }
    }

    return (
        <>
            <nav className="w-full px-3 sm:px-5 md:px-10 py-3 sm:py-4 flex items-center justify-between gap-2 bg-white shadow-sm relative z-50">
                <button
                    type="button"
                    className="flex items-center gap-2 sm:gap-3 min-w-0 cursor-pointer text-left"
                    onClick={() => {
                        closePopups()
                        navigate('/')
                    }}
                >
                    <div className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-xl bg-[#7657E8] text-white flex items-center justify-center shadow-md shadow-purple-200">
                        <FaRobot className="text-lg sm:text-xl" />
                    </div>

                    <div className="min-w-0">
                        <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-[#211B3A] tracking-tight whitespace-nowrap">
                            MockAura <span className="text-[#7657E8]">AI</span>
                        </h1>

                        <p className="hidden xs:block text-[9px] sm:text-xs text-gray-400 font-medium tracking-wide whitespace-nowrap">
                            Practice Smarter. Perform Better.
                        </p>
                    </div>
                </button>

                <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                    {userData && (
                        <>
                            <div className="relative" ref={creditRef}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCreditPopup(prev => !prev)
                                        setShowUserPopup(false)
                                    }}
                                    className="flex items-center gap-1.5 sm:gap-2 rounded-full px-2.5 sm:px-3 py-2 bg-[#F7F5FF] text-[#7657E8] hover:bg-[#EEE9FF] transition"
                                >
                                    <BsCoin className="text-sm sm:text-base" />
                                    <span className="font-semibold text-xs sm:text-sm">
                                        {userData.credits ?? 0}
                                    </span>
                                </button>

                                {showCreditPopup && (
                                    <div className="absolute right-0 top-12 w-[min(224px,calc(100vw-24px))] bg-white shadow-xl rounded-xl p-4 border border-gray-100 z-[60]">
                                        <p className="font-semibold text-gray-900">
                                            Your Credits
                                        </p>

                                        <p className="text-sm text-gray-500 mt-1 mb-4">
                                            Available credits: {userData.credits ?? 0}
                                        </p>

                                        <button
                                            type="button"
                                            onClick={() => handleNavigation('/pricing')}
                                            className="w-full bg-[#7657E8] hover:bg-[#6546D6] text-white py-2.5 rounded-lg font-medium transition"
                                        >
                                            <span className="flex items-center justify-center gap-2">
                                                <BsCoin />
                                                Get Credits
                                            </span>
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="relative" ref={userRef}>
                                <button
                                    type="button"
                                    aria-label="Open user menu"
                                    aria-expanded={showUserPopup}
                                    onClick={() => {
                                        setShowUserPopup(prev => !prev)
                                        setShowCreditPopup(false)
                                    }}
                                    className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-full bg-[#EEE9FF] text-[#7657E8] flex items-center justify-center hover:bg-[#E3DAFF] transition font-bold text-base sm:text-lg"
                                >
                                    {userInitial || (
                                        <FaUserAstronaut className="text-lg" />
                                    )}
                                </button>

                                {showUserPopup && (
                                    <div className="absolute right-0 top-12 w-[min(256px,calc(100vw-24px))] bg-white shadow-xl rounded-2xl border border-gray-100 p-3 z-[60]">
                                        <div className="px-3 py-3 border-b border-gray-100 mb-2 min-w-0">
                                            <p className="font-semibold text-gray-900 truncate">
                                                {userData.name || 'User'}
                                            </p>

                                            <p className="text-xs text-gray-500 break-all mt-1">
                                                {userData.email || ''}
                                            </p>
                                        </div>

                                        <div className="space-y-1">
                                            <button
                                                type="button"
                                                onClick={() => handleNavigation('/interview')}
                                                className="w-full flex items-center gap-3 text-left px-3 py-2.5 rounded-lg text-gray-700 hover:bg-[#F7F5FF] hover:text-[#7657E8] transition"
                                            >
                                                <FaMicrophone className="text-[#7657E8] shrink-0" />
                                                <span className="text-sm font-medium">Get Started Interview</span>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => handleNavigation('/pricing')}
                                                className="w-full flex items-center gap-3 text-left px-3 py-2.5 rounded-lg text-gray-700 hover:bg-[#F7F5FF] hover:text-[#7657E8] transition"
                                            >
                                                <BsCoin className="text-[#7657E8] shrink-0" />
                                                <span className="text-sm font-medium">Get Credits</span>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={handleResumeApplication}
                                                className="w-full flex items-center gap-3 text-left px-3 py-2.5 rounded-lg text-gray-700 hover:bg-[#F7F5FF] hover:text-[#7657E8] transition"
                                            >
                                                <FaFileAlt className="text-[#7657E8] shrink-0" />
                                                <span className="text-sm font-medium">Resume Application</span>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => handleNavigation('/application-tracker')}
                                                className="w-full flex items-center gap-3 text-left px-3 py-2.5 rounded-lg text-gray-700 hover:bg-[#F7F5FF] hover:text-[#7657E8] transition"
                                            >
                                                <FaChartLine className="text-[#7657E8] shrink-0" />
                                                <span className="text-sm font-medium">Application Tracker</span>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => handleNavigation('/history')}
                                                className="w-full flex items-center gap-3 text-left px-3 py-2.5 rounded-lg text-gray-700 hover:bg-[#F7F5FF] hover:text-[#7657E8] transition"
                                            >
                                                <FaHistory className="text-[#7657E8] shrink-0" />
                                                <span className="text-sm font-medium">Interview History</span>
                                            </button>
                                        </div>

                                        <div className="border-t border-gray-100 mt-2 pt-2">
                                            <button
                                                type="button"
                                                onClick={handleLogout}
                                                className="w-full flex items-center gap-3 text-left px-3 py-2.5 rounded-lg text-red-500 hover:bg-red-50 transition"
                                            >
                                                <HiOutlineLogout className="text-lg shrink-0" />
                                                <span className="text-sm font-medium">Logout</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {!userData && (
                        <button
                            type="button"
                            onClick={() => setShowAuth(true)}
                            className="bg-[#7657E8] hover:bg-[#6546D6] text-white px-4 sm:px-5 py-2 rounded-lg text-sm sm:text-base whitespace-nowrap transition"
                        >
                            Login
                        </button>
                    )}
                </div>
            </nav>

            {showAuth && (
                <AuthModel onClose={() => setShowAuth(false)} />
            )}
        </>
    )
}

export default Navbar
