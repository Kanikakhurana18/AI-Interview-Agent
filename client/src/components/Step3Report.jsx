
import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
    FaArrowLeft,
    FaDownload,
    FaChartLine,
    FaBullseye,
    FaComments,
    FaCheckCircle,
    FaLightbulb,
    FaStar,
    FaTrophy,
    FaBrain,
    FaArrowUp,
    FaRegFileAlt,
    FaSpinner,
    FaExclamationCircle
} from 'react-icons/fa'
import { motion } from 'motion/react'
import { buildStyles, CircularProgressbar } from 'react-circular-progressbar'
import 'react-circular-progressbar/dist/styles.css'
import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

function Step3Report({
    report,
    idealAnswersLoading = false,
    idealAnswersError = ''
}) {
    const navigate = useNavigate()

    if (!report) {
        return (
            <div className="min-h-screen bg-[#FAF9FF] flex items-center justify-center px-4">
                <div className="text-center">
                    <div className="w-11 h-11 border-4 border-[#EAE5FF] border-t-[#7657E8] rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-[#51466F] font-medium">Preparing your interview report...</p>
                </div>
            </div>
        )
    }

    const {
        finalScore = 0,
        confidence = 0,
        communication = 0,
        correctness = 0,
        questionWiseScore = []
    } = report

    const score = Number(finalScore) || 0
    const percentage = Math.min(Math.max(score * 10, 0), 100)

    const questionsScoreData = questionWiseScore.map((item, index) => ({
        name: `Q${index + 1}`,
        score: Number(item.score) || 0
    }))

    const skills = [
        {
            name: 'Confidence',
            value: Number(confidence) || 0,
            icon: FaBullseye,
            description: 'How confidently you expressed your thoughts'
        },
        {
            name: 'Communication',
            value: Number(communication) || 0,
            icon: FaComments,
            description: 'Clarity and structure of your responses'
        },
        {
            name: 'Correctness',
            value: Number(correctness) || 0,
            icon: FaCheckCircle,
            description: 'Accuracy and relevance of your answers'
        }
    ]

    const performance = score >= 8
        ? {
            title: 'Excellent Performance',
            subtitle: 'You are showing strong interview readiness.',
            advice: 'Keep refining your answers and maintain your confidence.',
            color: '#168B68',
            background: '#E9F8F2',
            icon: FaTrophy
        }
        : score >= 5
            ? {
                title: 'Good Progress',
                subtitle: 'You have a good foundation to build on.',
                advice: 'Focus on clearer explanations and more structured answers.',
                color: '#B7791F',
                background: '#FFF7E8',
                icon: FaArrowUp
            }
            : {
                title: 'Room to Improve',
                subtitle: 'Every practice session is a step forward.',
                advice: 'Work on answer structure, clarity and confidence through regular practice.',
                color: '#D45B75',
                background: '#FFF0F3',
                icon: FaLightbulb
            }

    const unansweredCount = questionWiseScore.filter(
        question => !question.answer?.trim()
    ).length

    const averageQuestionScore = questionWiseScore.length
        ? questionWiseScore.reduce(
            (total, question) => total + (Number(question.score) || 0),
            0
        ) / questionWiseScore.length
        : 0

    const downloadPDF = () => {
        const doc = new jsPDF('p', 'mm', 'a4')
        const pageWidth = doc.internal.pageSize.getWidth()
        const pageHeight = doc.internal.pageSize.getHeight()
        const margin = 16
        const contentWidth = pageWidth - margin * 2

        let currentY = 20

        const addSectionTitle = (title) => {
            if (currentY > pageHeight - 30) {
                doc.addPage()
                currentY = 20
            }

            doc.setFont('helvetica', 'bold')
            doc.setFontSize(12)
            doc.setTextColor(118, 87, 232)
            doc.text(title, margin, currentY)
            currentY += 7
        }

        const addQuestionSection = (title, content) => {
            autoTable(doc, {
                startY: currentY,
                margin: {
                    left: margin,
                    right: margin,
                    bottom: 16
                },
                head: [[title]],
                body: [[content || 'Not available']],
                theme: 'grid',
                styles: {
                    font: 'helvetica',
                    fontSize: 9,
                    cellPadding: 4,
                    overflow: 'linebreak',
                    valign: 'top',
                    textColor: [81, 70, 111],
                    lineColor: [234, 229, 255],
                    lineWidth: 0.2
                },
                headStyles: {
                    fillColor: [240, 235, 255],
                    textColor: [118, 87, 232],
                    fontStyle: 'bold'
                },
                didDrawPage: () => {
                    doc.setFontSize(8)
                    doc.setTextColor(155, 145, 184)
                    doc.text(
                        'MockAura AI | Interview Performance Report',
                        margin,
                        pageHeight - 8
                    )
                }
            })

            currentY = doc.lastAutoTable.finalY + 5
        }

        doc.setFillColor(118, 87, 232)
        doc.roundedRect(margin, currentY, contentWidth, 34, 4, 4, 'F')

        doc.setFont('helvetica', 'bold')
        doc.setFontSize(19)
        doc.setTextColor(255, 255, 255)
        doc.text('MockAura AI', margin + 8, currentY + 12)

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(10)
        doc.text('Interview Performance Report', margin + 8, currentY + 21)

        currentY += 45

        doc.setFont('helvetica', 'bold')
        doc.setFontSize(15)
        doc.setTextColor(33, 27, 58)
        doc.text('Your Performance Overview', margin, currentY)

        currentY += 10

        doc.setFillColor(240, 235, 255)
        doc.roundedRect(margin, currentY, contentWidth, 25, 3, 3, 'F')

        doc.setFontSize(21)
        doc.setTextColor(118, 87, 232)
        doc.text(`${score.toFixed(1)}/10`, margin + 8, currentY + 11)

        doc.setFontSize(10)
        doc.setTextColor(33, 27, 58)
        doc.text(performance.title, margin + 42, currentY + 10)

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        doc.setTextColor(81, 70, 111)
        doc.text(performance.subtitle, margin + 42, currentY + 17)

        currentY += 34

        autoTable(doc, {
            startY: currentY,
            margin: { left: margin, right: margin },
            head: [['Performance Metric', 'Score']],
            body: [
                ['Confidence', `${Number(confidence).toFixed(1)}/10`],
                ['Communication', `${Number(communication).toFixed(1)}/10`],
                ['Correctness', `${Number(correctness).toFixed(1)}/10`],
                ['Average Question Score', `${averageQuestionScore.toFixed(1)}/10`]
            ],
            theme: 'grid',
            styles: {
                fontSize: 9,
                cellPadding: 4,
                textColor: [81, 70, 111],
                lineColor: [234, 229, 255]
            },
            headStyles: {
                fillColor: [118, 87, 232],
                textColor: 255
            },
            columnStyles: {
                1: { halign: 'center', cellWidth: 45 }
            }
        })

        currentY = doc.lastAutoTable.finalY + 10

        addSectionTitle('Professional Advice')
        addQuestionSection('Performance Recommendation', performance.advice)

        addSectionTitle('Question-wise Analysis')

        questionWiseScore.forEach((question, index) => {
            if (currentY > pageHeight - 45) {
                doc.addPage()
                currentY = 20
            }

            doc.setFillColor(240, 235, 255)
            doc.roundedRect(margin, currentY, contentWidth, 11, 2, 2, 'F')

            doc.setFont('helvetica', 'bold')
            doc.setFontSize(10)
            doc.setTextColor(118, 87, 232)
            doc.text(`Question ${index + 1} | Score: ${question.score ?? 0}/10`, margin + 4, currentY + 7)

            currentY += 16

            addQuestionSection('Interview Question', question.question || 'Question not available')
            addQuestionSection('Your Answer', question.answer?.trim() || 'You did not submit an answer.')
            addQuestionSection('Ideal Answer', question.idealAnswer || 'Ideal answer is not available.')
            addQuestionSection('AI Feedback', question.feedback || 'No feedback available.')
            addQuestionSection('Why This Score?', question.scoreReason || 'Score explanation is not available.')
            addQuestionSection('How to Improve', question.improvement || 'No improvement suggestion available.')

            currentY += 5
        })

        const totalPages = doc.internal.getNumberOfPages()

        for (let page = 1; page <= totalPages; page++) {
            doc.setPage(page)
            doc.setFontSize(8)
            doc.setTextColor(155, 145, 184)
            doc.text(
                `Page ${page} of ${totalPages}`,
                pageWidth - margin,
                pageHeight - 8,
                { align: 'right' }
            )
        }

        doc.save('MockAura_AI_Interview_Report.pdf')
    }

    const MetricCard = ({ title, value, icon: Icon, description }) => (
        <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-[#EAE5FF] rounded-2xl p-5 shadow-[0_4px_20px_rgba(70,48,130,0.04)]"
        >
            <div className="flex items-start justify-between gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#F0EBFF] flex items-center justify-center">
                    <Icon className="text-[#7657E8] text-lg" />
                </div>
                <span className="text-xs font-semibold text-[#9B91B8]">OUT OF 10</span>
            </div>

            <div className="mt-5">
                <p className="text-2xl font-bold text-[#211B3A]">
                    {Number(value).toFixed(1)}
                    <span className="text-sm text-[#9B91B8] font-medium">/10</span>
                </p>
                <p className="font-semibold text-[#51466F] text-sm mt-1">{title}</p>
                <p className="text-xs text-[#9B91B8] mt-2 leading-relaxed">{description}</p>
            </div>
        </motion.div>
    )

    return (
        <div className="min-h-screen bg-[#FAF9FF] px-4 sm:px-6 lg:px-10 py-6 sm:py-9">
            <div className="max-w-[1440px] mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 mb-7">
                    <div className="flex items-start gap-3 sm:gap-4">
                        <button
                            onClick={() => navigate('/history')}
                            className="w-11 h-11 shrink-0 flex items-center justify-center bg-white rounded-xl border border-[#EAE5FF] text-[#7657E8] shadow-sm hover:bg-[#F0EBFF] hover:-translate-x-0.5 transition-all"
                        >
                            <FaArrowLeft />
                        </button>

                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="w-2 h-2 rounded-full bg-[#7657E8]" />
                                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9B91B8]">
                                    MockAura AI
                                </p>
                            </div>

                            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#211B3A]">
                                Interview Report
                            </h1>

                            <p className="text-sm text-[#817895] mt-1">
                                Understand your performance and discover where to improve.
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={downloadPDF}
                        className="inline-flex items-center justify-center gap-2.5 bg-[#7657E8] hover:bg-[#6546D6] text-white px-5 py-3.5 rounded-xl shadow-[0_6px_18px_rgba(118,87,232,0.22)] hover:shadow-[0_8px_22px_rgba(118,87,232,0.3)] transition-all font-semibold text-sm w-full sm:w-auto"
                    >
                        <FaDownload />
                        Download Report
                    </button>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#7657E8] via-[#8063E9] to-[#A18BF0] p-6 sm:p-8 lg:p-10 mb-7 shadow-[0_12px_35px_rgba(118,87,232,0.18)]"
                >
                    <div className="absolute -top-24 -right-16 w-72 h-72 rounded-full border border-white/10" />
                    <div className="absolute -bottom-36 right-32 w-80 h-80 rounded-full border border-white/10" />
                    <div className="absolute top-8 right-10 w-3 h-3 bg-white/20 rounded-full" />

                    <div className="relative z-10 grid grid-cols-1 md:grid-cols-[1fr_auto] items-center gap-8">
                        <div className="text-white">
                            <div className="inline-flex items-center gap-2 bg-white/15 border border-white/20 rounded-full px-3 py-1.5 text-xs font-semibold mb-5">
                                <FaStar className="text-[#FFE59A]" />
                                YOUR PERFORMANCE SUMMARY
                            </div>

                            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight">
                                {performance.title}
                            </h2>

                            <p className="text-white/80 text-sm sm:text-base mt-3 max-w-xl leading-relaxed">
                                {performance.subtitle}
                            </p>

                            <div className="flex flex-wrap gap-3 mt-7">
                                <div className="bg-white/15 border border-white/15 rounded-xl px-4 py-3 min-w-[125px]">
                                    <p className="text-white/65 text-xs">Questions</p>
                                    <p className="text-xl font-bold mt-1">{questionWiseScore.length}</p>
                                </div>

                                <div className="bg-white/15 border border-white/15 rounded-xl px-4 py-3 min-w-[125px]">
                                    <p className="text-white/65 text-xs">Average Score</p>
                                    <p className="text-xl font-bold mt-1">{averageQuestionScore.toFixed(1)}/10</p>
                                </div>

                                <div className="bg-white/15 border border-white/15 rounded-xl px-4 py-3 min-w-[125px]">
                                    <p className="text-white/65 text-xs">Unanswered</p>
                                    <p className="text-xl font-bold mt-1">{unansweredCount}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-center md:justify-end">
                            <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-white/10 border border-white/20 p-3 shadow-xl">
                                <CircularProgressbar
                                    value={percentage}
                                    text={`${score.toFixed(1)}`}
                                    styles={buildStyles({
                                        textSize: '25px',
                                        pathColor: '#FFFFFF',
                                        textColor: '#FFFFFF',
                                        trailColor: 'rgba(255,255,255,0.2)',
                                        strokeLinecap: 'round',
                                        pathTransitionDuration: 1.2
                                    })}
                                />
                                <p className="text-center text-white/75 text-xs font-medium -mt-1">
                                    OUT OF 10
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-7">
                    <MetricCard title="Overall Score" value={score} icon={FaTrophy} description="Your overall interview performance" />
                    <MetricCard title="Confidence" value={confidence} icon={FaBullseye} description="Confidence while answering questions" />
                    <MetricCard title="Communication" value={communication} icon={FaComments} description="Clarity and structure of your responses" />
                    <MetricCard title="Correctness" value={correctness} icon={FaCheckCircle} description="Accuracy of your answers" />
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-7">
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="xl:col-span-2 bg-white border border-[#EAE5FF] rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-[0_4px_20px_rgba(70,48,130,0.04)]"
                    >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                            <div>
                                <div className="flex items-center gap-2">
                                    <div className="w-9 h-9 rounded-xl bg-[#F0EBFF] flex items-center justify-center">
                                        <FaChartLine className="text-[#7657E8]" />
                                    </div>
                                    <h3 className="font-bold text-lg text-[#211B3A]">Performance Trend</h3>
                                </div>
                                <p className="text-xs sm:text-sm text-[#9B91B8] mt-2">
                                    Your score across individual questions
                                </p>
                            </div>

                            <span className="text-xs font-semibold text-[#7657E8] bg-[#F0EBFF] px-3 py-2 rounded-lg w-fit">
                                {questionWiseScore.length} Questions
                            </span>
                        </div>

                        <div className="h-64 sm:h-72 w-full">
                            {questionsScoreData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={questionsScoreData} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#7657E8" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#7657E8" stopOpacity={0.02} />
                                            </linearGradient>
                                        </defs>

                                        <CartesianGrid strokeDasharray="4 5" stroke="#EEE9FA" vertical={false} />
                                        <XAxis dataKey="name" tick={{ fill: '#817895', fontSize: 12 }} axisLine={false} tickLine={false} dy={10} />
                                        <YAxis domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} tick={{ fill: '#9B91B8', fontSize: 11 }} axisLine={false} tickLine={false} />

                                        <Tooltip
                                            cursor={{ stroke: '#B9A9F4', strokeDasharray: '4 4' }}
                                            contentStyle={{
                                                borderRadius: '14px',
                                                border: '1px solid #EAE5FF',
                                                boxShadow: '0 8px 24px rgba(70,48,130,0.1)',
                                                color: '#211B3A',
                                                fontSize: '13px'
                                            }}
                                            formatter={(value) => [`${value}/10`, 'Score']}
                                        />

                                        <Area
                                            type="monotone"
                                            dataKey="score"
                                            stroke="#7657E8"
                                            fill="url(#scoreGradient)"
                                            strokeWidth={3}
                                            activeDot={{ r: 6, fill: '#7657E8', stroke: '#FFFFFF', strokeWidth: 3 }}
                                            dot={{ r: 4, fill: '#FFFFFF', stroke: '#7657E8', strokeWidth: 2 }}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-sm text-[#9B91B8]">
                                    No question scores available.
                                </div>
                            )}
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white border border-[#EAE5FF] rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-[0_4px_20px_rgba(70,48,130,0.04)]"
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-9 h-9 rounded-xl bg-[#F0EBFF] flex items-center justify-center">
                                <FaBrain className="text-[#7657E8]" />
                            </div>
                            <h3 className="font-bold text-lg text-[#211B3A]">Skill Evaluation</h3>
                        </div>

                        <p className="text-xs sm:text-sm text-[#9B91B8] mb-7">
                            Your performance across key skills
                        </p>

                        <div className="space-y-7">
                            {skills.map((item, index) => (
                                <div key={index}>
                                    <div className="flex items-center justify-between gap-3 mb-2.5">
                                        <div className="flex items-center gap-2">
                                            <item.icon className="text-[#7657E8] text-sm" />
                                            <span className="text-sm font-semibold text-[#51466F]">{item.name}</span>
                                        </div>

                                        <span className="text-sm font-bold text-[#7657E8]">
                                            {item.value.toFixed(1)}/10
                                        </span>
                                    </div>

                                    <div className="h-2.5 bg-[#F0EBFF] rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.min(Math.max(item.value * 10, 0), 100)}%` }}
                                            transition={{ duration: 0.9, delay: index * 0.15 }}
                                            className="h-full bg-gradient-to-r from-[#7657E8] to-[#A18BF0] rounded-full"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div
                            className="mt-8 rounded-2xl p-4 border"
                            style={{
                                backgroundColor: performance.background,
                                borderColor: `${performance.color}25`
                            }}
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <performance.icon style={{ color: performance.color }} />
                                <p className="text-sm font-bold" style={{ color: performance.color }}>
                                    Performance Insight
                                </p>
                            </div>
                            <p className="text-xs leading-relaxed text-[#51466F]">
                                {performance.advice}
                            </p>
                        </div>
                    </motion.div>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white border border-[#EAE5FF] rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-[0_4px_20px_rgba(70,48,130,0.04)]"
                >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                        <div>
                            <div className="flex items-center gap-2">
                                <div className="w-9 h-9 rounded-xl bg-[#F0EBFF] flex items-center justify-center">
                                    <FaRegFileAlt className="text-[#7657E8]" />
                                </div>
                                <h3 className="font-bold text-lg sm:text-xl text-[#211B3A]">
                                    Question-wise Analysis
                                </h3>
                            </div>
                            <p className="text-xs sm:text-sm text-[#9B91B8] mt-2">
                                Review your answers, AI feedback and suggested improvements.
                            </p>
                        </div>

                        <span className="bg-[#F0EBFF] text-[#7657E8] px-3 py-2 rounded-lg text-xs font-bold w-fit">
                            {questionWiseScore.length} Questions Reviewed
                        </span>
                    </div>

                    {idealAnswersLoading && (
                        <div className="mb-5 flex items-center gap-3 rounded-xl border border-[#E5DCFF] bg-[#F6F2FF] p-4 text-sm text-[#7657E8]">
                            <FaSpinner className="animate-spin shrink-0" />
                            <span>Generating personalized ideal answers for your interview questions...</span>
                        </div>
                    )}

                    {!idealAnswersLoading && idealAnswersError && (
                        <div className="mb-5 flex items-start gap-3 rounded-xl border border-[#F3D9DF] bg-[#FFF5F7] p-4 text-sm text-[#C34E68]">
                            <FaExclamationCircle className="mt-0.5 shrink-0" />
                            <span>{idealAnswersError}</span>
                        </div>
                    )}

                    {questionWiseScore.length > 0 ? (
                        <div className="space-y-5">
                            {questionWiseScore.map((q, index) => {
                                const questionScore = Number(q.score) || 0
                                const scoreColor = questionScore >= 8
                                    ? '#168B68'
                                    : questionScore >= 5
                                        ? '#B7791F'
                                        : '#D45B75'

                                return (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.06 }}
                                        className="border border-[#EAE5FF] rounded-2xl overflow-hidden"
                                    >
                                        <div className="bg-gradient-to-r from-[#F7F4FF] to-white p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                            <div className="flex items-start gap-3">
                                                <div className="w-9 h-9 shrink-0 rounded-xl bg-[#7657E8] text-white flex items-center justify-center font-bold text-sm shadow-sm">
                                                    {String(index + 1).padStart(2, '0')}
                                                </div>

                                                <div className="min-w-0">
                                                    <p className="text-[11px] uppercase tracking-wider font-bold text-[#9B91B8] mb-1">
                                                        Question {index + 1}
                                                    </p>
                                                    <p className="font-semibold text-[#211B3A] text-sm sm:text-base leading-relaxed">
                                                        {q.question || 'Question not available'}
                                                    </p>
                                                </div>
                                            </div>

                                            <div
                                                className="rounded-xl px-4 py-2 text-sm font-bold w-fit shrink-0"
                                                style={{
                                                    color: scoreColor,
                                                    backgroundColor: `${scoreColor}12`
                                                }}
                                            >
                                                {questionScore.toFixed(1)}/10
                                            </div>
                                        </div>

                                        <div className="p-4 sm:p-5 space-y-4">
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                                <div className="bg-[#FAF9FF] border border-[#EAE5FF] rounded-xl p-4">
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <div className="w-7 h-7 rounded-lg bg-[#F0EBFF] flex items-center justify-center">
                                                            <FaComments className="text-[#7657E8] text-xs" />
                                                        </div>
                                                        <p className="text-sm font-bold text-[#7657E8]">Your Answer</p>
                                                    </div>

                                                    <p className="text-sm text-[#51466F] leading-relaxed whitespace-pre-wrap break-words">
                                                        {q.answer?.trim() || 'You did not submit an answer.'}
                                                    </p>
                                                </div>

                                                <div className="bg-[#F6F2FF] border border-[#E5DCFF] rounded-xl p-4">
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center">
                                                            <FaStar className="text-[#7657E8] text-xs" />
                                                        </div>
                                                        <p className="text-sm font-bold text-[#7657E8]">Ideal Answer</p>
                                                    </div>

                                                    {q.idealAnswer?.trim() ? (
                                                        <p className="text-sm text-[#51466F] leading-relaxed whitespace-pre-wrap break-words">
                                                            {q.idealAnswer}
                                                        </p>
                                                    ) : idealAnswersLoading ? (
                                                        <div className="flex items-center gap-2 text-sm text-[#817895] py-2">
                                                            <FaSpinner className="animate-spin text-[#7657E8]" />
                                                            Generating an ideal answer...
                                                        </div>
                                                    ) : (
                                                        <p className="text-sm text-[#817895] leading-relaxed">
                                                            Ideal answer is currently unavailable.
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="bg-white border border-[#EAE5FF] rounded-xl p-4">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <FaBrain className="text-[#7657E8] text-sm" />
                                                    <p className="text-sm font-bold text-[#211B3A]">AI Feedback</p>
                                                </div>
                                                <p className="text-sm text-[#51466F] leading-relaxed whitespace-pre-wrap break-words">
                                                    {q.feedback || 'No feedback available.'}
                                                </p>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="bg-[#FAF9FF] border border-[#EAE5FF] rounded-xl p-4">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <FaBullseye className="text-[#7657E8] text-sm" />
                                                        <p className="text-sm font-bold text-[#7657E8]">Why This Score?</p>
                                                    </div>
                                                    <p className="text-sm text-[#51466F] leading-relaxed whitespace-pre-wrap break-words">
                                                        {q.scoreReason || 'Score explanation is not available.'}
                                                    </p>
                                                </div>

                                                <div className="bg-[#F5FBF8] border border-[#DCEFE5] rounded-xl p-4">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <FaLightbulb className="text-[#168B68] text-sm" />
                                                        <p className="text-sm font-bold text-[#168B68]">How to Improve</p>
                                                    </div>
                                                    <p className="text-sm text-[#51466F] leading-relaxed whitespace-pre-wrap break-words">
                                                        {q.improvement || 'No improvement suggestion available.'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <div className="w-14 h-14 rounded-2xl bg-[#F0EBFF] flex items-center justify-center mx-auto mb-4">
                                <FaRegFileAlt className="text-[#7657E8] text-xl" />
                            </div>
                            <p className="font-semibold text-[#211B3A]">No question analysis available</p>
                            <p className="text-sm text-[#9B91B8] mt-1">
                                Question-wise results will appear here.
                            </p>
                        </div>
                    )}
                </motion.div>

                <div className="text-center py-8">
                    <p className="text-xs text-[#A69DBB]">Powered by MockAura AI</p>
                    <p className="text-xs text-[#B5ADC9] mt-1">Practice smarter. Perform better.</p>
                </div>
            </div>
        </div>
    )
}

export default Step3Report
