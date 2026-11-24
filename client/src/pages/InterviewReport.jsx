
import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { serverUrl } from '../App'
import Step3Report from '../components/Step3Report'

function InterviewReport() {
    const { interviewId } = useParams()
    const navigate = useNavigate()

    const [report, setReport] = useState(null)
    const [loading, setLoading] = useState(true)
    const [idealAnswersLoading, setIdealAnswersLoading] = useState(true)
    const [idealAnswersError, setIdealAnswersError] = useState('')
    const [error, setError] = useState('')

    useEffect(() => {
        let cancelled = false

        const fetchReport = async () => {
            try {
                if (!interviewId) {
                    setError('Interview ID is missing')
                    setLoading(false)
                    setIdealAnswersLoading(false)
                    return
                }

                const result = await axios.get(
                    `${serverUrl}/api/interview/report/${interviewId}`,
                    { withCredentials: true }
                )

                if (cancelled) return

                const reportData = result.data

                const questions = (reportData.questionWiseScore || []).map(
                    question => ({
                        ...question,
                        idealAnswer: ''
                    })
                )

                setReport({
                    ...reportData,
                    questionWiseScore: questions
                })

                setLoading(false)

                try {
                    const response = await axios.post(
                        `${serverUrl}/api/interview/generate-ideal-answer`,
                        { interviewId },
                        { withCredentials: true }
                    )

                    if (cancelled) return

                    const generatedAnswers = response.data.idealAnswers

                    if (!Array.isArray(generatedAnswers)) {
                        throw new Error('Invalid ideal answers response')
                    }

                    const updatedQuestions = questions.map((question, index) => {
                        const generated = generatedAnswers.find(
                            item => Number(item.questionIndex) === index
                        )

                        return {
                            ...question,
                            idealAnswer:
                                typeof generated?.idealAnswer === 'string'
                                    ? generated.idealAnswer.trim()
                                    : ''
                        }
                    })

                    setReport({
                        ...reportData,
                        questionWiseScore: updatedQuestions
                    })

                    if (updatedQuestions.some(question => !question.idealAnswer)) {
                        setIdealAnswersError(
                            'Some ideal answers could not be generated. Please try again.'
                        )
                    }
                } catch (generationError) {
                    console.error(
                        'Ideal answers generation failed:',
                        generationError.response?.data || generationError
                    )

                    if (!cancelled) {
                        setIdealAnswersError(
                            generationError.response?.data?.message ||
                            generationError.message ||
                            'Unable to generate ideal answers.'
                        )
                    }
                } finally {
                    if (!cancelled) {
                        setIdealAnswersLoading(false)
                    }
                }
            } catch (reportError) {
                console.error('Report loading failed:', reportError)

                if (!cancelled) {
                    setError(
                        reportError.response?.data?.message ||
                        'Failed to load interview report'
                    )
                    setLoading(false)
                    setIdealAnswersLoading(false)
                }
            }
        }

        fetchReport()

        return () => {
            cancelled = true
        }
    }, [interviewId])

    if (loading) {
        return (
            <div className="min-h-screen bg-[#FAF9FF] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-10 h-10 border-4 border-[#EAE5FF] border-t-[#7657E8] rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-[#51466F] font-medium">
                        Loading your interview report...
                    </p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[#FAF9FF] flex flex-col items-center justify-center gap-4 px-4">
                <div className="bg-white border border-[#EAE5FF] rounded-2xl p-8 text-center shadow-sm max-w-md w-full">
                    <p className="text-[#E65B75] font-medium mb-5">{error}</p>
                    <button
                        onClick={() => navigate('/history')}
                        className="px-5 py-3 bg-[#7657E8] hover:bg-[#6546D6] text-white rounded-xl font-semibold transition"
                    >
                        Back to History
                    </button>
                </div>
            </div>
        )
    }

    return (
        <Step3Report
            report={report}
            idealAnswersLoading={idealAnswersLoading}
            idealAnswersError={idealAnswersError}
        />
    )
}

export default InterviewReport
