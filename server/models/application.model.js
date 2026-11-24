import mongoose from "mongoose"

const applicationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    companyName: {
        type: String,
        required: true,
        trim: true
    },
    jobRole: {
        type: String,
        required: true,
        trim: true
    },
    appliedDate: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ["Applied", "Assessment", "Interview", "Selected", "Rejected"],
        default: "Applied"
    },
    interviewDate: {
        type: Date,
        default: null
    },
    followUpDate: {
        type: Date,
        default: null
    },
    notes: {
        type: String,
        default: "",
        trim: true
    },
    gotReferral: {
        type: Boolean,
        default: false
    }

}, { timestamps: true })

const Application = mongoose.model("Application", applicationSchema)

export default Application
