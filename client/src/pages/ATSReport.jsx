import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { buildStyles, CircularProgressbar } from 'react-circular-progressbar'
import 'react-circular-progressbar/dist/styles.css'
import {
  FaArrowLeft,
  FaArrowRight,
  FaCheckCircle,
  FaTimesCircle,
  FaLightbulb,
  FaBriefcase,
  FaGraduationCap,
  FaCode,
  FaFileAlt,
  FaChartLine,
  FaMicrophone,
  FaRobot,
  FaShieldAlt,
  FaPrint,
  FaPen,
  FaCopy
} from 'react-icons/fa'
import { IoSparkles, IoAnalytics } from 'react-icons/io5'

function ATSReport() {
  const location = useLocation()
  const navigate = useNavigate()
  const report = location.state?.atsReport || location.state?.report
  const resumeFileName = location.state?.resumeFileName || 'Your Resume'

  const handleCopy = async text => {
    try {
      await navigator.clipboard.writeText(text)
    } catch (error) {
      const textArea = document.createElement('textarea')
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
    }
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-[#FAF9FF] text-[#211B3A] flex items-center justify-center p-5 relative overflow-hidden">
        <div className="absolute top-12 right-0 w-72 h-72 bg-[#DCD2FF] rounded-full blur-[110px] opacity-50 pointer-events-none" />
        <div className="absolute bottom-10 left-0 w-72 h-72 bg-[#E8DEFF] rounded-full blur-[110px] opacity-40 pointer-events-none" />

        <div className="relative z-10 max-w-md w-full bg-white border border-[#EAE5FF] rounded-[28px] shadow-[0_25px_70px_rgba(99,91,255,0.12)] p-8 text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#F0EBFF] text-[#7657E8] flex items-center justify-center text-2xl">
            <FaFileAlt />
          </div>
          <h2 className="text-2xl font-bold mt-5 tracking-tight">Report Not Found</h2>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed">
            Upload your resume and run an ATS analysis first to view your compatibility score.
          </p>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="mt-6 w-full py-3.5 px-6 rounded-xl bg-[#7657E8] hover:bg-[#6546D6] text-white font-semibold shadow-lg shadow-purple-200 transition"
          >
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  const score = Math.min(100, Math.max(0, Number(report.atsScore) || 0))
  const breakdown = report.scoreBreakdown || {}
  const matchedKeywords = Array.isArray(report.matchedKeywords) ? report.matchedKeywords : []
  const missingRequired = Array.isArray(report.missingRequiredKeywords) ? report.missingRequiredKeywords : []
  const missingPreferred = Array.isArray(report.missingPreferredKeywords) ? report.missingPreferredKeywords : []
  const strengths = Array.isArray(report.strengths) ? report.strengths : []
  const suggestions = Array.isArray(report.suggestions) ? report.suggestions : []

  const bulletSuggestions = Array.isArray(report.bulletSuggestions)
    ? report.bulletSuggestions
    : []

  const resumeImprovements = bulletSuggestions.length > 0
    ? bulletSuggestions
    : Array.isArray(report.resumeImprovements)
      ? report.resumeImprovements.filter(item => item?.original && item?.improved)
      : []

  const hasPreferredSkills = typeof report.hasPreferredSkills === 'boolean'
    ? report.hasPreferredSkills
    : (
        Array.isArray(report.requirements?.preferred)
          ? report.requirements.preferred.length > 0
          : (
              Number(report.scoringInfo?.requirementCounts?.preferred) > 0 ||
              breakdown.preferredSkills !== null && breakdown.preferredSkills !== undefined
            )
      )

  const getScoreLabel = value => {
    if (value >= 80) return 'Excellent Match'
    if (value >= 65) return 'Good Match'
    if (value >= 45) return 'Moderate Match'
    return 'Needs Improvement'
  }

  const getScoreColor = value => {
    if (value >= 80) return '#059669'
    if (value >= 65) return '#7657E8'
    if (value >= 45) return '#D97706'
    return '#E05252'
  }

  const scoreItems = [
    { label: 'Required Skills', value: breakdown.requiredSkills, icon: <FaCode /> },
    { label: 'Preferred Skills', value: hasPreferredSkills ? breakdown.preferredSkills : null, icon: <FaLightbulb /> },
    { label: 'Experience Match', value: breakdown.experience, icon: <FaBriefcase /> },
    { label: 'Project Relevance', value: breakdown.projects, icon: <FaChartLine /> },
    { label: 'Education', value: breakdown.education, icon: <FaGraduationCap /> },
    { label: 'Resume Readability', value: breakdown.readability, icon: <FaFileAlt /> }
  ]

  const handlePrint = () => window.print()

  const surfaceCard =
    'bg-white border border-[#EAE5FF] rounded-[24px] p-6 md:p-7 shadow-[0_12px_36px_rgba(99,91,255,0.05)]'

  return (
    <div className="min-h-screen bg-[#FAF9FF] text-[#211B3A] overflow-hidden relative">
      <style>
        {`
          html { scroll-behavior: smooth; }
          @media print {
            body { background: white !important; }
            .no-print { display: none !important; }
            .report-card { box-shadow: none !important; break-inside: avoid; }
            main { padding-top: 16px !important; }
          }
        `}
      </style>

      <div className="absolute top-16 right-0 w-72 h-72 bg-[#DCD2FF] rounded-full blur-[110px] opacity-50 pointer-events-none no-print" />
      <div className="absolute bottom-24 left-0 w-72 h-72 bg-[#E8DEFF] rounded-full blur-[110px] opacity-40 pointer-events-none no-print" />

      <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-xl border-b border-[#EAE5FF] no-print">
        <div className="max-w-7xl mx-auto px-5 md:px-10 h-18 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center gap-2.5 text-sm font-semibold text-gray-500 hover:text-[#7657E8] transition"
          >
            <span className="w-9 h-9 rounded-xl bg-[#F0EBFF] flex items-center justify-center text-[#7657E8]">
              <FaArrowLeft className="text-xs" />
            </span>
            <span className="hidden sm:inline">Back to Home</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center gap-2.5"
          >
            <span className="w-9 h-9 rounded-xl bg-[#7657E8] text-white flex items-center justify-center shadow-sm">
              <FaRobot />
            </span>
            <span className="font-bold text-lg tracking-tight">
              MockAura <span className="text-[#7657E8]">AI</span>
            </span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#E7E1F5] hover:border-[#7657E8] text-[#211B3A] text-xs font-semibold transition"
          >
            <FaPrint className="text-[#7657E8]" />
            <span className="hidden sm:inline">Save Report</span>
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-5 md:px-10 pt-10 pb-16 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <div className="mb-9">
            <div className="inline-flex items-center gap-2 bg-[#F0EBFF] text-[#7657E8] px-4 py-2 rounded-full text-xs md:text-sm font-semibold">
              <IoSparkles />
              ATS Compatibility Report
            </div>

            <h1 className="text-2xl md:text-4xl font-bold tracking-tight leading-[1.15] mt-4">
              Your ATS <span className="text-[#7657E8]">Score</span> & Breakdown
            </h1>
            <p className="text-gray-500 text-sm md:text-base mt-2.5 max-w-2xl leading-relaxed">
              See how well your resume matches the role and where targeted updates can boost your score.
            </p>
          </div>

          <div className="grid lg:grid-cols-[0.88fr_1.52fr] gap-6">
            <div className={`${surfaceCard} report-card flex flex-col items-center justify-center text-center`}>
              <p className="text-xs font-semibold text-gray-400 tracking-wider uppercase">
                Overall ATS Score
              </p>

              <div className="w-44 h-44 my-6">
                <CircularProgressbar
                  value={score}
                  maxValue={100}
                  text={`${score}%`}
                  strokeWidth={8}
                  styles={buildStyles({
                    textSize: '23px',
                    textColor: '#211B3A',
                    pathColor: getScoreColor(score),
                    trailColor: '#F0EBFF',
                    strokeLinecap: 'round',
                    pathTransitionDuration: 1.1
                  })}
                />
              </div>

              <span
                className="px-4 py-1.5 rounded-full text-xs font-bold"
                style={{
                  backgroundColor: `${getScoreColor(score)}15`,
                  color: getScoreColor(score)
                }}
              >
                {getScoreLabel(score)}
              </span>

              <h2 className="text-xl font-bold mt-5 tracking-tight wrap-break-word max-w-full">
                {report.role || 'Target Role'}
              </h2>
              <p className="text-xs text-gray-400 mt-1">Target position</p>

              <div className="w-full mt-6 pt-5 border-t border-[#F0EBFF] flex items-center gap-3 text-left">
                <div className="w-10 h-10 rounded-xl bg-[#FAF9FF] border border-[#EEE9FF] text-[#7657E8] flex items-center justify-center shrink-0">
                  <FaFileAlt />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">
                    Analyzed Resume
                  </p>
                  <p className="text-sm font-semibold truncate mt-0.5">
                    {resumeFileName}
                  </p>
                </div>
                <FaCheckCircle className="text-emerald-500 shrink-0" />
              </div>
            </div>

            <div className={`${surfaceCard} report-card flex flex-col justify-between`}>
              <div>
                <div className="flex items-center justify-between gap-3 mb-6">
                  <div>
                    <p className="text-xs font-semibold text-[#7657E8] tracking-wider uppercase">
                      Score Breakdown
                    </p>
                    <h2 className="text-xl font-bold mt-1 tracking-tight">
                      Evaluation Across 6 Areas
                    </h2>
                  </div>
                  <div className="w-11 h-11 rounded-2xl bg-[#F0EBFF] text-[#7657E8] flex items-center justify-center text-lg shrink-0">
                    <IoAnalytics />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-x-7 gap-y-5">
                  {scoreItems.map((item, index) => {
                    const hasValue = item.value !== null && item.value !== undefined && Number.isFinite(Number(item.value))
                    const safeValue = hasValue
                      ? Math.min(100, Math.max(0, Number(item.value)))
                      : null

                    return (
                      <motion.div
                        key={item.label}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="w-7 h-7 rounded-lg bg-[#FAF9FF] border border-[#EEE9FF] text-[#7657E8] flex items-center justify-center text-xs shrink-0">
                              {item.icon}
                            </span>
                            <span className="text-xs sm:text-sm font-semibold text-[#211B3A] truncate">
                              {item.label}
                            </span>
                          </div>
                          <span className="text-sm font-bold text-[#7657E8] shrink-0">
                            {safeValue === null ? 'N/A' : `${safeValue}%`}
                          </span>
                        </div>
                        <div className="h-2 bg-[#F0EBFF] rounded-full overflow-hidden">
                          {safeValue !== null && (
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${safeValue}%` }}
                              transition={{ duration: 0.85, delay: index * 0.06 }}
                              className="h-full rounded-full bg-[#7657E8]"
                            />
                          )}
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </div>

              <div className="mt-7 bg-[#FAF9FF] border border-[#EEE9FF] rounded-2xl p-4 md:p-5">
                <div className="flex items-center gap-2 mb-1.5">
                  <IoSparkles className="text-[#7657E8] text-sm" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#7657E8]">
                    AI Summary
                  </h3>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {report.summary || 'Your resume analysis has been completed.'}
                </p>
              </div>
            </div>
          </div>

          <section className="mt-10">
            <div className="mb-5">
              <p className="text-xs font-semibold text-[#7657E8] tracking-wider uppercase">
                Keyword Alignment
              </p>
              <h2 className="text-2xl font-bold mt-1 tracking-tight">
                Skills & Keywords
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-5">
              <div className={`${surfaceCard} report-card`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <span className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <FaCheckCircle />
                    </span>
                    <h3 className="font-bold text-sm md:text-base">Matched</h3>
                  </div>
                  <span className="text-sm font-bold text-emerald-600">
                    {matchedKeywords.length}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {matchedKeywords.length > 0 ? (
                    matchedKeywords.map((keyword, idx) => (
                      <span
                        key={`${keyword}-${idx}`}
                        className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-medium"
                      >
                        {keyword}
                      </span>
                    ))
                  ) : (
                    <p className="text-xs text-gray-400">No matched keywords returned.</p>
                  )}
                </div>
              </div>

              <div className={`${surfaceCard} report-card`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <span className="w-9 h-9 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center">
                      <FaTimesCircle />
                    </span>
                    <h3 className="font-bold text-sm md:text-base">Missing Required</h3>
                  </div>
                  <span className="text-sm font-bold text-rose-500">
                    {missingRequired.length}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {missingRequired.length > 0 ? (
                    missingRequired.map((keyword, idx) => (
                      <span
                        key={`${keyword}-${idx}`}
                        className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-600 text-xs font-medium"
                      >
                        {keyword}
                      </span>
                    ))
                  ) : (
                    <p className="text-xs text-emerald-600 font-medium">
                      All required skills covered.
                    </p>
                  )}
                </div>
              </div>

              <div className={`${surfaceCard} report-card`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <span className="w-9 h-9 rounded-xl bg-[#F0EBFF] text-[#7657E8] flex items-center justify-center">
                      <FaLightbulb />
                    </span>
                    <h3 className="font-bold text-sm md:text-base">Missing Preferred</h3>
                  </div>
                  <span className="text-sm font-bold text-[#7657E8]">
                    {hasPreferredSkills ? missingPreferred.length : 'N/A'}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {!hasPreferredSkills ? (
                    <p className="text-xs text-gray-500 font-medium">
                      No separate preferred-skills section in this job description.
                    </p>
                  ) : missingPreferred.length > 0 ? (
                    missingPreferred.map((keyword, idx) => (
                      <span
                        key={`${keyword}-${idx}`}
                        className="px-3 py-1.5 rounded-lg bg-[#F0EBFF] text-[#7657E8] text-xs font-medium"
                      >
                        {keyword}
                      </span>
                    ))
                  ) : (
                    <p className="text-xs text-emerald-600 font-medium">
                      All preferred skills covered.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="mt-10 grid md:grid-cols-2 gap-6">
            <div className={`${surfaceCard} report-card`}>
              <div className="flex items-center gap-3 mb-5">
                <span className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <FaCheckCircle />
                </span>
                <div>
                  <h3 className="font-bold text-base">Key Strengths</h3>
                  <p className="text-xs text-gray-400">Highlights that work in your favor</p>
                </div>
              </div>

              <div className="space-y-3.5">
                {strengths.length > 0 ? (
                  strengths.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <FaCheckCircle className="text-emerald-500 mt-1 shrink-0 text-xs" />
                      <p className="text-sm text-gray-600 leading-relaxed">{item}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-400">No strengths returned.</p>
                )}
              </div>
            </div>

            <div className={`${surfaceCard} report-card`}>
              <div className="flex items-center gap-3 mb-5">
                <span className="w-10 h-10 rounded-xl bg-[#F0EBFF] text-[#7657E8] flex items-center justify-center">
                  <FaLightbulb />
                </span>
                <div>
                  <h3 className="font-bold text-base">How to Improve</h3>
                  <p className="text-xs text-gray-400">Actionable ways to improve your match</p>
                </div>
              </div>

              <div className="space-y-3.5">
                {suggestions.length > 0 ? (
                  suggestions.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-lg bg-[#F0EBFF] text-[#7657E8] flex items-center justify-center shrink-0 text-xs font-bold">
                        {idx + 1}
                      </span>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {typeof item === 'string' ? item : item.recommendation || item.description || item.text || ''}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-400">No suggestions returned.</p>
                )}
              </div>
            </div>
          </section>

          <section className="mt-6">
            <div className={`${surfaceCard} report-card`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <span className="w-11 h-11 rounded-xl bg-[#F0EBFF] text-[#7657E8] flex items-center justify-center text-lg">
                    <FaPen />
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-[#7657E8] uppercase tracking-wider">
                      Improve Your Resume
                    </p>
                    <h2 className="text-xl font-bold mt-1 tracking-tight">
                      Resume Suggestions
                    </h2>
                    <p className="text-xs text-gray-400 mt-1">
                      See exactly how to rewrite your existing resume bullets
                    </p>
                  </div>
                </div>

                <span className="text-xs font-semibold text-[#7657E8] bg-[#F0EBFF] px-3 py-2 rounded-lg w-fit">
                  {resumeImprovements.length} Suggestions
                </span>
              </div>

              {resumeImprovements.length > 0 ? (
                <div className="space-y-5">
                  {resumeImprovements.map((item, idx) => (
                    <motion.div
                      key={`${item.original}-${idx}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="rounded-2xl border border-[#EEE9FF] bg-[#FCFBFF] p-5 md:p-6"
                    >
                      <div className="flex items-center justify-between gap-3 mb-4">
                        <div className="flex items-center gap-2">
                          <span className="w-8 h-8 rounded-lg bg-[#F0EBFF] text-[#7657E8] flex items-center justify-center text-xs font-bold">
                            {String(idx + 1).padStart(2, '0')}
                          </span>
                          <h3 className="text-sm font-bold text-[#211B3A]">
                            Resume Bullet Suggestions
                          </h3>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleCopy(item.improved)}
                          className="no-print flex items-center gap-2 px-3 py-2 rounded-lg border border-[#EAE5FF] bg-white text-[#7657E8] hover:bg-[#F0EBFF] text-xs font-semibold transition"
                        >
                          <FaCopy />
                          Copy
                        </button>
                      </div>

                      <div className="grid md:grid-cols-2 gap-3">
                        <div className="rounded-xl border border-rose-100 bg-rose-50/60 p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="w-2 h-2 rounded-full bg-rose-400" />
                            <p className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">
                              This — Original
                            </p>
                          </div>
                          <p className="text-sm text-gray-600 leading-relaxed wrap-break-word">
                            {item.original}
                          </p>
                        </div>

                        <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                              To This — Improved
                            </p>
                          </div>
                          <p className="text-sm text-gray-700 leading-relaxed font-medium wrap-break-word">
                            {item.improved}
                          </p>
                        </div>
                      </div>

                      {item.reason && (
                        <div className="mt-4 flex items-start gap-2.5 bg-white border border-[#EEE9FF] rounded-xl p-3.5">
                          <IoSparkles className="text-[#7657E8] mt-0.5 shrink-0" />
                          <div>
                            <p className="text-[10px] font-bold text-[#7657E8] uppercase tracking-wider mb-1">
                              Why this is better
                            </p>
                            <p className="text-xs text-gray-600 leading-relaxed">
                              {item.reason}
                            </p>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl bg-[#FAF9FF] border border-[#EEE9FF] p-6 text-center">
                  <FaFileAlt className="text-2xl text-[#7657E8] mx-auto mb-3" />
                  <h3 className="text-sm font-bold text-[#211B3A]">
                    No bullet rewrites available
                  </h3>
                  <p className="text-xs text-gray-500 mt-2 leading-relaxed max-w-lg mx-auto">
                    The analysis could not verify any safe before-and-after rewrites from the extracted resume text. Try uploading a text-based PDF or DOCX with clear experience and project descriptions.
                  </p>
                </div>
              )}
            </div>
          </section>

          <section className="mt-10 bg-[#211B3A] rounded-[28px] p-7 md:p-10 relative overflow-hidden">
            <div className="absolute -right-16 -top-24 w-72 h-72 rounded-full bg-[#7657E8] blur-[100px] opacity-40 pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-center md:text-left">
                <div className="inline-flex items-center gap-2 text-purple-200 text-xs font-semibold mb-2">
                  <IoSparkles />
                  NEXT STEP
                </div>
                <h2 className="text-white text-2xl md:text-3xl font-bold tracking-tight">
                  Ready for Your Mock Interview?
                </h2>
                <p className="text-purple-200/80 text-sm mt-2 max-w-xl leading-relaxed">
                  Practice questions tailored to your resume and target role with AI feedback.
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate('/interview')}
                className="no-print shrink-0 flex items-center gap-3 bg-[#7657E8] hover:bg-[#6546D6] text-white px-6 py-4 rounded-xl font-semibold shadow-lg transition"
              >
                <FaMicrophone />
                Start Mock Interview
                <FaArrowRight />
              </button>
            </div>
          </section>

          <footer className="mt-8 pt-6 border-t border-[#EAE5FF] flex items-start gap-3">
            <FaShieldAlt className="text-[#7657E8] mt-0.5 shrink-0 text-sm" />
            <p className="text-xs text-gray-400 leading-relaxed">
              This ATS score is an AI estimate based on your uploaded resume and job description. Real employer screening tools may weigh criteria differently. Only include skills and achievements that accurately reflect your experience.
            </p>
          </footer>
        </motion.div>
      </main>
    </div>
  )
}

export default ATSReport