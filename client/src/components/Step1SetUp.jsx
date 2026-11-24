import React, { useRef, useState } from "react"
import { motion } from "motion/react"
import {
  FaUserTie,
  FaBriefcase,
  FaFileUpload,
  FaMicrophoneAlt,
  FaChartLine,
  FaFileAlt,
  FaCheckCircle,
  FaArrowRight,
  FaRobot,
  FaTimes,
  FaCode,
  FaClipboardList,
  FaArrowLeft
} from "react-icons/fa"
import { IoSparkles } from "react-icons/io5"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import { serverUrl } from "../App"
import { useDispatch, useSelector } from "react-redux"
import { setUserData } from "../redux/userSlice"

function Step1SetUp({ onStart }) {
  const { userData } = useSelector((state) => state.user)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const configRef = useRef(null)
  const analysisRef = useRef(null)

  const [role, setRole] = useState("")
  const [experience, setExperience] = useState("")
  const [mode, setMode] = useState("Technical")
  const [resumeFile, setResumeFile] = useState(null)
  const [jobDescription, setJobDescription] = useState("")
  const [loading, setLoading] = useState(false)
  const [projects, setProjects] = useState([])
  const [skills, setSkills] = useState([])
  const [resumeText, setResumeText] = useState("")
  const [analysisDone, setAnalysisDone] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState("")

  const handleUploadResume = async () => {
    if (!resumeFile || analyzing) return

    setAnalyzing(true)
    setError("")

    const formData = new FormData()
    formData.append("resume", resumeFile)

    try {
      const result = await axios.post(
        serverUrl + "/api/interview/resume",
        formData,
        { withCredentials: true }
      )

      setRole(result.data.role || "")
      setExperience(result.data.experience || "")
      setProjects(Array.isArray(result.data.projects) ? result.data.projects : [])
      setSkills(Array.isArray(result.data.skills) ? result.data.skills : [])
      setResumeText(result.data.resumeText || "")
      setAnalysisDone(true)

      setTimeout(() => {
        analysisRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "nearest"
        })
      }, 200)
    } catch (error) {
      setError(
        error.response?.data?.message ||
        "Unable to analyze resume. Please try again."
      )
    } finally {
      setAnalyzing(false)
    }
  }

  const handleStart = async () => {
    if (!role.trim() || !experience.trim()) {
      setError("Please enter your target role and experience.")
      configRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      })
      return
    }

    setLoading(true)
    setError("")

    try {
      const result = await axios.post(
        serverUrl + "/api/interview/generate-questions",
        {
          role,
          experience,
          mode,
          resumeText,
          projects,
          skills,
          jobDescription: jobDescription.trim()
        },
        { withCredentials: true }
      )

      if (userData) {
        dispatch(setUserData({
          ...userData,
          credits: result.data.creditsLeft
        }))
      }

      onStart(result.data)
    } catch (error) {
      setError(
        error.response?.data?.message ||
        "Unable to start interview. Please try again."
      )
    } finally {
      setLoading(false)
    }
  }

  const handleResumeChange = (event) => {
    const file = event.target.files?.[0]

    if (!file) return

    if (file.type !== "application/pdf") {
      setError("Please upload a PDF resume.")
      event.target.value = ""
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Resume size should be less than 5 MB.")
      event.target.value = ""
      return
    }

    setResumeFile(file)
    setAnalysisDone(false)
    setResumeText("")
    setProjects([])
    setSkills([])
    setError("")
  }

  const handleRemoveResume = () => {
    setResumeFile(null)
    setAnalysisDone(false)
    setResumeText("")
    setProjects([])
    setSkills([])
    setError("")

    const input = document.getElementById("interviewResume")
    if (input) input.value = ""
  }

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#FAF9FF] text-[#211B3A] px-4 py-5 sm:px-6 md:px-10 md:py-8">
      <div className="max-w-6xl w-full mx-auto min-w-0">

        <div className="flex items-center justify-between gap-3 mb-7">
          <button
            type="button"
            onClick={() => navigate("/")}
            aria-label="Back to Home"
            title="Back to Home"
            className="flex items-center justify-center gap-2 w-11 h-11 shrink-0 rounded-xl bg-white border border-[#EAE5FF] text-[#7657E8] shadow-sm hover:bg-[#F0EBFF] hover:border-[#7657E8] hover:-translate-x-1 transition-all duration-200"
          >
            <FaArrowLeft size={17} />
          </button>

          <span className="text-xs sm:text-sm font-semibold text-[#7657E8] bg-[#F0EBFF] px-4 py-2 rounded-full">
            MOCKAURA AI
          </span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 md:mb-10"
        >
          <div className="inline-flex items-center gap-2 bg-[#F0EBFF] text-[#7657E8] px-4 py-2 rounded-full text-xs font-semibold mb-5">
            <IoSparkles />
            PERSONALIZED AI INTERVIEW
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold leading-tight">
            Let's Prepare You for Your
            <span className="text-[#7657E8]"> Next Opportunity</span>
          </h1>

          <p className="text-gray-500 mt-4 max-w-2xl mx-auto leading-relaxed text-sm sm:text-base">
            Upload your resume, add your target job description and practice
            an interview designed around your skills and career goals.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-[0.85fr_1.15fr] gap-6 lg:gap-7 items-start min-w-0">

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full min-w-0 bg-[#211B3A] rounded-[24px] md:rounded-[28px] p-6 sm:p-7 md:p-9 text-white relative overflow-hidden"
          >
            <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-[#7657E8] blur-[90px] opacity-50" />

            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-[#7657E8] flex items-center justify-center text-2xl mb-7">
                <FaRobot />
              </div>

              <p className="text-purple-200 text-sm font-semibold mb-3">
                MEET YOUR AI INTERVIEWER
              </p>

              <h2 className="text-3xl font-bold leading-tight">
                Practice Smarter.
                <span className="block text-[#BDAAFF]">
                  Perform Better.
                </span>
              </h2>

              <p className="text-purple-200 text-sm leading-relaxed mt-5">
                MockAura AI creates a personalized interview experience
                using your resume, target role and job requirements.
              </p>

              <div className="space-y-4 mt-8">
                {[
                  {
                    icon: <FaFileAlt />,
                    title: "Resume-Based Questions",
                    description: "Questions from your skills and projects."
                  },
                  {
                    icon: <FaBriefcase />,
                    title: "JD-Based Preparation",
                    description: "Practice according to your target role."
                  },
                  {
                    icon: <FaMicrophoneAlt />,
                    title: "Interactive Interview",
                    description: "Build confidence with AI-powered practice."
                  },
                  {
                    icon: <FaChartLine />,
                    title: "Performance Feedback",
                    description: "Understand your strengths and gaps."
                  }
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    whileHover={{ x: 5 }}
                    className="flex items-start gap-4 bg-white/10 border border-white/10 rounded-2xl p-4"
                  >
                    <div className="w-10 h-10 shrink-0 rounded-xl bg-white/10 text-[#BDAAFF] flex items-center justify-center">
                      {item.icon}
                    </div>

                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm">
                        {item.title}
                      </h3>
                      <p className="text-purple-200 text-xs mt-1">
                        {item.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div
            ref={configRef}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full min-w-0 max-w-full scroll-mt-5 bg-white border border-[#EAE5FF] rounded-[24px] md:rounded-[28px] p-5 sm:p-6 md:p-9 shadow-[0_15px_50px_rgba(99,91,255,0.07)]"
          >
            <div className="mb-7">
              <p className="text-[#7657E8] text-xs font-semibold mb-2">
                INTERVIEW CONFIGURATION
              </p>
              <h2 className="text-2xl font-bold">
                Set Up Your Interview
              </h2>
              <p className="text-sm text-gray-400 mt-2">
                Provide the details to personalize your session.
              </p>
            </div>

            <div className="space-y-5 min-w-0">

              <div className="min-w-0">
                <label className="text-sm font-semibold block mb-2">
                  Target Job Role
                </label>

                <div className="relative min-w-0">
                  <FaUserTie className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7657E8]" />
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="e.g. Software Engineer Intern"
                    className="w-full min-w-0 pl-11 pr-4 py-3.5 bg-[#FAF9FF] border border-[#EAE5FF] focus:border-[#7657E8] focus:ring-2 focus:ring-[#7657E8]/10 rounded-xl outline-none text-sm transition"
                  />
                </div>
              </div>

              <div className="min-w-0">
                <label className="text-sm font-semibold block mb-2">
                  Experience Level
                </label>

                <div className="relative min-w-0">
                  <FaBriefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7657E8]" />
                  <input
                    type="text"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    placeholder="e.g. Fresher, 1 year, 2 years"
                    className="w-full min-w-0 pl-11 pr-4 py-3.5 bg-[#FAF9FF] border border-[#EAE5FF] focus:border-[#7657E8] focus:ring-2 focus:ring-[#7657E8]/10 rounded-xl outline-none text-sm transition"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold block mb-2">
                  Interview Type
                </label>

                <div className="grid grid-cols-2 gap-3">
                  {["Technical", "HR"].map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setMode(item)}
                      className={`py-3 rounded-xl border text-sm font-semibold transition ${
                        mode === item
                          ? "bg-[#7657E8] border-[#7657E8] text-white shadow-lg shadow-purple-200"
                          : "bg-[#FAF9FF] border-[#EAE5FF] text-gray-500 hover:border-[#7657E8]"
                      }`}
                    >
                      {item === "Technical" ? (
                        <FaCode className="inline mr-2" />
                      ) : (
                        <FaUserTie className="inline mr-2" />
                      )}
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div className="min-w-0">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <label className="text-sm font-semibold">
                    Upload Resume
                  </label>
                  <span className="text-xs text-gray-400 shrink-0">
                    PDF · Max 5 MB
                  </span>
                </div>

                <input
                  type="file"
                  id="interviewResume"
                  accept="application/pdf"
                  onChange={handleResumeChange}
                  className="hidden"
                />

                <div className="w-full min-w-0 border-2 border-dashed border-[#D8CEFF] hover:border-[#7657E8] bg-[#FAF9FF] rounded-2xl p-4 sm:p-5 transition overflow-hidden">
                  {resumeFile ? (
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 shrink-0 rounded-xl bg-[#EEE9FF] text-[#7657E8] flex items-center justify-center text-xl">
                        <FaFileAlt />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold break-all">
                          {resumeFile.name}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {(resumeFile.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleRemoveResume}
                        className="shrink-0 text-gray-400 hover:text-red-500 p-2"
                        aria-label="Remove resume"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  ) : (
                    <label
                      htmlFor="interviewResume"
                      className="flex flex-col items-center text-center cursor-pointer"
                    >
                      <div className="w-12 h-12 rounded-xl bg-[#EEE9FF] text-[#7657E8] flex items-center justify-center text-xl mb-3">
                        <FaFileUpload />
                      </div>
                      <p className="text-sm font-semibold">
                        Click to upload your resume
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Select a PDF from your device
                      </p>
                    </label>
                  )}

                  {resumeFile && !analysisDone && (
                    <button
                      type="button"
                      onClick={handleUploadResume}
                      disabled={analyzing}
                      className="mt-4 w-full bg-[#EEE9FF] hover:bg-[#E4DAFF] disabled:opacity-60 text-[#7657E8] py-2.5 rounded-xl text-sm font-semibold transition"
                    >
                      {analyzing ? "Analyzing Resume..." : "Analyze Resume"}
                    </button>
                  )}

                  {analysisDone && (
                    <div className="mt-4 flex items-center gap-2 text-xs text-green-600 font-semibold">
                      <FaCheckCircle />
                      Resume analyzed successfully
                    </div>
                  )}
                </div>
              </div>

              <div className="min-w-0">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <label className="text-sm font-semibold">
                    Job Description
                  </label>
                  <span className="text-xs text-gray-400 shrink-0">
                    Optional
                  </span>
                </div>

                <div className="relative min-w-0">
                  <FaClipboardList className="absolute left-4 top-4 text-[#7657E8]" />
                  <textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    rows={5}
                    placeholder="Paste the job description here to get interview questions tailored to the role..."
                    className="w-full min-w-0 pl-11 pr-4 py-3.5 bg-[#FAF9FF] border border-[#EAE5FF] focus:border-[#7657E8] focus:ring-2 focus:ring-[#7657E8]/10 rounded-xl outline-none text-sm resize-y transition"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Add the JD to make your interview more relevant to the job.
                </p>
              </div>

              {analysisDone && (
                <motion.div
                  ref={analysisRef}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full min-w-0 max-w-full bg-[#FAF9FF] border border-[#EAE5FF] rounded-2xl p-4 overflow-hidden space-y-4"
                >
                  <div className="flex items-center gap-2">
                    <FaCheckCircle className="text-green-500 shrink-0" />
                    <h3 className="font-semibold text-sm">
                      Resume Analysis
                    </h3>
                  </div>

                  {projects.length > 0 && (
                    <div className="min-w-0">
                      <p className="text-xs text-gray-400 mb-2">
                        Projects
                      </p>
                      <div className="flex flex-wrap gap-2 min-w-0">
                        {projects.map((project, index) => (
                          <span
                            key={index}
                            className="max-w-full break-words whitespace-normal bg-[#EEE9FF] text-[#7657E8] px-3 py-1.5 rounded-lg text-xs"
                          >
                            {project}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {skills.length > 0 && (
                    <div className="min-w-0">
                      <p className="text-xs text-gray-400 mb-2">
                        Skills
                      </p>
                      <div className="flex flex-wrap gap-2 min-w-0">
                        {skills.map((skill, index) => (
                          <span
                            key={index}
                            className="max-w-full break-words whitespace-normal bg-white border border-[#EAE5FF] text-gray-600 px-3 py-1.5 rounded-lg text-xs"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {projects.length === 0 && skills.length === 0 && (
                    <p className="text-xs text-gray-500">
                      Resume analyzed successfully. No projects or skills were extracted.
                    </p>
                  )}
                </motion.div>
              )}

              {error && (
                <p className="w-full min-w-0 break-words text-sm text-red-500 bg-red-50 rounded-xl p-3">
                  {error}
                </p>
              )}

              <button
                type="button"
                onClick={handleStart}
                disabled={!role.trim() || !experience.trim() || loading || analyzing}
                className="w-full min-w-0 flex items-center justify-center gap-3 bg-[#7657E8] hover:bg-[#6546D6] disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 px-3 rounded-xl font-semibold shadow-lg shadow-purple-200 transition text-sm sm:text-base"
              >
                {loading ? "Preparing Your Interview..." : "Start AI Interview"}
                {!loading && <FaArrowRight className="shrink-0" />}
              </button>

              <p className="text-center text-xs text-gray-400">
                Your interview will be personalized using the information provided.
              </p>

            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default Step1SetUp
