import React, { useEffect, useMemo, useRef, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { serverUrl } from '../App'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import {
    FaBriefcase,
    FaCalendarAlt,
    FaCheckCircle,
    FaClock,
    FaFileAlt,
    FaSearch,
    FaStar,
    FaTrash,
    FaEllipsisV,
    FaDownload,
    FaEye,
    FaRobot
} from 'react-icons/fa'

const History = () => {
    const navigate = useNavigate()
    const menuRef = useRef(null)

    const [interviews, setInterviews] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [filter, setFilter] = useState('All')
    const [openMenu, setOpenMenu] = useState(null)
    const [confirmDelete, setConfirmDelete] = useState(null)
    const [deletingId, setDeletingId] = useState(null)
    const [downloadingId, setDownloadingId] = useState(null)
    const [error, setError] = useState('')

    const fetchInterviews = async () => {
        try {
            setLoading(true)
            setError('')

            const { data } = await axios.get(
                `${serverUrl}/api/interview/get-interview`,
                { withCredentials: true }
            )

            const list = data.interviews || data.data || []
            setInterviews(Array.isArray(list) ? list : [])
        } catch (err) {
            setError(err.response?.data?.message || 'Unable to load interview history')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchInterviews()
    }, [])

    useEffect(() => {
        const handleOutsideClick = event => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setOpenMenu(null)
            }
        }

        const handleEscape = event => {
            if (event.key === 'Escape') {
                setOpenMenu(null)
                setConfirmDelete(null)
            }
        }

        document.addEventListener('mousedown', handleOutsideClick)
        document.addEventListener('keydown', handleEscape)

        return () => {
            document.removeEventListener('mousedown', handleOutsideClick)
            document.removeEventListener('keydown', handleEscape)
        }
    }, [])

    const getScore = item => Number(item.finalScore ?? item.score ?? 0)

    const completed = interviews.filter(item => item.status === 'Completed')
    const incomplete = interviews.filter(item => item.status !== 'Completed')

    const averageScore = completed.length
        ? (
            completed.reduce((total, item) => total + getScore(item), 0) /
            completed.length
        ).toFixed(1)
        : '0.0'

    const filteredInterviews = useMemo(() => {
        return interviews.filter(item => {
            const matchesSearch =
                item.role?.toLowerCase().includes(search.toLowerCase()) ||
                item.mode?.toLowerCase().includes(search.toLowerCase())

            const matchesFilter = filter === 'All' || item.status === filter

            return matchesSearch && matchesFilter
        })
    }, [interviews, search, filter])

    const formatDate = date => {
        if (!date) return 'Date unavailable'

        return new Date(date).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        })
    }

    const handleDelete = async () => {
        if (!confirmDelete) return

        try {
            setDeletingId(confirmDelete._id)
            setError('')

            await axios.delete(
                `${serverUrl}/api/interview/delete/${confirmDelete._id}`,
                { withCredentials: true }
            )

            setInterviews(prev =>
                prev.filter(item => item._id !== confirmDelete._id)
            )

            setConfirmDelete(null)
            setOpenMenu(null)
        } catch (err) {
            setError(err.response?.data?.message || 'Unable to delete interview')
        } finally {
            setDeletingId(null)
        }
    }

    const downloadReport = async item => {
        try {
            setDownloadingId(item._id)
            setOpenMenu(null)
            setError('')

            const { data } = await axios.get(
                `${serverUrl}/api/interview/report/${item._id}`,
                { withCredentials: true }
            )

            const report = data.report || data.interview || data

            const {
                finalScore = item.finalScore || 0,
                confidence = 0,
                communication = 0,
                correctness = 0,
                questionWiseScore = []
            } = report

            const doc = new jsPDF('p', 'mm', 'a4')
            const pageWidth = doc.internal.pageSize.getWidth()
            const margin = 18
            const contentWidth = pageWidth - margin * 2
            let currentY = 22

            doc.setFont('helvetica', 'bold')
            doc.setFontSize(19)
            doc.setTextColor(118, 87, 232)
            doc.text('AI Interview Performance Report', pageWidth / 2, currentY, {
                align: 'center'
            })

            currentY += 7
            doc.setDrawColor(118, 87, 232)
            doc.line(margin, currentY, pageWidth - margin, currentY)

            currentY += 12
            doc.setFontSize(12)
            doc.setTextColor(45, 38, 65)
            doc.text(`Role: ${item.role || 'Mock Interview'}`, margin, currentY)

            currentY += 7
            doc.text(`Interview Type: ${item.mode || 'Not specified'}`, margin, currentY)

            currentY += 7
            doc.text(`Date: ${formatDate(item.createdAt)}`, margin, currentY)

            currentY += 10
            doc.setFillColor(244, 240, 255)
            doc.roundedRect(margin, currentY, contentWidth, 19, 3, 3, 'F')

            doc.setFontSize(14)
            doc.setTextColor(118, 87, 232)
            doc.text(`Final Score: ${finalScore}/10`, pageWidth / 2, currentY + 12, {
                align: 'center'
            })

            currentY += 29
            doc.setFontSize(11)
            doc.setTextColor(45, 38, 65)
            doc.text(`Confidence: ${confidence}/10`, margin + 2, currentY)
            doc.text(`Communication: ${communication}/10`, margin + 65, currentY)
            doc.text(`Correctness: ${correctness}/10`, margin + 133, currentY)

            currentY += 12

            autoTable(doc, {
                startY: currentY,
                margin: { left: margin, right: margin },
                head: [['#', 'Question', 'Score', 'Feedback']],
                body: questionWiseScore.map((question, index) => [
                    String(index + 1),
                    question.question || 'Question not available',
                    `${question.score ?? 0}/10`,
                    question.feedback || 'No feedback available'
                ]),
                styles: {
                    fontSize: 8,
                    cellPadding: 3,
                    valign: 'top',
                    overflow: 'linebreak'
                },
                headStyles: {
                    fillColor: [118, 87, 232],
                    textColor: 255
                },
                columnStyles: {
                    0: { cellWidth: 10 },
                    1: { cellWidth: 55 },
                    2: { cellWidth: 18 },
                    3: { cellWidth: 'auto' }
                },
                alternateRowStyles: {
                    fillColor: [249, 247, 255]
                }
            })

            doc.save(`MockAura_Interview_Report_${item.role || 'Interview'}.pdf`)
        } catch (err) {
            setError(err.response?.data?.message || 'Unable to download report')
        } finally {
            setDownloadingId(null)
        }
    }

    const stats = [
        {
            title: 'Total Interviews',
            value: interviews.length,
            icon: <FaBriefcase />,
            color: 'bg-purple-100 text-purple-600'
        },
        {
            title: 'Completed',
            value: completed.length,
            icon: <FaCheckCircle />,
            color: 'bg-emerald-100 text-emerald-600'
        },
        {
            title: 'In Progress',
            value: incomplete.length,
            icon: <FaClock />,
            color: 'bg-amber-100 text-amber-600'
        },
        {
            title: 'Average Score',
            value: `${averageScore}/10`,
            icon: <FaStar />,
            color: 'bg-blue-100 text-blue-600'
        }
    ]

    return (
        <div className="min-h-screen bg-[#FAF9FF] px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl space-y-7">
                <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                    <div>
                        <p className="mb-2 text-sm font-semibold text-[#7657E8]">
                            YOUR PRACTICE JOURNEY
                        </p>

                        <h1 className="text-2xl font-bold tracking-tight text-[#211B3A] sm:text-3xl">
                            Interview History
                        </h1>

                        <p className="mt-2 text-sm text-[#817B96]">
                            Review your Aura mock interviews, performance and feedback.
                        </p>
                    </div>

                    <button
                        onClick={() => navigate('/interview')}
                        className="flex items-center justify-center gap-2 rounded-xl bg-[#7657E8] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-200 transition hover:bg-[#6545D5]"
                    >
                        <FaRobot />
                        Start New Interview
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {stats.map((stat, index) => (
                        <motion.div
                            key={stat.title}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.07 }}
                            className="rounded-2xl border border-[#EEEAF9] bg-white p-5 shadow-sm"
                        >
                            <div className={`flex h-11 w-11 items-center justify-center rounded-xl text-lg ${stat.color}`}>
                                {stat.icon}
                            </div>

                            <h2 className="mt-5 text-3xl font-bold text-[#211B3A]">
                                {stat.value}
                            </h2>

                            <p className="mt-1 text-sm font-semibold text-[#514A68]">
                                {stat.title}
                            </p>

                            <p className="mt-1 text-xs text-[#9A94AC]">
                                {stat.title === 'Total Interviews'
                                    ? 'All practice sessions'
                                    : stat.title === 'Completed'
                                        ? 'Successfully finished'
                                        : stat.title === 'In Progress'
                                            ? 'Unfinished sessions'
                                            : 'Across completed sessions'}
                            </p>
                        </motion.div>
                    ))}
                </div>

                <section className="rounded-2xl border border-[#EEEAF9] bg-white p-5 shadow-sm sm:p-6">
                    <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                        <div>
                            <h2 className="text-lg font-bold text-[#211B3A]">
                                Your Mock Interviews
                            </h2>

                            <p className="mt-1 text-sm text-[#918AA5]">
                                Your previous AI interview sessions
                            </p>
                        </div>

                        <span className="w-fit rounded-lg bg-[#F3EFFF] px-3 py-1.5 text-xs font-semibold text-[#7657E8]">
                            {interviews.length} Sessions
                        </span>
                    </div>

                    <div className="mb-5 flex flex-col gap-3 sm:flex-row">
                        <div className="relative flex-1">
                            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[#A49DB7]" />

                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search by role or interview type..."
                                className="w-full rounded-xl border border-[#EEEAF9] bg-[#FCFBFF] py-3 pl-11 pr-4 text-sm text-[#332B4A] outline-none focus:border-[#A58CF4]"
                            />
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {['All', 'Completed', 'Incompleted'].map(item => (
                                <button
                                    key={item}
                                    onClick={() => setFilter(item)}
                                    className={`rounded-xl px-4 py-3 text-xs font-semibold transition ${
                                        filter === item
                                            ? 'bg-[#7657E8] text-white shadow-md shadow-purple-200'
                                            : 'border border-[#EEEAF9] bg-white text-[#817B96] hover:bg-[#F7F4FF]'
                                    }`}
                                >
                                    {item}
                                </button>
                            ))}
                        </div>
                    </div>

                    {error && (
                        <div className="mb-4 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                            {error}
                        </div>
                    )}

                    {loading ? (
                        <div className="py-16 text-center text-sm text-[#918AA5]">
                            Loading interview history...
                        </div>
                    ) : filteredInterviews.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-[#DED7F2] bg-[#FCFBFF] px-5 py-14 text-center">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F1ECFF] text-2xl text-[#7657E8]">
                                <FaFileAlt />
                            </div>

                            <h3 className="mt-4 font-bold text-[#332B4A]">
                                {search || filter !== 'All'
                                    ? 'No matching interviews'
                                    : 'No interviews yet'}
                            </h3>

                            <p className="mx-auto mt-2 max-w-sm text-sm text-[#918AA5]">
                                Your Aura mock interview sessions and performance reports will appear here.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredInterviews.map((item, index) => {
                                const score = getScore(item)
                                const isCompleted = item.status === 'Completed'

                                return (
                                    <motion.div
                                        key={item._id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.04 }}
                                        className="relative flex flex-col gap-4 rounded-2xl border border-[#F0EDF7] p-4 transition hover:border-[#DCD2FA] sm:flex-row sm:items-center sm:justify-between sm:px-5"
                                    >
                                        <div className="flex min-w-0 flex-1 items-center gap-3">
                                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#F1ECFF] text-lg text-[#7657E8]">
                                                <FaBriefcase />
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <h3 className="truncate font-bold text-[#332B4A]">
                                                    {item.role || 'Mock Interview'}
                                                </h3>

                                                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#918AA5]">
                                                    <span>
                                                        {item.experience || 'Experience not specified'} experience
                                                    </span>

                                                    <span className="hidden sm:inline">•</span>

                                                    <span>{item.mode || 'Interview'}</span>

                                                    <span className="hidden sm:inline">•</span>

                                                    <span className="flex items-center gap-1">
                                                        <FaCalendarAlt />
                                                        {formatDate(item.createdAt)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
                                            <div className="flex items-center gap-4">
                                                <div className="text-center">
                                                    <p className="text-[10px] text-[#9A94AC]">
                                                        Questions
                                                    </p>

                                                    <p className="mt-1 text-sm font-semibold text-[#514A68]">
                                                        {item.questions?.length || 0}
                                                    </p>
                                                </div>

                                                {isCompleted && (
                                                    <div className="text-center">
                                                        <p className="text-[10px] text-[#9A94AC]">
                                                            Score
                                                        </p>

                                                        <p className="mt-1 text-sm font-bold text-[#7657E8]">
                                                            {score}/10
                                                        </p>
                                                    </div>
                                                )}
                                            </div>

                                            <span className={`rounded-lg border px-2.5 py-1.5 text-[10px] font-semibold ${
                                                isCompleted
                                                    ? 'border-emerald-100 bg-emerald-50 text-emerald-600'
                                                    : 'border-amber-100 bg-amber-50 text-amber-600'
                                            }`}>
                                                {isCompleted ? 'Completed' : 'Incompleted'}
                                            </span>

                                            <div
                                                className="relative"
                                                ref={openMenu === item._id ? menuRef : null}
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() => setOpenMenu(
                                                        openMenu === item._id ? null : item._id
                                                    )}
                                                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#EEEAF9] text-[#817B96] transition hover:bg-[#F5F1FF] hover:text-[#7657E8]"
                                                >
                                                    <FaEllipsisV />
                                                </button>

                                                {openMenu === item._id && (
                                                    <div className="absolute bottom-12 right-0 z-40 w-48 overflow-hidden rounded-xl border border-[#EEEAF9] bg-white py-1 shadow-xl">
                                                        <button
                                                            type="button"
                                                            disabled={!isCompleted}
                                                            onClick={() => {
                                                                setOpenMenu(null)
                                                                navigate(`/report/${item._id}`)
                                                            }}
                                                            className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-[#514A68] hover:bg-[#F8F6FF] disabled:cursor-not-allowed disabled:opacity-40"
                                                        >
                                                            <FaEye className="text-[#7657E8]" />
                                                            View Report
                                                        </button>

                                                        <button
                                                            type="button"
                                                            disabled={!isCompleted || downloadingId === item._id}
                                                            onClick={() => downloadReport(item)}
                                                            className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-[#514A68] hover:bg-[#F8F6FF] disabled:cursor-not-allowed disabled:opacity-40"
                                                        >
                                                            <FaDownload className="text-[#7657E8]" />
                                                            {downloadingId === item._id
                                                                ? 'Downloading...'
                                                                : 'Download Report'}
                                                        </button>

                                                        <div className="my-1 border-t border-[#F0EDF7]" />

                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setOpenMenu(null)
                                                                setConfirmDelete(item)
                                                            }}
                                                            className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-rose-500 hover:bg-rose-50"
                                                        >
                                                            <FaTrash />
                                                            Delete Interview
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                )
                            })}
                        </div>
                    )}
                </section>
            </div>

            {confirmDelete && (
                <div
                    className="fixed inset-0 z-100 flex items-center justify-center bg-[#211B3A]/50 p-4 backdrop-blur-sm"
                    onMouseDown={event => {
                        if (event.target === event.currentTarget && !deletingId) {
                            setConfirmDelete(null)
                        }
                    }}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.92, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
                    >
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-xl text-rose-500">
                            <FaTrash />
                        </div>

                        <h3 className="mt-4 text-center text-lg font-bold text-[#211B3A]">
                            Delete Interview?
                        </h3>

                        <p className="mt-2 text-center text-sm leading-6 text-[#918AA5]">
                            Are you sure you want to delete your interview for{' '}
                            <span className="font-semibold text-[#514A68]">
                                {confirmDelete.role || 'this role'}
                            </span>
                            ? This interview and its report will be permanently deleted.
                        </p>

                        <div className="mt-6 flex gap-3">
                            <button
                                type="button"
                                onClick={() => setConfirmDelete(null)}
                                disabled={Boolean(deletingId)}
                                className="flex-1 rounded-xl border border-[#EAE5F4] px-4 py-3 text-sm font-semibold text-[#817B96] transition hover:bg-[#F8F6FF] disabled:opacity-50"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={Boolean(deletingId)}
                                className="flex-1 rounded-xl bg-rose-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:opacity-60"
                            >
                                {deletingId ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    )
}

export default History
