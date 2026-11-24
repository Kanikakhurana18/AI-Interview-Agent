
import express from "express"
import isAuth from "../middlewares/isAuth.js"
import { upload } from "../middlewares/multer.js"

import {
    analyseResume,
    finishInterview,
    generateQuestion,
    submitAnswer,
    getMyInterviews,
    getInterviewReport,
    deleteInterview,
    generateIdealAnswer
} from "../controllers/interview.controller.js"

import { analyseATS } from "../controllers/ats.controller.js"

const interviewRouter = express.Router()

interviewRouter.post("/resume", isAuth, upload.single("resume"), analyseResume)

interviewRouter.post("/ats-analysis", isAuth, upload.single("resume"), analyseATS)

interviewRouter.post("/generate-questions", isAuth, generateQuestion)
interviewRouter.post("/submit-answers", isAuth, submitAnswer)
interviewRouter.post("/finish", isAuth, finishInterview)

interviewRouter.get("/get-interview", isAuth, getMyInterviews)
interviewRouter.get("/report/:interviewId", isAuth, getInterviewReport)

interviewRouter.delete("/delete/:interviewId", isAuth, deleteInterview)
interviewRouter.post("/generate-ideal-answer", isAuth, generateIdealAnswer)

export default interviewRouter
