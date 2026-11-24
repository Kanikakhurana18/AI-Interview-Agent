import Application from "../models/application.model.js"
import mongoose from "mongoose"

export const createApplication = async (req, res) => {
    try {
        const {
            companyName,
            jobRole,
            appliedDate,
            status,
            interviewDate,
            followUpDate,
            notes,
            gotReferral
        } = req.body

        if (!companyName?.trim() || !jobRole?.trim()) {
            return res.status(400).json({
                message: "Company name and job role are required"
            })
        }

        const application = await Application.create({
            userId: req.userId,
            companyName,
            jobRole,
            appliedDate: appliedDate || Date.now(),
            status: status || "Applied",
            interviewDate: interviewDate || null,
            followUpDate: followUpDate || null,
            notes: notes || "",
            gotReferral: gotReferral ?? false
        })

        return res.status(201).json({
            message: "Application added successfully",
            application
        })
    } catch (error) {
        return res.status(500).json({
            message: error.message
        })
    }
}

export const getApplications = async (req, res) => {
    try {
        const applications = await Application.find({
            userId: req.userId
        }).sort({ createdAt: -1 })

        return res.status(200).json({
            applications
        })
    } catch (error) {
        return res.status(500).json({
            message: error.message
        })
    }
}

export const updateApplication = async (req, res) => {
    try {
        const { applicationId } = req.params

        if (!mongoose.Types.ObjectId.isValid(applicationId)) {
            return res.status(400).json({
                message: "Invalid application ID"
            })
        }

        const allowedFields = [
            "companyName",
            "jobRole",
            "appliedDate",
            "status",
            "interviewDate",
            "followUpDate",
            "notes",
            "gotReferral"
        ]

        const updateData = {}

        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                updateData[field] = req.body[field] === "" &&
                    ["interviewDate", "followUpDate"].includes(field)
                    ? null
                    : req.body[field]
            }
        })

        const application = await Application.findOneAndUpdate(
            {
                _id: applicationId,
                userId: req.userId
            },
            updateData,
            {
                new: true,
                runValidators: true
            }
        )

        if (!application) {
            return res.status(404).json({
                message: "Application not found"
            })
        }

        return res.status(200).json({
            message: "Application updated successfully",
            application
        })
    } catch (error) {
        return res.status(500).json({
            message: error.message
        })
    }
}

export const deleteApplication = async (req, res) => {
    try {
        const { applicationId } = req.params

        if (!mongoose.Types.ObjectId.isValid(applicationId)) {
            return res.status(400).json({
                message: "Invalid application ID"
            })
        }

        const application = await Application.findOneAndDelete({
            _id: applicationId,
            userId: req.userId
        })

        if (!application) {
            return res.status(404).json({
                message: "Application not found"
            })
        }

        return res.status(200).json({
            message: "Application deleted successfully"
        })
    } catch (error) {
        return res.status(500).json({
            message: error.message
        })
    }
}
