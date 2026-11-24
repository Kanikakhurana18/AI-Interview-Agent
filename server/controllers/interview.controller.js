import fs from "fs"
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs"
import { askAi } from "../services/openRouter.services.js"
import User from "../models/user.model.js"
import Interview from "../models/interview.model.js"
import mongoose from "mongoose"

const parseAIJson = (response) => {
    if (!response) {
        throw new Error("AI returned an empty response")
    }

    const text = typeof response === "string" ? response : JSON.stringify(response)
    let cleaned = text
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim()

    const start = cleaned.indexOf("{")
    const end = cleaned.lastIndexOf("}")

    if (start === -1 || end === -1) {
        throw new Error("AI did not return valid JSON")
    }

    cleaned = cleaned.substring(start, end + 1)

    return JSON.parse(cleaned)
}
   
   const isSkippedAnswer = answer => {
    if (typeof answer !== "string" || !answer.trim()) return true

    const normalized = answer.trim().toLowerCase()

    return [
        "you did not submit an answer",
        "no answer submitted",
        "you skipped this question",
        "not answered"
    ].some(text => normalized.includes(text))
}

const getQuestionReport = question => {
    const skipped = isSkippedAnswer(question.answer)
    const score = skipped ? 0 : Number(question.score) || 0

    return {
        question: question.question || "",
        answer: skipped ? "" : question.answer.trim(),
        score,
        feedback: skipped
            ? "You did not submit an answer for this question, so it could not be evaluated."
            : question.feedback?.trim() || "Your answer was submitted, but detailed feedback could not be generated.",
        scoreReason: skipped
            ? "This question received 0/10 because no answer was submitted."
            : question.scoreReason?.trim() || `Your answer received ${score}/10 based on its relevance, clarity, communication and accuracy.`,
        improvement: skipped
            ? "Attempt every question. Start with a direct response, explain your reasoning, and include a relevant example wherever possible."
            : question.improvement?.trim() || "Structure your response clearly, address the question directly, and support your points with a relevant example.",
        confidence: skipped ? 0 : Number(question.confidence) || 0,
        communication: skipped ? 0 : Number(question.communication) || 0,
        correctness: skipped ? 0 : Number(question.correctness) || 0
    }
}

export const analyseResume = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "Resume required" })
        }

        const filePath = req.file.path
        const fileBuffer = await fs.promises.readFile(filePath)
        const uint8Array = new Uint8Array(fileBuffer)
        const pdf = await pdfjsLib.getDocument({ data: uint8Array }).promise

        let resumeText = ""

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum)
            const content = await page.getTextContent()
            const pageText = content.items.map(item => item.str).join(" ")
            resumeText += pageText + "\n"
        }

        resumeText = resumeText.replace(/\s+/g, " ").trim()

        const messages = [
            {
                role: "system",
                content: `Extract structured data from the resume.
Return strictly valid JSON in this format:
{
    "role": "string",
    "experience": "string",
    "projects": ["project1", "project2"],
    "skills": ["skill1", "skill2"]
}`
            },
            {
                role: "user",
                content: resumeText
            }
        ]

        const aiResponse = await askAi(messages)
        const parsed = parseAIJson(aiResponse)

        await fs.promises.unlink(filePath)

        return res.status(200).json({
            role: parsed.role || "",
            experience: parsed.experience || "",
            projects: Array.isArray(parsed.projects) ? parsed.projects : [],
            skills: Array.isArray(parsed.skills) ? parsed.skills : [],
            resumeText
        })
    } catch (error) {
        console.log(error)

        if (req.file && fs.existsSync(req.file.path)) {
            await fs.promises.unlink(req.file.path).catch(() => {})
        }

        return res.status(500).json({ message: error.message })
    }
}

export const generateQuestion = async (req, res) => {
    try {
        let {
            role,
            experience,
            mode,
            resumeText,
            projects,
            skills,
            jobDescription
        } = req.body

        role = role?.trim()
        experience = experience?.trim()
        mode = mode?.trim()
        jobDescription = typeof jobDescription === "string"
            ? jobDescription.trim().slice(0, 20000)
            : ""

        if (!role || !experience || !mode) {
            return res.status(400).json({
                message: "Role, Experience and mode are required."
            })
        }

        if (!["HR", "Technical"].includes(mode)) {
            return res.status(400).json({
                message: "Invalid interview mode."
            })
        }

        const user = await User.findById(req.userId)

        if (!user) {
            return res.status(404).json({ message: "User not found" })
        }

        if (user.credits < 100) {
            return res.status(400).json({
                message: "Not enough credits. Minimum 100 required."
            })
        }

        const projectText = Array.isArray(projects) && projects.length
            ? projects.join(", ")
            : "Not provided"

        const skillsText = Array.isArray(skills) && skills.length
            ? skills.join(", ")
            : "Not provided"

        const safeResume = typeof resumeText === "string" && resumeText.trim()
            ? resumeText.trim().slice(0, 20000)
            : "Not provided"

        const safeJobDescription = jobDescription || "Not provided"

        const userPrompt = `
Role: ${role}
Experience: ${experience}
Interview Mode: ${mode}

Candidate Projects:
${projectText}

Candidate Skills:
${skillsText}

Resume:
${safeResume}

Job Description:
${safeJobDescription}
`

        const messages = [
            {
                role: "system",
                content: `You are an experienced professional interviewer conducting a realistic job interview.

Generate exactly 5 interview questions for the candidate.

Use the candidate's role, experience, resume, projects, skills and job description to create relevant questions.

Question distribution:
1. Easy question based on the candidate's resume, background or experience.
2. Easy question based on a project or skill mentioned in the resume.
3. Medium question based on an important skill or responsibility from the job description.
4. Medium question connecting the candidate's resume or project experience with the job description.
5. Hard and challenging question relevant to the target role and job requirements.

If no job description is provided, generate all questions using the role, experience, resume, projects and skills.

For Technical mode:
- Ask practical technical and problem-solving questions.
- Focus on technologies and skills relevant to the role and job description.
- Include questions about the candidate's actual projects where relevant.
- Do not ask generic questions unrelated to the candidate's profile.

For HR mode:
- Ask realistic behavioral, situational and experience-based questions.
- Use the resume and job description to make questions relevant to the position.
- Include questions about teamwork, challenges, decisions and professional goals where appropriate.

Strict rules:
- Each question must contain between 15 and 25 words.
- Each question must be one complete sentence.
- Do not number the questions.
- Do not add explanations.
- Do not add headings.
- Do not add extra text before or after the questions.
- Return one question per line.
- Use simple, natural and conversational English.
- Questions must be specific, practical and realistic.
- Do not invent projects, skills or experience that are not provided.`
            },
            {
                role: "user",
                content: userPrompt
            }
        ]

        const aiResponse = await askAi(messages)
        const responseText = typeof aiResponse === "string"
            ? aiResponse
            : ""

        if (!responseText.trim()) {
            return res.status(500).json({
                message: "AI returned empty response."
            })
        }

        const questionsArray = responseText
            .split("\n")
            .map(q => q.trim())
            .map(q => q.replace(/^\d+[\).\s-]+/, "").replace(/^[-*]\s*/, ""))
            .filter(q => q.length > 0)
            .slice(0, 5)

        if (questionsArray.length !== 5) {
            return res.status(500).json({
                message: "AI failed to generate 5 questions. Please try again."
            })
        }

        const updatedUser = await User.findOneAndUpdate(
            {
                _id: user._id,
                credits: { $gte: 100 }
            },
            {
                $inc: { credits: -100 }
            },
            { returnDocument: "after"  }
        )

        if (!updatedUser) {
            return res.status(400).json({
                message: "Not enough credits. Minimum 100 required."
            })
        }

        const interview = await Interview.create({
            userId: user._id,
            role,
            experience,
            mode,
            resumeText: safeResume,
            jobDescription: safeJobDescription,
            questions: questionsArray.map((question, index) => ({
                question,
                difficulty: ["easy", "easy", "medium", "medium", "hard"][index],
                timeLimit: [60, 60, 90, 90, 120][index]
            }))
        })

        return res.status(201).json({
            interviewId: interview._id,
            creditsLeft: updatedUser.credits,
            userName: updatedUser.name,
            questions: interview.questions
        })
    } catch (error) {
        console.log("Generate Question Error:", error)
        return res.status(500).json({
            message: `Failed to create interview: ${error.message}`
        })
    }
}




export const submitAnswer = async (req, res) => {
    try {
        const { interviewId, questionIndex, answer } = req.body

        if (!interviewId || !mongoose.Types.ObjectId.isValid(interviewId)) {
            return res.status(400).json({ message: "Invalid interview ID" })
        }

        const index = Number(questionIndex)

        if (!Number.isInteger(index) || index < 0) {
            return res.status(400).json({ message: "Invalid question index" })
        }

        if (typeof answer !== "string" || !answer.trim()) {
            return res.status(400).json({ message: "No answer submitted" })
        }

        const interview = await Interview.findOne({
            _id: interviewId,
            userId: req.userId
        })

        if (!interview) {
            return res.status(404).json({ message: "Interview not found" })
        }

        if (interview.status === "Completed") {
            return res.status(400).json({
                message: "Interview is already completed"
            })
        }

        const question = interview.questions[index]

        if (!question) {
            return res.status(404).json({ message: "Question not found" })
        }

        if (question.answer?.trim()) {
            return res.status(400).json({
                message: "This question has already been submitted"
            })
        }

        const candidateAnswer = answer.trim().slice(0, 10000)

        const messages = [
            {
                role: "system",
                content: `You are an experienced professional interview evaluator.

Evaluate the candidate's answer fairly and professionally.

Role: ${interview.role}
Experience: ${interview.experience}
Interview Mode: ${interview.mode}
Question: ${question.question}
Candidate Answer: ${candidateAnswer}

Evaluation criteria:
- Evaluate relevance, correctness, clarity, confidence and communication.
- For HR interviews, focus on behavioral relevance, communication and authenticity.
- For Technical interviews, focus on technical accuracy, reasoning and practical understanding.
- Do not penalize simple English or minor grammar mistakes if the meaning is understandable.
- Do not invent details about the candidate.
- Evaluate only what the candidate actually said.
- Scores MUST be between 0 and 10, not 0 and 100.
- Use decimal scores where appropriate.
- Feedback must explain the quality of the actual answer.
- ScoreReason must clearly explain why the answer received that score.
- Improvement must provide specific, actionable advice related to the question.
- Never return empty feedback, scoreReason or improvement.

Return ONLY valid JSON in exactly this format:
{
    "score": 7.5,
    "confidence": 7,
    "communication": 8,
    "correctness": 7,
    "feedback": "Specific feedback about the candidate's answer.",
    "scoreReason": "Clear explanation of the score.",
    "improvement": "Specific advice to improve this answer."
}`
            },
            {
                role: "user",
                content: "Evaluate the following candidate answer."
            }
        ]

        const aiResponse = await askAi(messages)
        const parsed = parseAIJson(aiResponse)

        const getScore = value => {
            let score = Number(value)

            if (!Number.isFinite(score)) return 0

            if (score > 10 && score <= 100) {
                score = score / 10
            }

            return Number(Math.min(10, Math.max(0, score)).toFixed(1))
        }

        const score = getScore(parsed.score)
        const confidence = getScore(parsed.confidence)
        const communication = getScore(parsed.communication)
        const correctness = getScore(parsed.correctness)

        const feedback = typeof parsed.feedback === "string" && parsed.feedback.trim()
            ? parsed.feedback.trim()
            : "Your answer was evaluated, but detailed feedback could not be generated."

        const scoreReason = typeof parsed.scoreReason === "string" && parsed.scoreReason.trim()
            ? parsed.scoreReason.trim()
            : `Your answer received ${score}/10 based on its relevance, clarity, communication and accuracy.`

        const improvement = typeof parsed.improvement === "string" && parsed.improvement.trim()
            ? parsed.improvement.trim()
            : "Address the question directly, organize your response into clear points, and support your explanation with a relevant example."

        question.answer = candidateAnswer
        question.score = score
        question.confidence = confidence
        question.communication = communication
        question.correctness = correctness
        question.feedback = feedback
        question.scoreReason = scoreReason
        question.improvement = improvement

        await interview.save()

        return res.status(200).json({
            message: "Answer submitted successfully",
            feedback,
            score,
            confidence,
            communication,
            correctness,
            scoreReason,
            improvement
        })
    } catch (error) {
        console.log("Submit Answer Error:", error)

        return res.status(500).json({
            message: `Failed to evaluate answer: ${error.message}`
        })
    }
}





export const generateIdealAnswer = async (req, res) => {
    try {
        const { interviewId } = req.body

        if (!interviewId || !mongoose.Types.ObjectId.isValid(interviewId)) {
            return res.status(400).json({ message: "Invalid interview ID" })
        }

        const interview = await Interview.findOne({
            _id: interviewId,
            userId: req.userId
        })

        if (!interview) {
            return res.status(404).json({ message: "Interview not found" })
        }

        const questions = interview.questions.map((question, index) => ({
            questionIndex: index,
            question: question.question
        }))

        if (!questions.length) {
            return res.status(400).json({ message: "No interview questions found" })
        }

        const messages = [
            {
                role: "system",
                content: `You are an expert interview coach.

Generate a strong sample answer for EVERY interview question provided.

Candidate context:
Role: ${interview.role}
Experience: ${interview.experience}
Interview Mode: ${interview.mode}
Resume: ${(interview.resumeText || "Not provided").slice(0, 8000)}
Job Description: ${(interview.jobDescription || "Not provided").slice(0, 8000)}

Instructions:
- Generate one answer for every question.
- Preserve the exact questionIndex for each answer.
- Directly answer each interview question.
- Keep answers natural, clear, realistic and concise, around 70-110 words.
- For technical questions, provide accurate explanations and practical examples.
- For HR questions, use natural conversational language.
- Use first-person statements only when the candidate's actual background supports them.
- Never invent companies, internships, employment history, projects, clients, achievements, technologies or personal experiences.
- Never claim that the candidate has worked on a project or faced a challenge unless it is explicitly supported by the resume or candidate context.
- If a question requires a personal example that is not available in the candidate context, provide a clearly labelled sample structure using placeholders such as [your project] or [your experience].
- Do not present hypothetical examples as the candidate's real experience.
- Answers for unanswered questions should still be generated as learning examples.
- Do not include feedback or explanations outside the answers.

Return ONLY valid JSON in this exact format:
{
    "idealAnswers": [
        {
            "questionIndex": 0,
            "idealAnswer": "Sample answer"
        }
    ]
}`
            },
            {
                role: "user",
                content: JSON.stringify(questions)
            }
        ]

        const aiResponse = await askAi(messages)
        const parsed = parseAIJson(aiResponse)

        if (!Array.isArray(parsed.idealAnswers)) {
            return res.status(500).json({
                message: "AI returned an invalid ideal answers format."
            })
        }

        const idealAnswers = questions.map(question => {
            const generated = parsed.idealAnswers.find(
                item => Number(item.questionIndex) === question.questionIndex
            )

            return {
                questionIndex: question.questionIndex,
                idealAnswer: typeof generated?.idealAnswer === "string"
                    ? generated.idealAnswer.trim()
                    : ""
            }
        })

        return res.status(200).json({ idealAnswers })
    } catch (error) {
        console.log("Generate Ideal Answers Error:", error)

        return res.status(500).json({
            message: `Failed to generate ideal answers: ${error.message}`
        })
    }
}



export const finishInterview = async (req, res) => {
    try {
        const { interviewId } = req.body

        if (!interviewId || !mongoose.Types.ObjectId.isValid(interviewId)) {
            return res.status(400).json({ message: "Invalid interview ID" })
        }

        const interview = await Interview.findOne({
            _id: interviewId,
            userId: req.userId
        })

        if (!interview) {
            return res.status(404).json({
                message: "Failed to find interview"
            })
        }

        if (!interview.questions.length) {
            return res.status(400).json({
                message: "No interview questions found"
            })
        }

        interview.questions.forEach(question => {
            if (isSkippedAnswer(question.answer)) {
                question.answer = ""
                question.score = 0
                question.confidence = 0
                question.communication = 0
                question.correctness = 0

                question.feedback = "You did not submit an answer for this question, so it could not be evaluated."

                question.scoreReason = "This question received 0/10 because no answer was submitted."

                question.improvement = "Attempt every question. Start with a direct response, explain your reasoning, and include a relevant example wherever possible."
            } else {
                question.score = Math.min(10, Math.max(0, Number(question.score) || 0))
                question.confidence = Math.min(10, Math.max(0, Number(question.confidence) || 0))
                question.communication = Math.min(10, Math.max(0, Number(question.communication) || 0))
                question.correctness = Math.min(10, Math.max(0, Number(question.correctness) || 0))

                if (!question.feedback?.trim()) {
                    question.feedback = "Your answer was submitted, but detailed feedback could not be generated."
                }

                if (!question.scoreReason?.trim()) {
                    question.scoreReason = `Your answer received ${question.score}/10 based on its relevance, clarity, communication and accuracy.`
                }

                if (!question.improvement?.trim()) {
                    question.improvement = "Structure your response clearly, address the question directly, and support your points with a relevant example."
                }
            }
        })

        const questionWiseScore = interview.questions.map(getQuestionReport)
        const totalQuestions = questionWiseScore.length

        const getAverage = field => {
            const total = questionWiseScore.reduce(
                (sum, question) => sum + question[field],
                0
            )

            return Number((total / totalQuestions).toFixed(1))
        }

        const finalScore = getAverage("score")
        const confidence = getAverage("confidence")
        const communication = getAverage("communication")
        const correctness = getAverage("correctness")

        interview.finalScore = finalScore
        interview.status = "Completed"

        await interview.save()

        return res.status(200).json({
            message: "Interview completed successfully",
            finalScore,
            confidence,
            communication,
            correctness,
            totalQuestions,
            answeredQuestions: questionWiseScore.filter(q => q.answer).length,
            unansweredQuestions: questionWiseScore.filter(q => !q.answer).length,
            questionWiseScore
        })
    } catch (error) {
        console.log("Finish Interview Error:", error)

        return res.status(500).json({
            message: `Failed to finish interview: ${error.message}`
        })
    }
}


export const getMyInterviews = async (req, res) => {
    try {
        const interviews = await Interview.find({
            userId: req.userId
        })
            .sort({ createdAt: -1 })
            .select("role experience mode finalScore status createdAt")

        return res.status(200).json({ interviews })
    } catch (error) {
        return res.status(500).json({
            message: `Failed to get interviews: ${error.message}`
        })
    }
}

export const getInterviewReport = async (req, res) => {
    try {
        const { interviewId } = req.params

        if (!interviewId || !mongoose.Types.ObjectId.isValid(interviewId)) {
            return res.status(400).json({ message: "Invalid interview ID" })
        }

        const interview = await Interview.findOne({
            _id: interviewId,
            userId: req.userId
        })

        if (!interview) {
            return res.status(404).json({
                message: "Interview not found"
            })
        }

        const questionWiseScore = interview.questions.map(getQuestionReport)
        const totalQuestions = questionWiseScore.length

        const getAverage = field => {
            if (!totalQuestions) return 0

            const total = questionWiseScore.reduce(
                (sum, question) => sum + question[field],
                0
            )

            return Number((total / totalQuestions).toFixed(1))
        }

        return res.status(200).json({
            interviewId: interview._id,
            role: interview.role,
            experience: interview.experience,
            mode: interview.mode,
            createdAt: interview.createdAt,
            finalScore: getAverage("score"),
            confidence: getAverage("confidence"),
            communication: getAverage("communication"),
            correctness: getAverage("correctness"),
            totalQuestions,
            answeredQuestions: questionWiseScore.filter(q => q.answer).length,
            unansweredQuestions: questionWiseScore.filter(q => !q.answer).length,
            questionWiseScore
        })
    } catch (error) {
        console.log("Get Report Error:", error)

        return res.status(500).json({
            message: `Failed to get interview report: ${error.message}`
        })
    }
}

export const deleteInterview = async (req, res) => {
    try {
        const { interviewId } = req.params

        if (!interviewId || !mongoose.Types.ObjectId.isValid(interviewId)) {
            return res.status(400).json({ message: "Invalid interview ID" })
        }

        const interview = await Interview.findOneAndDelete({
            _id: interviewId,
            userId: req.userId
        })

        if (!interview) {
            return res.status(404).json({ message: "Interview not found" })
        }

        return res.status(200).json({
            message: "Interview deleted successfully"
        })
    } catch (error) {
        return res.status(500).json({
            message: `Failed to delete interview: ${error.message}`
        })
    }
}
