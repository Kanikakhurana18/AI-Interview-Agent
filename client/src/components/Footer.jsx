
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { FaRobot, FaArrowUp } from 'react-icons/fa'

function Footer() {
    const navigate = useNavigate()

    return (
        <footer className="bg-[#211B3A] px-5 sm:px-7 md:px-10 lg:px-20 pt-12 sm:pt-14 pb-7">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr] gap-9 sm:gap-10 pb-10 sm:pb-12 border-b border-white/10">
                    <div className="sm:col-span-2 lg:col-span-1">
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 shrink-0 rounded-2xl bg-[#7657E8] text-white flex items-center justify-center text-xl">
                                <FaRobot />
                            </div>

                            <div>
                                <h2 className="text-white text-xl font-bold">
                                    MockAura AI
                                </h2>
                                <p className="text-purple-200 text-xs">
                                    Practice Smarter. Perform Better.
                                </p>
                            </div>
                        </div>

                        <p className="text-purple-200/80 text-sm leading-relaxed max-w-md mt-5">
                            Your personal AI interview preparation partner. Practice with purpose, learn from feedback and build the confidence to take your next career step.
                        </p>
                    </div>

                    <div>
                        <h3 className="text-white font-semibold mb-5">
                            Explore
                        </h3>

                        <div className="flex flex-col gap-3 text-sm text-purple-200/80">
                            <button onClick={() => navigate('/')} className="text-left hover:text-white transition">
                                Home
                            </button>
                            <button onClick={() => navigate('/interview')} className="text-left hover:text-white transition">
                                Start Interview
                            </button>
                            <button onClick={() => navigate('/history')} className="text-left hover:text-white transition">
                                Interview History
                            </button>
                            <button onClick={() => navigate('/career-tracker')} className="text-left hover:text-white transition">
                                Career Tracker
                            </button>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-white font-semibold mb-5">
                            Your Growth
                        </h3>

                        <p className="text-purple-200/80 text-sm leading-relaxed">
                            Every practice session is an opportunity to improve. Keep learning, keep preparing and move closer to your goals.
                        </p>

                        <button
                            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                            className="mt-5 inline-flex items-center gap-2 text-sm text-white hover:text-[#BDAAFF] transition"
                        >
                            Back to top
                            <FaArrowUp />
                        </button>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 text-xs text-purple-200/60 text-center sm:text-left">
                    <p>© {new Date().getFullYear()} MockAura AI. All rights reserved.</p>
                    <p>Made to help you prepare with confidence.</p>
                </div>
            </div>
        </footer>
    )
}

export default Footer
