import multer from "multer"
import path from "path"

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "public")
    },
    filename: function (req, file, cb) {
        const filename = Date.now() + "-" + file.originalname
        cb(null, filename)
    }
})

const fileFilter = (req, file, cb) => {
    const allowedExtensions = [".pdf", ".docx"]
    const extension = path.extname(file.originalname).toLowerCase()

    const allowedMimeTypes = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ]

    if (
        allowedExtensions.includes(extension) &&
        allowedMimeTypes.includes(file.mimetype)
    ) {
        cb(null, true)
    } else {
        cb(new Error("Only PDF and DOCX resume files are allowed"))
    }
}

export const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024
    },
    fileFilter
})
