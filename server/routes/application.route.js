import express from "express"
import isAuth from "../middlewares/isAuth.js"
import {
    createApplication,
    getApplications,
    updateApplication,
    deleteApplication
} from "../controllers/application.controller.js"

const applicationRouter = express.Router()

applicationRouter.post("/add", isAuth, createApplication)
applicationRouter.get("/get", isAuth, getApplications)
applicationRouter.put("/update/:applicationId", isAuth, updateApplication)
applicationRouter.delete("/delete/:applicationId", isAuth, deleteApplication)

export default applicationRouter
