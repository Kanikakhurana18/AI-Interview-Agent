import React, { useEffect, useRef, useState } from "react"
import maleVideo from "../assets/videos/male-ai.mp4"
import femaleVideo from "../assets/videos/female-ai.mp4"
import Timer from "./Timer"
import { motion, AnimatePresence } from "motion/react"
import { FaMicrophone, FaMicrophoneSlash } from "react-icons/fa"
import {
    FiArrowLeft,
    FiArrowRight,
    FiCheckCircle,
    FiClock,
    FiMic,
    FiUser,
    FiVolume2
} from "react-icons/fi"
import axios from "axios"
import { serverUrl } from "../App"
import { useNavigate } from "react-router-dom"

function Step2Interview({ interviewData, onFinish }) {
    const navigate = useNavigate()
    const { interviewId, questions = [], userName } = interviewData || {}

    const [hasStarted, setHasStarted] = useState(false)
    const [isIntroPhase, setIsIntroPhase] = useState(true)
    const [isMicOn, setIsMicOn] = useState(true)
    const [isAIPlaying, setIsAIPlaying] = useState(false)
    const [currentIdx, setCurrentIdx] = useState(0)
    const [answer, setAnswer] = useState("")
    const [interimAnswer, setInterimAnswer] = useState("")
    const [feedback, setFeedback] = useState("")
    const [timeLeft, setTimeLeft] = useState(questions[0]?.timeLimit || 60)
    const [selectedVoice, setSelectedVoice] = useState(null)
    const [voicesReady, setVoicesReady] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isFinishing, setIsFinishing] = useState(false)
    const [voiceGender, setVoiceGender] = useState("female")
    const [subtitle, setSubtitle] = useState("")
    const [speechSupported, setSpeechSupported] = useState(true)
    const [answerError, setAnswerError] = useState("")

    const recognitionRef = useRef(null)
    const videoRef = useRef(null)
    const answerRef = useRef("")
    const interimAnswerRef = useRef("")
    const shouldListenRef = useRef(false)
    const recognitionActiveRef = useRef(false)
    const isAIPlayingRef = useRef(false)
    const restartTimerRef = useRef(null)
    const isSubmittingRef = useRef(false)
    const isFinishingRef = useRef(false)
    const timeLeftRef = useRef(timeLeft)

    const currentQuestion = questions[currentIdx]
    const questionTime = currentQuestion?.timeLimit || 60
    const videoSource = voiceGender === "female" ? femaleVideo : maleVideo

    useEffect(() => {
        timeLeftRef.current = timeLeft
    }, [timeLeft])

    const updateAnswer = value => {
        answerRef.current = value
        setAnswer(value)
        setAnswerError("")
    }

    const loadVoices = () => {
        const voices = window.speechSynthesis?.getVoices() || []

        const femaleVoice = voices.find(v =>
            /heera|zira|hazel|sonia|female|google uk english female/i.test(v.name)
        )

        const maleVoice = voices.find(v =>
            /david|mark|guy|ravi|male|google uk english male/i.test(v.name)
        )

        const preferredVoice = voiceGender === "female"
            ? femaleVoice
            : maleVoice

        const fallbackVoice = voices.find(v =>
            v.lang?.toLowerCase().startsWith("en")
        ) || voices[0]

        setSelectedVoice(preferredVoice || fallbackVoice || null)
        setVoicesReady(voices.length > 0)
    }

    useEffect(() => {
        loadVoices()
        window.speechSynthesis?.addEventListener("voiceschanged", loadVoices)

        return () => {
            window.speechSynthesis?.removeEventListener("voiceschanged", loadVoices)
        }
    }, [voiceGender])

    const stopMic = () => {
        shouldListenRef.current = false

        if (restartTimerRef.current) {
            clearTimeout(restartTimerRef.current)
            restartTimerRef.current = null
        }

        if (recognitionRef.current && recognitionActiveRef.current) {
            try {
                recognitionRef.current.stop()
            } catch (error) {
                console.error(error)
            }
        }
    }

    const startMic = () => {
        if (
            !recognitionRef.current ||
            isAIPlayingRef.current ||
            !isMicOn ||
            isSubmittingRef.current ||
            isFinishingRef.current
        ) return

        shouldListenRef.current = true

        if (recognitionActiveRef.current) return

        try {
            recognitionRef.current.start()
        } catch (error) {
            if (error.name !== "InvalidStateError") {
                console.error(error)
            }
        }
    }

    const speak = text => {
        return new Promise(resolve => {
            if (!window.speechSynthesis) {
                resolve()
                return
            }

            stopMic()
            window.speechSynthesis.cancel()

            const utterance = new SpeechSynthesisUtterance(
                text.replace(/,/g, ",...").replace(/\./g, ". ...")
            )

            if (selectedVoice) utterance.voice = selectedVoice

            utterance.rate = 0.92
            utterance.pitch = voiceGender === "female" ? 1.05 : 0.95
            utterance.volume = 1

            utterance.onstart = () => {
                isAIPlayingRef.current = true
                setIsAIPlaying(true)

                if (videoRef.current) {
                    videoRef.current.currentTime = 0
                    videoRef.current.play().catch(() => {})
                }
            }

            utterance.onend = () => {
                isAIPlayingRef.current = false
                setIsAIPlaying(false)
                videoRef.current?.pause()

                if (videoRef.current) {
                    videoRef.current.currentTime = 0
                }

                setSubtitle("")
                resolve()
            }

            utterance.onerror = () => {
                isAIPlayingRef.current = false
                setIsAIPlaying(false)
                videoRef.current?.pause()
                setSubtitle("")
                resolve()
            }

            setSubtitle(text)
            window.speechSynthesis.speak(utterance)
        })
    }

    useEffect(() => {
        const SpeechRecognition =
            window.SpeechRecognition || window.webkitSpeechRecognition

        if (!SpeechRecognition) {
            setSpeechSupported(false)
            return
        }

        const recognition = new SpeechRecognition()

        recognition.lang = "en-US"
        recognition.continuous = true
        recognition.interimResults = true
        recognition.maxAlternatives = 1

        recognition.onstart = () => {
            recognitionActiveRef.current = true
        }

        recognition.onresult = event => {
            let finalTranscript = ""
            let interimTranscript = ""

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript

                if (event.results[i].isFinal) {
                    finalTranscript += transcript
                } else {
                    interimTranscript += transcript
                }
            }

            if (finalTranscript.trim()) {
                const currentText = answerRef.current.trim()
                const newText = finalTranscript.trim()

                const updatedAnswer = currentText
                    ? `${currentText} ${newText}`
                    : newText

                updateAnswer(updatedAnswer)
            }

            interimAnswerRef.current = interimTranscript
            setInterimAnswer(interimTranscript)
        }

        recognition.onerror = event => {
            console.error("Microphone error:", event.error)

            if (
                event.error === "not-allowed" ||
                event.error === "service-not-allowed"
            ) {
                shouldListenRef.current = false
                setIsMicOn(false)
            }
        }

        recognition.onend = () => {
            recognitionActiveRef.current = false

            if (
                shouldListenRef.current &&
                !isAIPlayingRef.current &&
                !isSubmittingRef.current &&
                !isFinishingRef.current
            ) {
                restartTimerRef.current = setTimeout(() => {
                    if (
                        shouldListenRef.current &&
                        !isAIPlayingRef.current &&
                        !recognitionActiveRef.current &&
                        !isSubmittingRef.current &&
                        !isFinishingRef.current
                    ) {
                        try {
                            recognition.start()
                        } catch (error) {
                            if (error.name !== "InvalidStateError") {
                                console.error(error)
                            }
                        }
                    }
                }, 300)
            }
        }

        recognitionRef.current = recognition

        return () => {
            shouldListenRef.current = false

            if (restartTimerRef.current) {
                clearTimeout(restartTimerRef.current)
            }

            try {
                recognition.abort()
            } catch (error) {
                console.error(error)
            }

            recognitionActiveRef.current = false
            recognitionRef.current = null
        }
    }, [])

    useEffect(() => {
        if (!hasStarted) return

        let cancelled = false

        const runInterview = async () => {
            if (isIntroPhase) {
                await speak(
                    `Hey ${userName || "there"}! Welcome to MockAura AI. I'm Aura, your personal AI interviewer. I'm excited to be your interview partner today.`
                )

                if (cancelled) return

                await speak(
                    "Before we begin, take a deep breath and relax. This is your opportunity to showcase your skills, experience, personality and potential. I'll ask you questions based on your background and the role you're preparing for. Just be yourself and express your thoughts naturally. Are you ready? Let's get started. All the best!"
                )

                if (!cancelled) {
                    setIsIntroPhase(false)
                }
            } else if (currentQuestion) {
                await new Promise(resolve => setTimeout(resolve, 800))

                if (cancelled) return

                if (currentIdx === questions.length - 1) {
                    await speak("Alright, this might be a little challenging.")
                }

                if (cancelled) return

                await speak(`Here's your question: ${currentQuestion.question}`)

                if (!cancelled && isMicOn) {
                    startMic()
                }
            }
        }

        runInterview()

        return () => {
            cancelled = true
        }
    }, [hasStarted, isIntroPhase, currentIdx])

    useEffect(() => {
        if (
            !hasStarted ||
            isIntroPhase ||
            !currentQuestion ||
            isSubmitting ||
            feedback
        ) return

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer)
                    return 0
                }

                return prev - 1
            })
        }, 1000)

        return () => clearInterval(timer)
    }, [hasStarted, isIntroPhase, currentIdx, isSubmitting, feedback])

    useEffect(() => {
        if (
            timeLeft === 0 &&
            hasStarted &&
            !isIntroPhase &&
            !feedback &&
            !isSubmitting
        ) {
            submitAnswer(true)
        }
    }, [timeLeft, isIntroPhase, feedback, isSubmitting, hasStarted])

    const toggleMic = () => {
        if (isMicOn) {
            stopMic()
            setIsMicOn(false)
        } else {
            setIsMicOn(true)

            if (!isAIPlayingRef.current) {
                shouldListenRef.current = true
                setTimeout(() => startMic(), 150)
            }
        }
    }

    const submitAnswer = async (isAutoSubmit = false) => {
        if (isSubmittingRef.current || feedback || isFinishingRef.current) return

        stopMic()

        const finalAnswer = [
            answerRef.current,
            interimAnswerRef.current
        ]
            .filter(Boolean)
            .join(" ")
            .trim()

        if (!finalAnswer) {
            if (isAutoSubmit || timeLeftRef.current <= 0) {
                setAnswerError("")
                setFeedback("You did not submit your answer.")
                return
            }

            setAnswerError("Please enter or speak your answer before submitting.")
            return
        }

        answerRef.current = finalAnswer
        interimAnswerRef.current = ""

        setAnswer(finalAnswer)
        setInterimAnswer("")
        setAnswerError("")

        isSubmittingRef.current = true
        setIsSubmitting(true)

        try {
            const result = await axios.post(
                serverUrl + "/api/interview/submit-answers",
                {
                    interviewId,
                    questionIndex: currentIdx,
                    answer: finalAnswer,
                    timeTaken: questionTime - timeLeftRef.current
                },
                { withCredentials: true }
            )

            setFeedback(
                result.data.feedback || "Your answer has been evaluated successfully."
            )
        } catch (error) {
            console.error("Submit Answer Error:", error)

            setAnswerError(
                error.response?.data?.message ||
                "Unable to submit your answer. Please try again."
            )
        } finally {
            isSubmittingRef.current = false
            setIsSubmitting(false)
        }
    }

    const handleNext = async () => {
        if (isSubmittingRef.current || isFinishingRef.current) return

        if (currentIdx + 1 >= questions.length) {
            await finishInterview()
            return
        }

        stopMic()

        answerRef.current = ""
        interimAnswerRef.current = ""

        setAnswer("")
        setInterimAnswer("")
        setAnswerError("")
        setFeedback("")
        setTimeLeft(questions[currentIdx + 1]?.timeLimit || 60)

        await speak("Alright, let's move on to the next question.")

        setCurrentIdx(prev => prev + 1)
    }

    const finishInterview = async () => {
        if (isFinishingRef.current) return

        stopMic()
        setIsMicOn(false)
        isFinishingRef.current = true
        setIsFinishing(true)

        try {
            const result = await axios.post(
                serverUrl + "/api/interview/finish",
                { interviewId },
                { withCredentials: true }
            )

            onFinish(result.data)
        } catch (error) {
            console.error("Error finishing interview:", error)

            alert(
                error.response?.data?.message ||
                "Unable to finish interview. Please try again."
            )

            isFinishingRef.current = false
            setIsFinishing(false)
        }
    }

    useEffect(() => {
        return () => {
            shouldListenRef.current = false
            isSubmittingRef.current = false
            isFinishingRef.current = false

            if (restartTimerRef.current) {
                clearTimeout(restartTimerRef.current)
            }

            try {
                recognitionRef.current?.abort()
            } catch (error) {
                console.error(error)
            }

            window.speechSynthesis?.cancel()
            videoRef.current?.pause()
        }
    }, [])

    return (
        <div className="min-h-dvh h-auto lg:h-dvh w-full overflow-x-hidden overflow-y-auto lg:overflow-hidden bg-[#FAF9FF] flex flex-col px-3 py-2 sm:px-5 sm:py-3">
            <header className="w-full max-w-[1500px] mx-auto min-h-12 shrink-0 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => navigate("/")}
                        className="flex items-center justify-center w-10 h-10 shrink-0 rounded-xl border border-[#EAE5FF] bg-white text-[#7657E8] hover:bg-[#F0EBFF] hover:border-[#7657E8] transition-all duration-200 shadow-sm"
                        title="Back to Home"
                        aria-label="Back to Home"
                    >
                        <FiArrowLeft size={21} />
                    </button>

                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-[#7657E8] text-white flex items-center justify-center font-bold text-lg">
                            M
                        </div>

                        <div>
                            <p className="text-sm font-bold text-[#211B3A]">
                                MockAura AI
                            </p>
                            <p className="text-[10px] sm:text-xs text-[#9B91B8]">
                                Practice Smarter. Perform Better.
                            </p>
                        </div>
                    </div>
                </div>

                {hasStarted && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-white border border-[#EAE5FF]">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[10px] sm:text-xs font-semibold text-[#51466F]">
                            Interview in progress
                        </span>
                    </div>
                )}
            </header>

            <main className="w-full max-w-[1500px] mx-auto flex-1 min-h-0 pt-2 pb-3 lg:pb-1">
                <div className="h-auto lg:h-full min-h-0 grid grid-cols-1 grid-rows-[auto_auto] lg:grid-rows-1 lg:grid-cols-[minmax(250px,0.78fr)_minmax(0,1.22fr)] gap-3 sm:gap-4">

                    <section className="min-h-0 bg-white rounded-2xl sm:rounded-[24px] border border-[#EAE5FF] shadow-sm p-2.5 sm:p-4 flex flex-row items-center lg:items-stretch lg:flex-col gap-3">
                        <div className="relative w-[108px] sm:w-[145px] lg:w-full shrink-0 aspect-square lg:aspect-[5/3] rounded-xl sm:rounded-2xl overflow-hidden bg-[#211B3A]">
                            <video
                                ref={videoRef}
                                key={videoSource}
                                src={videoSource}
                                muted
                                playsInline
                                loop
                                preload="auto"
                                className="w-full h-full object-cover"
                            />

                            <div className="absolute top-1.5 left-1.5 flex items-center gap-1.5 bg-black/40 backdrop-blur text-white rounded-full px-2 py-1">
                                <span className={`w-1.5 h-1.5 rounded-full ${isAIPlaying ? "bg-green-400 animate-pulse" : "bg-white/70"}`} />
                                <span className="text-[9px] font-medium">
                                    {isAIPlaying ? "Speaking" : "Aura"}
                                </span>
                            </div>

                            <div className="absolute bottom-1.5 left-1.5 right-1.5 bg-black/40 backdrop-blur rounded-lg px-2 py-1.5">
                                <p className="text-white text-xs font-semibold">
                                    {voiceGender === "female" ? "Aura" : "Alex"}
                                </p>
                                <p className="text-white/70 text-[9px]">AI Interviewer</p>
                            </div>
                        </div>

                        <div className="flex-1 min-w-0 flex flex-col justify-center lg:justify-start lg:gap-3">
                            <div className="flex items-center justify-between gap-2">
                                <div>
                                    <h2 className="text-sm sm:text-base font-bold text-[#211B3A]">
                                        Meet your interviewer
                                    </h2>
                                    <p className="hidden lg:block text-xs text-[#9B91B8] mt-1">
                                        Choose who conducts your interview
                                    </p>
                                </div>
                                <FiUser className="text-[#7657E8] lg:hidden" size={17} />
                            </div>

                            <div className="grid grid-cols-2 gap-2 mt-2 lg:mt-0">
                                <button
                                    onClick={() => setVoiceGender("female")}
                                    disabled={hasStarted}
                                    className={`rounded-xl border px-2.5 py-2 text-left transition ${
                                        voiceGender === "female"
                                            ? "border-[#7657E8] bg-[#F5F1FF]"
                                            : "border-[#EAE5FF] bg-white"
                                    } disabled:cursor-not-allowed`}
                                >
                                    <div className="flex items-center justify-between gap-1">
                                        <span className="text-xs font-bold text-[#211B3A]">Female</span>
                                        {voiceGender === "female" && (
                                            <FiCheckCircle className="text-[#7657E8]" size={14} />
                                        )}
                                    </div>
                                    <p className="text-[9px] text-[#9B91B8] mt-0.5">Aura · Friendly</p>
                                </button>

                                <button
                                    onClick={() => setVoiceGender("male")}
                                    disabled={hasStarted}
                                    className={`rounded-xl border px-2.5 py-2 text-left transition ${
                                        voiceGender === "male"
                                            ? "border-[#7657E8] bg-[#F5F1FF]"
                                            : "border-[#EAE5FF] bg-white"
                                    } disabled:cursor-not-allowed`}
                                >
                                    <div className="flex items-center justify-between gap-1">
                                        <span className="text-xs font-bold text-[#211B3A]">Male</span>
                                        {voiceGender === "male" && (
                                            <FiCheckCircle className="text-[#7657E8]" size={14} />
                                        )}
                                    </div>
                                    <p className="text-[9px] text-[#9B91B8] mt-0.5">Alex · Professional</p>
                                </button>
                            </div>

                            <div className="hidden lg:flex items-center gap-2 rounded-xl bg-[#FAF9FF] p-3">
                                <div className="w-8 h-8 rounded-lg bg-[#F0EBFF] text-[#7657E8] flex items-center justify-center">
                                    <FiVolume2 size={16} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-semibold text-[#211B3A]">Interviewer status</p>
                                    <p className="text-[10px] text-[#9B91B8] truncate">
                                        {isAIPlaying ? "Currently speaking" : hasStarted ? "Waiting for your response" : "Ready to begin"}
                                    </p>
                                </div>
                                <span className={`ml-auto w-2 h-2 rounded-full shrink-0 ${isAIPlaying ? "bg-[#7657E8] animate-pulse" : "bg-gray-300"}`} />
                            </div>

                            {subtitle && (
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={subtitle}
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        className="hidden lg:block rounded-xl bg-[#F5F1FF] border border-[#EAE5FF] p-3"
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            <FiVolume2 className="text-[#7657E8]" size={14} />
                                            <span className="text-[10px] font-bold text-[#7657E8]">
                                                {voiceGender === "female" ? "Aura" : "Alex"} is speaking
                                            </span>
                                        </div>
                                        <p className="text-xs text-[#51466F] leading-relaxed line-clamp-3">{subtitle}</p>
                                    </motion.div>
                                </AnimatePresence>
                            )}
                        </div>
                    </section>

                    <section className="min-h-[480px] lg:min-h-0 bg-white rounded-2xl sm:rounded-[24px] border border-[#EAE5FF] shadow-sm p-3 sm:p-5 flex flex-col overflow-hidden">
                        {!hasStarted ? (
                            <div className="flex-1 min-h-0 flex flex-col justify-center max-w-xl mx-auto w-full">
                                <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-[#F0EBFF] text-[#7657E8] flex items-center justify-center mb-3 sm:mb-5">
                                    <FiUser size={24} />
                                </div>

                                <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.16em] text-[#9B91B8] mb-1.5">
                                    Your interview starts here
                                </p>

                                <h1 className="text-xl sm:text-3xl font-bold text-[#211B3A] leading-tight">
                                    Ready to meet your interviewer?
                                </h1>

                                <p className="text-xs sm:text-sm text-[#817794] leading-relaxed mt-2 sm:mt-3">
                                    Your AI interviewer will guide you through the session, ask questions and listen to your answers. Take your time and give your best.
                                </p>

                                <div className="grid grid-cols-2 gap-2 sm:gap-3 mt-5 sm:mt-7">
                                    <div className="rounded-xl bg-[#FAF9FF] p-3">
                                        <FiCheckCircle className="text-[#7657E8] mb-2" size={17} />
                                        <p className="text-xs sm:text-sm font-semibold text-[#211B3A]">{questions.length} questions</p>
                                        <p className="text-[10px] text-[#9B91B8] mt-1">Personalized for your role</p>
                                    </div>

                                    <div className="rounded-xl bg-[#FAF9FF] p-3">
                                        <FiMic className="text-[#7657E8] mb-2" size={17} />
                                        <p className="text-xs sm:text-sm font-semibold text-[#211B3A]">Voice interaction</p>
                                        <p className="text-[10px] text-[#9B91B8] mt-1">Speak or type answers</p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setHasStarted(true)}
                                    disabled={!voicesReady || !questions.length}
                                    className="w-full mt-5 sm:mt-7 py-3 sm:py-3.5 rounded-xl bg-[#7657E8] text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#6546D6] transition shadow-lg shadow-[#7657E8]/20 disabled:opacity-50"
                                >
                                    {voicesReady ? "Start Interview" : "Preparing interviewer..."}
                                    <FiArrowRight size={17} />
                                </button>

                                {!speechSupported && (
                                    <p className="text-[10px] text-red-500 mt-2 text-center">
                                        Voice recognition is not supported. Please use Google Chrome.
                                    </p>
                                )}
                            </div>
                        ) : (
                            <>
                                <div className="shrink-0 flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.16em] text-[#9B91B8]">Mock interview</p>
                                        <h2 className="text-base sm:text-xl font-bold text-[#211B3A]">
                                            {isIntroPhase ? "Getting started" : "Your interview"}
                                        </h2>
                                    </div>

                                    <span className="px-3 py-1.5 rounded-full bg-[#F0EBFF] text-[#7657E8] text-[10px] sm:text-xs font-bold whitespace-nowrap">
                                        {Math.min(currentIdx + 1, questions.length)} / {questions.length}
                                    </span>
                                </div>

                                <div className="shrink-0 h-1 w-full rounded-full bg-[#F0EBFF] my-3 sm:my-4 overflow-hidden">
                                    <motion.div
                                        animate={{
                                            width: `${((currentIdx + (feedback ? 1 : 0)) / questions.length) * 100}%`
                                        }}
                                        className="h-full bg-[#7657E8] rounded-full"
                                    />
                                </div>

                                {isIntroPhase ? (
                                    <div className="flex-1 min-h-0 flex flex-col justify-center items-center text-center">
                                        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-[#F0EBFF] flex items-center justify-center text-[#7657E8] mb-3">
                                            <FiVolume2 size={25} />
                                        </div>
                                        <h3 className="text-base sm:text-xl font-bold text-[#211B3A]">Let's get comfortable!</h3>
                                        <p className="text-xs sm:text-sm text-[#817794] leading-relaxed mt-2 max-w-sm">
                                            {voiceGender === "female" ? "Aura" : "Alex"} is introducing the interview. Listen carefully and get ready for your first question.
                                        </p>
                                        <span className="mt-4 px-3 py-1.5 rounded-full bg-[#F5F1FF] text-[#7657E8] text-[10px] font-semibold">
                                            Interview introduction
                                        </span>
                                    </div>
                                ) : (
                                    <>
                                        <div className="shrink-0 rounded-xl sm:rounded-2xl bg-[#FAF9FF] border border-[#EAE5FF] p-3 sm:p-4">
                                            <div className="flex items-center justify-between gap-2 mb-2">
                                                <span className="text-[9px] sm:text-[10px] font-bold text-[#9B91B8] uppercase tracking-wider">
                                                    Question {currentIdx + 1}
                                                </span>
                                                <span className="flex items-center gap-1 text-[10px] sm:text-xs font-semibold text-[#7657E8]">
                                                    <FiClock />
                                                    {currentQuestion?.difficulty || "Interview"}
                                                </span>
                                            </div>
                                            <h3 className="text-sm sm:text-lg font-semibold text-[#211B3A] leading-relaxed line-clamp-4">
                                                {currentQuestion?.question}
                                            </h3>
                                        </div>

                                        <div className="flex items-center justify-between mt-3 mb-2 shrink-0">
                                            <label className="text-xs sm:text-sm font-bold text-[#211B3A]">Your answer</label>
                                            <span className="text-[10px] sm:text-xs text-[#9B91B8]">Speak or type</span>
                                        </div>

                                        <textarea
                                            placeholder="Start speaking or type your answer here..."
                                            value={[answer, interimAnswer].filter(Boolean).join(" ")}
                                            onChange={e => {
                                                answerRef.current = e.target.value
                                                setAnswer(e.target.value)
                                                setInterimAnswer("")
                                                interimAnswerRef.current = ""
                                                setAnswerError("")
                                            }}
                                            disabled={!!feedback || isSubmitting}
                                            className="w-full flex-1 min-h-22.5 lg:min-h-16.25 bg-[#FAF9FF] border border-[#EAE5FF] rounded-xl p-3 text-xs sm:text-sm text-[#211B3A] placeholder:text-[#AAA2B9] resize-none outline-none focus:border-[#7657E8] focus:ring-2 focus:ring-[#7657E8]/10 transition disabled:opacity-80"
                                        />

                                        {answerError && (
                                            <p className="shrink-0 mt-2 text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                                                {answerError}
                                            </p>
                                        )}

                                        {!feedback ? (
                                            <div className="shrink-0 mt-3">
                                                <div className="flex items-center justify-between gap-2 mb-3">
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <span className={`w-2 h-2 rounded-full shrink-0 ${isMicOn ? "bg-green-500 animate-pulse" : "bg-gray-400"}`} />
                                                        <span className="text-xs text-[#817794]">
                                                            {isMicOn ? "Microphone on" : "Microphone off"}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={toggleMic}
                                                            disabled={isSubmitting || isFinishing}
                                                            className="w-9 h-9 rounded-lg border border-[#EAE5FF] bg-white text-[#7657E8] flex items-center justify-center hover:bg-[#F5F1FF] disabled:opacity-50"
                                                            title={isMicOn ? "Turn microphone off" : "Turn microphone on"}
                                                        >
                                                            {isMicOn ? <FaMicrophone size={15} /> : <FaMicrophoneSlash size={15} />}
                                                        </button>

                                                        <div className="scale-90 origin-right">
                                                            <Timer timeLeft={timeLeft} totalTime={questionTime} />
                                                        </div>
                                                    </div>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => submitAnswer(false)}
                                                    disabled={isSubmitting || isFinishing}
                                                    className="w-full py-3 rounded-xl bg-[#7657E8] text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#6546D6] transition disabled:opacity-50"
                                                >
                                                    {isSubmitting ? "Evaluating your answer..." : "Submit Answer"}
                                                    {!isSubmitting && <FiArrowRight size={16} />}
                                                </button>
                                            </div>
                                        ) : (
                                            <motion.div
                                                initial={{ opacity: 0, y: 8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="shrink-0 mt-3 rounded-xl border border-[#EAE5FF] bg-[#F5F1FF] p-3"
                                            >
                                                <div className="flex items-center gap-2 mb-2">
                                                    <FiCheckCircle className="text-[#7657E8]" />
                                                    <p className="text-sm font-bold text-[#211B3A]">Answer evaluated</p>
                                                </div>

                                                <p className="text-xs text-[#51466F] leading-relaxed">
                                                    {feedback}
                                                </p>

                                                <button
                                                    type="button"
                                                    onClick={handleNext}
                                                    disabled={isFinishing || isSubmitting}
                                                    className="w-full mt-3 py-3 rounded-xl bg-[#7657E8] text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#6546D6] transition disabled:opacity-50"
                                                >
                                                    {currentIdx + 1 >= questions.length
                                                        ? isFinishing ? "Finishing interview..." : "Finish Interview"
                                                        : "Next Question"}
                                                    <FiArrowRight size={16} />
                                                </button>
                                            </motion.div>
                                        )}
                                    </>
                                )}
                            </>
                        )}
                    </section>
                </div>
            </main>

            {hasStarted && (
                <footer className="shrink-0 min-h-5 flex items-center justify-center gap-1.5 text-[9px] sm:text-[10px] text-[#9B91B8]">
                    <FiCheckCircle className="text-[#7657E8]" />
                    Your interview progress is being saved securely
                </footer>
            )}
        </div>
    )
}

export default Step2Interview
