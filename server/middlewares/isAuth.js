import jwt from "jsonwebtoken"

const isAuth = (req, res, next) => {
    try {
        if (!process.env.JWTSECRET) {
            return res.status(500).json({
                message: "JWT secret is not configured"
            })
        }

        const token = req.cookies?.token

        if (!token) {
            return res.status(401).json({
                message: "Authentication required"
            })
        }

        const decoded = jwt.verify(token, process.env.JWTSECRET)

        if (!decoded?.userId) {
            return res.status(401).json({
                message: "Invalid authentication token"
            })
        }

        req.userId = decoded.userId
        next()
    } catch (error) {
        if (
            error.name === "TokenExpiredError" ||
            error.name === "JsonWebTokenError"
        ) {
            return res.status(401).json({
                message: "Session expired. Please login again."
            })
        }

        return res.status(500).json({
            message: "Authentication error"
        })
    }
}

export default isAuth
