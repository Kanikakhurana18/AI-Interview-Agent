import React, { useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { motion } from 'motion/react'
import {
  FaRobot,
  FaFileAlt,
  FaCloudUploadAlt,
  FaFilePdf,
  FaBriefcase,
  FaChartLine,
  FaMicrophone,
  FaHistory,
  FaArrowRight,
  FaCheckCircle,
  FaShieldAlt,
  FaRegClock,
  FaSearch
} from 'react-icons/fa'
import { IoSparkles } from 'react-icons/io5'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { serverUrl } from '../App'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import AuthModel from '../components/AuthModel'

function Home() {
  const { userData } = useSelector((state) => state.user)
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const [showAuth, setShowAuth] = useState(false)
  const [resumeFile, setResumeFile] = useState(null)
  const [jobDescription, setJobDescription] = useState('')
  const [fileError, setFileError] = useState('')
  const [loading, setLoading] = useState(false)

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    })
  }

  const handleFileChange = (event) => {
    const file = event.target.files?.[0]

    if (!file) return

    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]

    if (!allowedTypes.includes(file.type)) {
      setFileError('Please upload a PDF or DOCX file.')
      setResumeFile(null)
      event.target.value = ''
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setFileError('File size should be less than 5 MB.')
      setResumeFile(null)
      event.target.value = ''
      return
    }

    setFileError('')
    setResumeFile(file)
  }

  const handleStartInterview = () => {
    if (!userData) {
      setShowAuth(true)
      return
    }

    navigate('/interview')
  }

  const handleResumePreparation = async () => {
    if (!resumeFile) {
      setFileError('Please upload your resume first.')
      return
    }

    if (!jobDescription.trim()) {
      setFileError('Please paste the job description first.')
      return
    }

    if (jobDescription.trim().length < 50) {
      setFileError('Please enter a complete job description of at least 50 characters.')
      return
    }

    if (!userData) {
      setShowAuth(true)
      return
    }

    try {
      setLoading(true)
      setFileError('')

      const formData = new FormData()
      formData.append('resume', resumeFile)
      formData.append('jobDescription', jobDescription.trim())

      const result = await axios.post(
        `${serverUrl}/api/interview/ats-analysis`,
        formData,
        {
          withCredentials: true
        }
      )

      navigate('/ats-report', {
        state: {
          atsReport: result.data,
          resumeFileName: resumeFile.name,
          jobDescription
        }
      })
    } catch (error) {
      setFileError(
        error.response?.data?.message ||
        'Failed to analyse resume. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  const features = [
    {
      icon: <FaSearch />,
      title: 'ATS Resume Analysis',
      description: 'Compare your resume with the job description and identify missing keywords, skills and improvement areas.'
    },
    {
      icon: <FaFileAlt />,
      title: 'Resume Optimization',
      description: 'Get actionable suggestions to make your resume more relevant, clear and ATS-friendly.'
    },
    {
      icon: <FaMicrophone />,
      title: 'AI Mock Interviews',
      description: 'Practice personalized HR and technical interviews with adaptive AI follow-up questions.'
    },
    {
      icon: <FaChartLine />,
      title: 'Performance Reports',
      description: 'Understand your strengths, answer quality, communication and areas that need improvement.'
    }
  ]

  const steps = [
    {
      number: '01',
      title: 'Upload Your Resume',
      description: 'Add your existing resume in PDF or Word format.'
    },
    {
      number: '02',
      title: 'Add Job Description',
      description: 'Paste the JD of the role you want to prepare for.'
    },
    {
      number: '03',
      title: 'Analyze & Improve',
      description: 'Discover skill gaps, missing keywords and resume improvements.'
    },
    {
      number: '04',
      title: 'Practice with AI',
      description: 'Attend a personalized interview based on your resume and target role.'
    }
  ]

  return (
    <div className="min-h-screen bg-[#FAF9FF] text-[#211B3A] overflow-hidden">
      <Navbar />

      <section className="relative px-5 md:px-10 lg:px-20 pt-10 md:pt-18 pb-20">
        <div className="absolute top-10 right-0 w-72 h-72 bg-[#DCD2FF] rounded-full blur-[110px] opacity-50 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-[#E8DEFF] rounded-full blur-[110px] opacity-40 pointer-events-none" />

        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-14 items-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-flex items-center gap-2 bg-[#F0EBFF] text-[#7657E8] px-4 py-2 rounded-full text-xs md:text-sm font-semibold mb-7">
              <IoSparkles />
              Your Personal AI Career Coach
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-[58px] font-bold leading-[1.15] tracking-tight">
              Prepare Smarter.
              <span className="block text-[#7657E8] mt-2">
                Get Hired Confidently.
              </span>
            </h1>

            <p className="text-gray-500 text-base md:text-lg leading-relaxed mt-6 max-w-xl">
              Analyze your resume, improve your ATS compatibility and practice real-world interviews tailored to your dream job with AI.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mt-9">
              <button
                onClick={() => scrollToSection('resume-workspace')}
                className="flex items-center justify-center gap-3 bg-[#7657E8] hover:bg-[#6546D6] text-white px-7 py-4 rounded-xl font-semibold shadow-lg shadow-purple-200 transition"
              >
                Analyze My Resume
                <FaArrowRight />
              </button>

              <button
                onClick={handleStartInterview}
                className="flex items-center justify-center gap-3 bg-white border border-[#E7E1F5] hover:border-[#7657E8] text-[#211B3A] px-7 py-4 rounded-xl font-semibold transition"
              >
                <FaMicrophone className="text-[#7657E8]" />
                Start Mock Interview
              </button>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-3 mt-9 text-sm text-gray-500">
              <span className="flex items-center gap-2">
                <FaCheckCircle className="text-[#7657E8]" />
                AI-powered preparation
              </span>
              <span className="flex items-center gap-2">
                <FaCheckCircle className="text-[#7657E8]" />
                Personalized feedback
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="bg-white border border-[#EAE5FF] rounded-[28px] shadow-[0_25px_70px_rgba(99,91,255,0.12)] p-6 md:p-8">
              <div className="flex items-center justify-between mb-7">
                <div>
                  <p className="text-sm text-gray-400">Your preparation dashboard</p>
                  <h3 className="text-xl font-bold mt-1">Ready to level up?</h3>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-[#F0EBFF] text-[#7657E8] flex items-center justify-center text-xl">
                  <FaRobot />
                </div>
              </div>

              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => scrollToSection('resume-upload')}
                  className="w-full text-left p-4 rounded-2xl bg-[#FAF9FF] border border-[#EEE9FF] hover:border-[#7657E8] hover:shadow-md flex items-center gap-4 transition group"
                >
                  <div className="w-11 h-11 rounded-xl bg-[#EEE9FF] text-[#7657E8] flex items-center justify-center">
                    <FaFileAlt />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">Resume Analysis</p>
                    <p className="text-xs text-gray-400 mt-1">Find gaps and improve your resume</p>
                  </div>
                  <FaArrowRight className="text-[#7657E8] group-hover:translate-x-1 transition" />
                </button>

                <button
                  type="button"
                  onClick={() => scrollToSection('job-description')}
                  className="w-full text-left p-4 rounded-2xl bg-[#FAF9FF] border border-[#EEE9FF] hover:border-[#7657E8] hover:shadow-md flex items-center gap-4 transition group"
                >
                  <div className="w-11 h-11 rounded-xl bg-[#EEE9FF] text-[#7657E8] flex items-center justify-center">
                    <FaBriefcase />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">Job Description Matching</p>
                    <p className="text-xs text-gray-400 mt-1">Prepare for your target role</p>
                  </div>
                  <FaArrowRight className="text-[#7657E8] group-hover:translate-x-1 transition" />
                </button>

                <button
                  type="button"
                  onClick={handleStartInterview}
                  className="w-full text-left p-4 rounded-2xl bg-[#FAF9FF] border border-[#EEE9FF] hover:border-[#7657E8] hover:shadow-md flex items-center gap-4 transition group"
                >
                  <div className="w-11 h-11 rounded-xl bg-[#EEE9FF] text-[#7657E8] flex items-center justify-center">
                    <FaMicrophone />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">Personalized AI Interview</p>
                    <p className="text-xs text-gray-400 mt-1">Practice with role-specific questions</p>
                  </div>
                  <FaArrowRight className="text-[#7657E8] group-hover:translate-x-1 transition" />
                </button>
              </div>

              <div className="mt-6 rounded-2xl bg-[#7657E8] p-5 text-white">
                <div className="flex items-center gap-2 text-purple-100 text-xs mb-3">
                  <IoSparkles />
                  MOCKAURA AI
                </div>
                <p className="font-semibold text-lg">
                  Every interview is a step closer to your goal.
                </p>
                <p className="text-purple-100 text-sm mt-2">
                  Prepare with purpose. Perform with confidence.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="resume-workspace" className="px-5 md:px-10 lg:px-20 py-20 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 bg-[#F0EBFF] text-[#7657E8] px-4 py-2 rounded-full text-xs font-semibold mb-5">
              <IoSparkles />
              START YOUR CAREER PREPARATION
            </div>

            <h2 className="text-3xl md:text-4xl font-bold">
              Your Resume Meets Your
              <span className="text-[#7657E8]"> Dream Job</span>
            </h2>

            <p className="text-gray-500 mt-4 leading-relaxed">
              Upload your resume and paste the job description. Get ready to understand how well your profile matches the role.
            </p>
          </div>

          <div className="bg-[#FAF9FF] border border-[#EAE5FF] rounded-[28px] p-5 md:p-9 shadow-[0_15px_50px_rgba(99,91,255,0.07)]">
            <div className="grid md:grid-cols-2 gap-7">
              <div id="resume-upload" className="scroll-mt-24">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#EEE9FF] text-[#7657E8] flex items-center justify-center">
                    <FaFileAlt />
                  </div>
                  <div>
                    <h3 className="font-bold">Upload Your Resume</h3>
                    <p className="text-xs text-gray-400">PDF or DOCX · Max 5 MB</p>
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full min-h-52.5 border-2 border-dashed border-[#CFC2FF] hover:border-[#7657E8] bg-white rounded-2xl flex flex-col items-center justify-center px-5 py-8 transition"
                >
                  <div className="w-14 h-14 rounded-2xl bg-[#F0EBFF] text-[#7657E8] flex items-center justify-center text-2xl mb-4">
                    {resumeFile ? <FaFilePdf /> : <FaCloudUploadAlt />}
                  </div>

                  {resumeFile ? (
                    <>
                      <p className="font-semibold text-[#211B3A] text-sm break-all">
                        {resumeFile.name}
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        {(resumeFile.size / (1024 * 1024)).toFixed(2)} MB · Click to change file
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="font-semibold text-[#211B3A]">
                        Click to upload your resume
                      </p>
                      <p className="text-sm text-gray-400 mt-2">
                        or choose a file from your device
                      </p>
                    </>
                  )}
                </button>
              </div>

              <div id="job-description" className="scroll-mt-24">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#EEE9FF] text-[#7657E8] flex items-center justify-center">
                    <FaBriefcase />
                  </div>
                  <div>
                    <h3 className="font-bold">Paste Job Description</h3>
                    <p className="text-xs text-gray-400">Add the job role requirements</p>
                  </div>
                </div>

                <textarea
                  value={jobDescription}
                  onChange={(event) => setJobDescription(event.target.value)}
                  placeholder={`Paste the complete job description here...
Example: Role: Software Engineer
Required skills: React, JavaScript, Node.js, REST APIs...`}
                  className="w-full min-h-52.5 resize-y bg-white border border-[#EAE5FF] focus:border-[#7657E8] focus:ring-2 focus:ring-[#7657E8]/10 outline-none rounded-2xl p-5 text-sm text-gray-700 placeholder:text-gray-400 transition"
                />
              </div>
            </div>

            {fileError && (
              <p className="text-sm text-red-500 mt-5">
                {fileError}
              </p>
            )}

            <div className="mt-7 flex flex-col md:flex-row items-center justify-between gap-5">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <FaShieldAlt className="text-[#7657E8]" />
                Your resume should be handled securely.
              </div>

              <button
                onClick={handleResumePreparation}
                disabled={loading}
                className="w-full md:w-auto flex items-center justify-center gap-3 bg-[#7657E8] hover:bg-[#6546D6] disabled:opacity-60 disabled:cursor-not-allowed text-white px-8 py-4 rounded-xl font-semibold shadow-lg shadow-purple-200 transition"
              >
                {loading ? 'Analyzing Resume...' : 'Analyze My Resume'}
                {!loading && <FaArrowRight />}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 md:px-10 lg:px-20 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-[#7657E8] font-semibold text-sm mb-3">HOW MOCKAURA AI WORKS</p>
            <h2 className="text-3xl md:text-4xl font-bold">
              From Resume to
              <span className="text-[#7657E8]"> Interview Ready</span>
            </h2>
            <p className="text-gray-500 mt-4">
              A simple process to help you prepare for the opportunities that matter.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white border border-[#EAE5FF] rounded-2xl p-6 hover:border-[#BBAAFF] hover:shadow-xl hover:shadow-purple-100/60 transition"
              >
                <p className="text-3xl font-bold text-[#D6CBFF]">{step.number}</p>
                <h3 className="font-bold text-lg mt-5">{step.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed mt-3">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 md:px-10 lg:px-20 py-20 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-[#7657E8] font-semibold text-sm mb-3">ALL YOU NEED IN ONE PLACE</p>
            <h2 className="text-3xl md:text-4xl font-bold">
              Prepare for Every
              <span className="text-[#7657E8]"> Career Step</span>
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-[#FAF9FF] border border-[#EAE5FF] rounded-2xl p-7 hover:bg-white hover:shadow-xl hover:shadow-purple-100/60 transition"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#EEE9FF] text-[#7657E8] flex items-center justify-center text-xl">
                  {feature.icon}
                </div>
                <h3 className="font-bold text-lg mt-6">{feature.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed mt-3">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 md:px-10 lg:px-20 py-20">
        <div className="max-w-7xl mx-auto bg-[#211B3A] rounded-[30px] p-8 md:p-14 relative overflow-hidden">
          <div className="absolute -right-20 -top-28 w-80 h-80 rounded-full bg-[#7657E8] blur-[100px] opacity-50" />

          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-9">
            <div className="max-w-2xl text-center lg:text-left">
              <div className="inline-flex items-center gap-2 text-purple-200 text-sm font-semibold mb-5">
                <IoSparkles />
                YOUR NEXT OPPORTUNITY STARTS HERE
              </div>

              <h2 className="text-white text-3xl md:text-4xl font-bold leading-tight">
                Don't Just Apply.
                <span className="block text-[#BDAAFF]">Prepare to Stand Out.</span>
              </h2>

              <p className="text-purple-200 mt-5 leading-relaxed">
                Build a stronger resume, understand your target role and walk into your next interview with confidence.
              </p>
            </div>

            <button
              onClick={handleStartInterview}
              className="shrink-0 flex items-center justify-center gap-3 bg-white text-[#7657E8] hover:bg-[#F0EBFF] px-8 py-4 rounded-xl font-bold transition"
            >
              Start Practicing
              <FaArrowRight />
            </button>
          </div>
        </div>
      </section>

      <section className="px-5 md:px-10 lg:px-20 pb-16">
        <div className="max-w-7xl mx-auto grid sm:grid-cols-3 gap-5">
          <div className="flex items-center gap-4 bg-white border border-[#EAE5FF] rounded-2xl p-5">
            <FaRegClock className="text-[#7657E8] text-2xl" />
            <div>
              <p className="font-bold">Practice Anytime</p>
              <p className="text-xs text-gray-400 mt-1">Prepare at your own pace</p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-white border border-[#EAE5FF] rounded-2xl p-5">
            <FaChartLine className="text-[#7657E8] text-2xl" />
            <div>
              <p className="font-bold">Track Progress</p>
              <p className="text-xs text-gray-400 mt-1">Learn from every attempt</p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-white border border-[#EAE5FF] rounded-2xl p-5">
            <FaHistory className="text-[#7657E8] text-2xl" />
            <div>
              <p className="font-bold">Review Interviews</p>
              <p className="text-xs text-gray-400 mt-1">Keep your preparation organized</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />

      {showAuth && (
        <AuthModel onClose={() => setShowAuth(false)} />
      )}
    </div>
  )
}

export default Home
