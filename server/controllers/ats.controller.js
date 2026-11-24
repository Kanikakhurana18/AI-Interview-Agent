import fs from "fs"
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs"
import mammoth from "mammoth"
import { askAi } from "../services/openRouter.services.js"

const clamp = value => Math.max(0, Math.min(100, Math.round(Number(value) || 0)))

const normalize = value => String(value || "")
    .toLowerCase()
    .replace(/c\+\+/g, " cpp ")
    .replace(/c#/g, " csharp ")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9+#.]/g, " ")
    .replace(/\s+/g, " ")
    .trim()

const contains = (text, terms) => {
    const source = ` ${normalize(text)} `

    return terms.some(term => {
        const keyword = normalize(term)
        return keyword && source.includes(` ${keyword} `)
    })
}

const unique = values => [...new Set(values)]

const cleanExtractedText = text => String(text || "")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .split("\n")
    .map(line => line.trim())
    .filter(Boolean)
    .join("\n")
    .trim()

const extractPdfPageText = async page => {
    const content = await page.getTextContent()

    const items = content.items
        .filter(item => item.str && item.str.trim())
        .map(item => ({
            text: item.str.trim(),
            x: item.transform?.[4] || 0,
            y: item.transform?.[5] || 0
        }))
        .sort((a, b) => {
            if (Math.abs(b.y - a.y) > 2.5) return b.y - a.y
            return a.x - b.x
        })

    const lines = []

    for (const item of items) {
        let line = lines.find(entry => Math.abs(entry.y - item.y) <= 2.5)

        if (!line) {
            line = { y: item.y, items: [] }
            lines.push(line)
        }

        line.items.push(item)
    }

    return lines
        .sort((a, b) => b.y - a.y)
        .map(line => line.items
            .sort((a, b) => a.x - b.x)
            .map(item => item.text)
            .join(" ")
        )
        .join("\n")
}

const extractResumeText = async file => {
    const extension = (file.originalname || "").split(".").pop().toLowerCase()

    if (extension === "pdf") {
        const data = new Uint8Array(fs.readFileSync(file.path))
        const pdf = await pdfjsLib.getDocument({ data }).promise
        const pages = []

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i)
            pages.push(await extractPdfPageText(page))
        }

        return {
            text: cleanExtractedText(pages.join("\n")),
            pages: pdf.numPages
        }
    }

    if (extension === "docx") {
        const result = await mammoth.extractRawText({ path: file.path })

        return {
            text: cleanExtractedText(result.value),
            pages: null
        }
    }

    throw new Error("Only PDF and DOCX resumes are supported.")
}

const parseAIJson = response => {
    let content = response

    if (typeof response === "object" && response !== null) {
        content =
            response.content ||
            response.message?.content ||
            response.choices?.[0]?.message?.content ||
            response.output_text
    }

    if (typeof content !== "string" || !content.trim()) {
        throw new Error("Empty AI response")
    }

    const cleaned = content
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim()

    const start = cleaned.indexOf("{")
    const end = cleaned.lastIndexOf("}")

    if (start === -1 || end === -1) {
        throw new Error("Invalid AI JSON response")
    }

    return JSON.parse(cleaned.slice(start, end + 1))
}

const sectionHeadings = {
    "Professional Summary": [
        "professional summary",
        "career summary",
        "summary",
        "objective",
        "profile"
    ],
    Skills: [
        "technical skills",
        "key skills",
        "skills",
        "technologies",
        "technical expertise"
    ],
    "Work Experience": [
        "work experience",
        "professional experience",
        "experience",
        "internships",
        "internship experience",
        "employment history"
    ],
    Projects: [
        "personal projects",
        "academic projects",
        "projects",
        "project experience",
        "key projects"
    ],
    Education: [
        "education",
        "academic background",
        "academic qualifications"
    ],
    Certifications: [
        "certifications",
        "certificates",
        "courses"
    ],
    Achievements: [
        "achievements",
        "awards",
        "accomplishments"
    ]
}

const getHeading = line => {
    const cleaned = line
        .replace(/^[•▪●◦\-–—\s]+/, "")
        .replace(/\*\*/g, "")
        .trim()

    const heading = cleaned
        .replace(/[:|]+$/, "")
        .trim()
        .toLowerCase()

    const matched = Object.entries(sectionHeadings).find(([, names]) =>
        names.includes(heading)
    )

    if (matched) {
        return {
            section: matched[0],
            remainder: ""
        }
    }

    const colonIndex = cleaned.indexOf(":")

    if (colonIndex > 0) {
        const possibleHeading = cleaned
            .slice(0, colonIndex)
            .trim()
            .toLowerCase()

        const inlineMatch = Object.entries(sectionHeadings).find(([, names]) =>
            names.includes(possibleHeading)
        )

        if (inlineMatch) {
            return {
                section: inlineMatch[0],
                remainder: cleaned.slice(colonIndex + 1).trim()
            }
        }
    }

    return null
}

const getResumeSections = text => {
    const result = Object.fromEntries(
        Object.keys(sectionHeadings).map(key => [key, ""])
    )

    result.Other = ""

    const lines = String(text || "")
        .replace(/\r/g, "\n")
        .split("\n")
        .map(line => line.trim())
        .filter(Boolean)

    let current = "Other"

    for (const line of lines) {
        const heading = getHeading(line)

        if (heading) {
            current = heading.section

            if (heading.remainder) {
                result[current] += `${heading.remainder}\n`
            }

            continue
        }

        result[current] += `${line}\n`
    }

    return Object.fromEntries(
        Object.entries(result).map(([key, value]) => [
            key,
            value.trim()
        ])
    )
}

const detectSections = text => {
    const sections = getResumeSections(text)

    const names = [
        "Contact Information",
        "Professional Summary",
        "Skills",
        "Work Experience",
        "Projects",
        "Education",
        "Certifications"
    ]

    return names.map(name => {
        let found

        if (name === "Contact Information") {
            found =
                /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(text) ||
                /(?:\+?\d[\d\s().-]{7,}\d)/.test(text)
        } else {
            found = Boolean(sections[name]?.trim())
        }

        return {
            name,
            found,
            details: found
                ? `${name} information detected.`
                : `${name} section not clearly detected.`
        }
    })
}

const cleanJDLine = line => String(line || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&#xA0;|&nbsp;/gi, " ")
    .replace(/&amp;/gi, "and")
    .replace(/\*\*/g, "")
    .replace(/^[•▪●◦\-–—\s]+/, "")
    .trim()

const classifyJDHeading = line => {
    const value = cleanJDLine(line)

    const preferred = /^(nice to have|preferred qualifications|preferred skills|preferred requirements|bonus points|good to have|desirable qualifications|preferred|bonus)\s*:?\s*(.*)$/i

    const required = /^(minimum requirements|requirements|what we are looking for|what you'll need|qualifications|basic qualifications|required qualifications|required skills|must have)\s*:?\s*(.*)$/i

    const responsibilities = /^(what you will do|what you'll do|responsibilities|key responsibilities|your responsibilities|what you'll make an impact|your impact|the role|about the role|job responsibilities)\s*:?\s*(.*)$/i

    const other = /^(about us|about this position|about this role|what you'll gain|benefits|equal opportunity employer|create a job alert|apply for this job)\s*:?\s*(.*)$/i

    let match = value.match(preferred)

    if (match) {
        return { type: "preferred", remainder: match[2] || "" }
    }

    match = value.match(required)

    if (match) {
        return { type: "required", remainder: match[2] || "" }
    }

    match = value.match(responsibilities)

    if (match) {
        return { type: "responsibilities", remainder: match[2] || "" }
    }

    match = value.match(other)

    if (match) {
        return { type: "other", remainder: match[2] || "" }
    }

    return null
}

const extractJDSections = description => {
    const result = {
        required: [],
        preferred: [],
        responsibilities: [],
        all: []
    }

    let active = "other"

    const lines = String(description || "")
        .replace(/\r/g, "\n")
        .split("\n")
        .map(cleanJDLine)
        .filter(Boolean)

    for (const line of lines) {
        const heading = classifyJDHeading(line)

        if (heading) {
            active = heading.type

            if (heading.remainder) {
                result[active]?.push(heading.remainder)
            }

            continue
        }

        result.all.push(line)

        if (active === "required") {
            result.required.push(line)
        } else if (active === "preferred") {
            result.preferred.push(line)
        } else if (active === "responsibilities") {
            result.responsibilities.push(line)
        }
    }

    return {
        required: result.required.join(" "),
        preferred: result.preferred.join(" "),
        responsibilities: result.responsibilities.join(" "),
        all: result.all.join(" ")
    }
}

const isProductAnalyticsRole = jd => {
    const text = normalize(jd)

    return (
        text.includes("product management") ||
        text.includes("product analytics") ||
        text.includes("user behaviour") ||
        text.includes("user behavior")
    )
}

const canonicalGroups = {
    "Analytical and Problem Solving": [
        "analytical skills",
        "analytical and problem solving skills",
        "analytical thinking",
        "problem solving",
        "problem solving skills",
        "analytical ability"
    ],
    "Product Curiosity": [
        "product curiosity",
        "curiosity about products",
        "how products work",
        "how people use them",
        "product thinking"
    ],
    "Data Analysis Tools": [
        "excel",
        "microsoft excel",
        "google sheets",
        "spreadsheets",
        "data analysis tools",
        "data analysis",
        "data visualization",
        "data visualisation"
    ],
    "SQL and Python": [
        "sql",
        "python",
        "sql and python",
        "python and sql"
    ],
    "AI and Generative AI": [
        "artificial intelligence",
        "generative ai",
        "ai",
        "ai powered products",
        "large language models",
        "llm"
    ],
    Communication: [
        "communication",
        "communication skills",
        "explain findings clearly",
        "clear communication",
        "written communication",
        "verbal communication"
    ],
    "Ownership and Attention to Detail": [
        "ownership",
        "take ownership",
        "detail oriented",
        "detail oriented approach",
        "organised",
        "organized",
        "self driven",
        "self driven approach"
    ],
    "Product Analytics and User Behaviour": [
        "product analytics",
        "user behaviour",
        "user behavior",
        "usage patterns",
        "user interactions",
        "adoption trends",
        "product performance"
    ],
    "Product Metrics and Evaluation": [
        "product metrics",
        "user engagement",
        "response quality",
        "task completion",
        "product effectiveness",
        "measure product effectiveness"
    ],
    "Product Discovery and Prioritisation": [
        "product discovery",
        "requirements gathering",
        "feature analysis",
        "competitive research",
        "product prioritisation",
        "product prioritization",
        "prioritisation",
        "prioritization"
    ],
    "Web Frameworks": [
        "web frameworks",
        "web framework",
        "web technologies",
        "web development frameworks"
    ],
    "Cloud Platforms": [
        "cloud platforms",
        "cloud platform",
        "cloud computing",
        "aws",
        "gcp",
        "azure"
    ],
    "Agile Development Practices": [
        "agile",
        "agile development practices",
        "agile methodologies",
        "scrum"
    ],
    "Programming Language Proficiency": [
        "programming language",
        "programming languages",
        "proficiency in at least one language",
        "proficiency in at least one programming language"
    ],
    "Data Structures and Algorithms": [
        "data structures",
        "algorithms",
        "data structures and algorithms",
        "dsa"
    ],
    "Software Development Principles": [
        "software development principles",
        "software development",
        "software engineering principles"
    ],
    "Bachelor's Degree in Computer Science or Related Field": [
        "bachelor degree",
        "bachelors degree",
        "bachelor of technology",
        "computer science degree",
        "computer science engineering",
        "related degree"
    ],
    "Prior Internship": [
        "prior internship",
        "internship experience",
        "previous internship"
    ],
    "Personal Projects": [
        "personal projects",
        "projects on github",
        "github projects",
        "personal project"
    ],
    Teamwork: [
        "teamwork",
        "teamwork skills",
        "team collaboration",
        "collaboration"
    ]
}

const canonical = value => {
    const key = normalize(value)

    for (const [name, variants] of Object.entries(canonicalGroups)) {
        if (
            normalize(name) === key ||
            variants.some(item => normalize(item) === key)
        ) {
            return name
        }
    }

    return String(value || "").trim()
}

const addUnique = (output, keyword) => {
    if (!keyword) return

    const value = canonical(keyword)

    if (!output.some(item => normalize(item) === normalize(value))) {
        output.push(value)
    }
}

const extractProductRequirements = (requiredText, responsibilityText) => {
    const required = normalize(requiredText)
    const responsibilities = normalize(responsibilityText)

    const requiredRules = [
        [
            "Analytical and Problem Solving",
            ["analytical", "problem solving", "problem-solving"]
        ],
        [
            "Product Curiosity",
            ["curiosity", "how products work", "how people use them"]
        ],
        [
            "Data Analysis Tools",
            ["excel", "google sheets", "spreadsheets", "data analysis", "data visualisation", "data visualization"]
        ],
        [
            "SQL and Python",
            ["sql", "python"]
        ],
        [
            "AI and Generative AI",
            ["artificial intelligence", "generative ai", "interest in ai", "ai powered products"]
        ],
        [
            "Communication",
            ["communication", "explain findings clearly"]
        ],
        [
            "Ownership and Attention to Detail",
            ["ownership", "detail oriented", "organised", "organized", "self driven"]
        ]
    ]

    const output = []

    for (const [name, terms] of requiredRules) {
        if (terms.some(term => required.includes(normalize(term)))) {
            addUnique(output, name)
        }
    }

    const roleRules = [
        [
            "Product Analytics and User Behaviour",
            ["product analytics", "user behaviour", "user behavior", "usage patterns", "user interactions", "adoption trends"]
        ],
        [
            "Product Metrics and Evaluation",
            ["product metrics", "user engagement", "response quality", "task completion", "product effectiveness"]
        ],
        [
            "Product Discovery and Prioritisation",
            ["product discovery", "requirements gathering", "feature analysis", "competitive research", "prioritisation", "prioritization"]
        ]
    ]

    for (const [name, terms] of roleRules) {
        if (terms.some(term => responsibilities.includes(normalize(term)))) {
            addUnique(output, name)
        }
    }

    return output
}

const extractGenericRequirements = (text, aiItems = [], type = "required") => {
    const source = normalize(text)
    const output = []

    const rules = type === "preferred"
        ? [
            ["Web Frameworks", ["web frameworks", "web framework", "web technologies"]],
            ["Cloud Platforms", ["cloud platforms", "cloud platform", "cloud computing", "aws", "gcp", "azure"]],
            ["AI and Generative AI", ["ai/ml", "generative ai", "artificial intelligence tools", "machine learning tools"]],
            ["Agile Development Practices", ["agile", "scrum"]],
            ["Prior Internship", ["prior internship", "internship experience"]],
            ["Personal Projects", ["personal projects", "projects on github", "github projects"]]
        ]
        : [
            ["Programming Language Proficiency", ["programming language", "proficiency in at least one language"]],
            ["Data Structures and Algorithms", ["data structures", "algorithms", "dsa"]],
            ["Software Development Principles", ["software development", "software engineering principles"]],
            ["Bachelor's Degree in Computer Science or Related Field", ["bachelor", "b.tech", "btech", "computer science", "related degree"]],
            ["Analytical and Problem Solving", ["analytical", "problem solving"]],
            ["Communication", ["communication skills", "communication"]],
            ["Teamwork", ["teamwork", "collaboration"]]
        ]

    for (const [name, terms] of rules) {
        if (terms.some(term => source.includes(normalize(term)))) {
            addUnique(output, name)
        }
    }

    for (const item of aiItems) {
        const keyword = typeof item === "string"
            ? item
            : item?.keyword || item?.name

        if (!keyword) continue

        const normalizedKeyword = canonical(keyword)

        const known = Object.keys(canonicalGroups).find(
            name => normalize(name) === normalize(normalizedKeyword)
        )

        if (known && source.includes(normalize(keyword))) {
            addUnique(output, known)
        }
    }

    return output
}

const matchRequirement = (keyword, resume, sections) => {
    const all = `${resume} ${sections.Skills || ""}`
    const work = sections["Work Experience"] || ""
    const projects = sections.Projects || ""
    const summary = sections["Professional Summary"] || ""

    const result = (matched, evidence = "") => ({
        keyword,
        matched,
        evidence,
        matchType: matched ? "evidence" : "missing"
    })

    switch (keyword) {
        case "Analytical and Problem Solving":
        case "Problem Solving":
            return result(
                contains(all, [
                    "analytical",
                    "problem solving",
                    "problem-solving",
                    "leetcode",
                    "debugging",
                    "troubleshooting",
                    "150+",
                    "data structures and algorithms"
                ]),
                "Analytical skills, problem-solving evidence or coding practice"
            )

        case "Product Curiosity":
            return result(
                contains(summary, [
                    "interest in product",
                    "product analytics",
                    "user experience",
                    "how products work",
                    "product development"
                ]) ||
                contains(all, [
                    "product management",
                    "product analytics",
                    "user experience"
                ]),
                "Product interest or user experience mentioned in the resume"
            )

        case "Data Analysis Tools": {
            const found = [
                "excel",
                "microsoft excel",
                "google sheets",
                "data analysis",
                "data visualization",
                "data visualisation",
                "spreadsheets"
            ].filter(term => contains(all, [term]))

            return result(found.length > 0, found.join(", "))
        }

        case "SQL and Python": {
            const found = ["sql", "python"].filter(
                term => contains(all, [term])
            )

            return result(found.length > 0, found.join(", "))
        }

        case "AI and Generative AI":
        case "AI/ML Tools": {
            const found = [
                "generative ai",
                "artificial intelligence",
                "machine learning",
                "langchain",
                "rag",
                "llm",
                "openrouter",
                "semantic search",
                "prompt engineering",
                "ai powered"
            ].filter(term => contains(all, [term]))

            return result(found.length > 0, found.join(", "))
        }

        case "Communication":
            return result(
                contains(all, [
                    "communication skills",
                    "communication",
                    "presentation",
                    "presented",
                    "public speaking",
                    "extempore",
                    "explaining findings"
                ]),
                "Communication, presentation or public-speaking evidence"
            )

        case "Ownership and Attention to Detail":
            return result(
                contains(all, [
                    "ownership",
                    "self driven",
                    "self-driven",
                    "detail oriented",
                    "detail-oriented",
                    "attention to detail",
                    "independently",
                    "independent"
                ]),
                "Ownership, self-driven work or attention-to-detail evidence"
            )

        case "Product Analytics and User Behaviour":
            return result(
                contains(`${projects} ${work}`, [
                    "user behaviour",
                    "user behavior",
                    "user interactions",
                    "usage patterns",
                    "adoption trends",
                    "user analytics",
                    "product analytics",
                    "user activity",
                    "user engagement"
                ]),
                "Explicit product usage or user behaviour analysis"
            )

        case "Product Metrics and Evaluation":
            return result(
                contains(`${projects} ${work}`, [
                    "product metrics",
                    "user engagement",
                    "task completion",
                    "response quality",
                    "success rate",
                    "performance metrics",
                    "evaluated responses",
                    "measured performance",
                    "feedback"
                ]),
                "Product metrics, evaluation or feedback evidence"
            )

        case "Product Discovery and Prioritisation":
            return result(
                contains(`${projects} ${work}`, [
                    "product discovery",
                    "requirements gathering",
                    "feature prioritization",
                    "feature prioritisation",
                    "prioritized features",
                    "prioritised features",
                    "competitive research",
                    "product roadmap",
                    "feature analysis"
                ]),
                "Product discovery, requirements or prioritisation evidence"
            )

        case "Programming Language Proficiency": {
            const found = [
                "python",
                "javascript",
                "java",
                "cpp",
                "typescript",
                "c"
            ].filter(term => contains(all, [term]))

            return result(found.length > 0, found.join(", "))
        }

        case "Data Structures and Algorithms":
            return result(
                contains(all, [
                    "data structures",
                    "algorithms",
                    "dsa",
                    "leetcode",
                    "coding problems"
                ]),
                "Data structures, algorithms or coding practice"
            )

        case "Software Development Principles":
            return result(
                contains(all, [
                    "software development",
                    "software engineering",
                    "object oriented programming",
                    "oop",
                    "application development",
                    "full stack",
                    "modular architecture"
                ]),
                "Software development or engineering evidence"
            )

        case "Bachelor's Degree in Computer Science or Related Field": {
            const degree = contains(all, [
                "bachelor",
                "b tech",
                "btech",
                "b e",
                "undergraduate",
                "b.sc",
                "bca"
            ])

            const field = contains(all, [
                "computer science",
                "computer engineering",
                "information technology",
                "software engineering"
            ])

            return result(degree && field, "Relevant degree and field detected")
        }

        case "Web Frameworks": {
            const found = [
                "react",
                "node.js",
                "express",
                "angular",
                "vue",
                "spring boot",
                "django",
                "flask"
            ].filter(term => contains(all, [term]))

            return result(found.length > 0, found.join(", "))
        }

        case "Cloud Platforms": {
            const found = [
                "aws",
                "amazon web services",
                "gcp",
                "google cloud platform",
                "azure",
                "microsoft azure"
            ].filter(term => contains(all, [term]))

            return result(found.length > 0, found.join(", "))
        }

        case "Prior Internship":
            return result(
                contains(work || all, ["intern", "internship", "interned"]),
                "Internship experience"
            )

        case "Personal Projects":
            return result(
                Boolean(projects.trim()) ||
                contains(all, ["personal projects", "academic projects"]),
                "Projects section or project entries detected"
            )

        case "Agile Development Practices":
            return result(
                contains(all, ["agile", "scrum", "sprint", "kanban"]),
                "Agile or Scrum evidence"
            )

        case "Teamwork":
            return result(
                contains(all, [
                    "teamwork",
                    "collaborated",
                    "collaboration",
                    "team member",
                    "cross functional"
                ]),
                "Teamwork or collaboration evidence"
            )

        default: {
            const matched = contains(all, [keyword])
            return result(matched, matched ? keyword : "")
        }
    }
}

const calculateMatch = items => {
    if (!items.length) return null

    return clamp(
        items.filter(item => item.matched).length / items.length * 100
    )
}

const calculateExperience = (sections, productRole, testingRole) => {
    const text = normalize(sections["Work Experience"] || "")

    if (!text) return 20

    const internship = contains(text, [
        "intern",
        "internship",
        "interned"
    ])

    const development = contains(text, [
        "developed",
        "built",
        "implemented",
        "designed",
        "integrated",
        "application",
        "software",
        "api",
        "react",
        "node.js",
        "backend",
        "frontend"
    ])

    const productEvidence = contains(text, [
        "user analytics",
        "product analytics",
        "user behaviour",
        "user behavior",
        "product metrics",
        "user engagement",
        "data analysis",
        "data visualization",
        "data visualisation",
        "usage patterns",
        "product insights",
        "adoption trends",
        "user interactions",
        "task completion",
        "response quality"
    ])

    const testingEvidence = contains(text, [
        "api testing",
        "postman",
        "thunder client",
        "functional testing",
        "test cases",
        "validation"
    ])

    if (productRole) {
        if (internship && productEvidence) return 90
        if (productEvidence && development) return 85
        if (productEvidence) return 75
        if (internship && development) return 65
        if (internship) return 55
        if (development) return 45
        return 30
    }

    if (testingRole) {
        if (internship && development && testingEvidence) return 90
        if (internship && development) return 75
        if (development && testingEvidence) return 70
        if (internship) return 55
        return 35
    }

    if (internship && development) return 85
    if (development) return 70
    if (internship) return 55

    return 30
}

const calculateProjects = (projectText, productRole, testingRole) => {
    const text = normalize(projectText)

    if (!text) return 20

    const implementation = contains(text, [
        "developed",
        "built",
        "implemented",
        "created",
        "designed",
        "integrated",
        "engineered"
    ])

    const technologies = [
        "react",
        "node.js",
        "express",
        "mongodb",
        "rest api",
        "rest apis",
        "javascript",
        "typescript",
        "python",
        "java",
        "sql",
        "firebase",
        "redux",
        "langchain",
        "rag",
        "openrouter"
    ].filter(term => contains(text, [term])).length

    if (productRole) {
        const aiProduct = contains(text, [
            "ai powered",
            "ai-powered",
            "llm",
            "rag",
            "conversational ai",
            "chatbot",
            "ai generated",
            "ai-generated"
        ])

        const userFeatures = contains(text, [
            "user interactions",
            "user experience",
            "user workflows",
            "customer interactions",
            "feedback",
            "progress tracking",
            "interview history",
            "payment tracking",
            "automated reminders",
            "customer management"
        ])

        const productAnalytics = contains(text, [
            "product analytics",
            "user analytics",
            "usage patterns",
            "user behaviour",
            "user behavior",
            "user engagement",
            "adoption trends",
            "user activity",
            "interaction analysis"
        ])

        const metricsAndEvaluation = contains(text, [
            "engagement metrics",
            "task completion",
            "response quality",
            "success rate",
            "performance metrics",
            "evaluated responses",
            "measured performance",
            "completion rate",
            "user feedback analysis"
        ])

        const dataAnalysis = contains(text, [
            "data analysis",
            "data analytics",
            "data visualization",
            "data visualisation",
            "analytical insights",
            "insight generation"
        ])

        const productDiscovery = contains(text, [
            "requirements gathering",
            "feature prioritization",
            "feature prioritisation",
            "product discovery",
            "competitive research",
            "product roadmap",
            "feature analysis"
        ])

        let score = 25

        if (implementation) score += 10
        if (technologies >= 3) score += 5
        if (aiProduct) score += 15
        if (userFeatures) score += 10
        if (dataAnalysis) score += 10
        if (productAnalytics) score += 15
        if (metricsAndEvaluation) score += 10
        if (productDiscovery) score += 10

        return clamp(score)
    }

    if (testingRole) {
        const testing = contains(text, [
            "postman",
            "thunder client",
            "api testing",
            "tested api",
            "endpoint validation",
            "functional testing"
        ])

        if (implementation && testing) return 85
        if (implementation && technologies >= 3) return 70

        return 55
    }

    if (implementation && technologies >= 5) return 90
    if (implementation && technologies >= 3) return 85
    if (technologies >= 3) return 75

    return 60
}

const calculateEducation = (resume, education) => {
    const text = normalize(`${resume} ${education}`)

    const degree = contains(text, [
        "bachelor",
        "b tech",
        "btech",
        "b e",
        "undergraduate",
        "bca",
        "b.sc"
    ])

    const field = contains(text, [
        "computer science",
        "computer engineering",
        "information technology"
    ])

    if (degree && field) return 100
    if (degree || field) return 75

    return 40
}

const calculateReadability = (resume, sections) => {
    const count = sections.filter(item => item.found).length
    const sectionScore = count / sections.length * 70
    const lengthScore = resume.length >= 500 ? 20 : resume.length / 25
    const contactScore = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(resume)
        ? 10
        : 0

    return clamp(sectionScore + lengthScore + contactScore)
}

const getSoftSkills = resume => [
    {
        keyword: "Problem Solving",
        matched: contains(resume, [
            "problem solving",
            "problem-solving",
            "leetcode",
            "debugging",
            "troubleshooting",
            "150+"
        ])
    },
    {
        keyword: "Teamwork",
        matched: contains(resume, [
            "teamwork",
            "collaborated",
            "collaboration",
            "team member",
            "cross functional"
        ])
    },
    {
        keyword: "Communication",
        matched: contains(resume, [
            "communication skills",
            "presentation",
            "presented",
            "public speaking",
            "extempore"
        ])
    }
]

const getStrengths = (resume, required, preferred) => {
    const strengths = []

    const technologies = [
        "React",
        "Node.js",
        "Express",
        "REST APIs"
    ].filter(term => contains(resume, [term]))

    if (technologies.length >= 2) {
        strengths.push(
            `Hands-on development experience with ${technologies.join(", ")}.`
        )
    }

    const dataTools = [
        "Python",
        "SQL",
        "Excel",
        "Google Sheets",
        "Data Analysis",
        "Data Visualization"
    ].filter(term => contains(resume, [term]))

    if (dataTools.length) {
        strengths.push(
            `Relevant data and analytical skills include ${dataTools.join(", ")}.`
        )
    }

    const aiTools = [
        "LangChain",
        "RAG",
        "LLM",
        "OpenRouter",
        "Generative AI",
        "Semantic Search",
        "Prompt Engineering"
    ].filter(term => contains(resume, [term]))

    if (aiTools.length) {
        strengths.push(
            `Practical exposure to AI technologies including ${aiTools.join(", ")}.`
        )
    }

    if (contains(resume, ["product analytics", "user experience", "product development"])) {
        strengths.push(
            "Your resume demonstrates an interest in product development and user experience."
        )
    }

    if (contains(resume, ["intern", "internship"])) {
        strengths.push(
            "Prior internship experience provides exposure to professional work environments."
        )
    }

    if (contains(resume, ["github", "gssoc", "open source"])) {
        strengths.push(
            "GitHub or open-source participation adds evidence of technical initiative."
        )
    }

    const matched = [...required, ...preferred]
        .filter(item => item.matched)
        .map(item => item.keyword)

    if (matched.length) {
        strengths.push(
            `Relevant matched requirements include ${matched.slice(0, 4).join(", ")}.`
        )
    }

    return unique(strengths).slice(0, 6)
}

const getSuggestions = (missingRequired, missingPreferred, softSkills, productRole) => {
    const suggestions = []

    for (const item of missingRequired) {
        if (item === "Analytical and Problem Solving") {
            suggestions.push(
                "Highlight examples where you analysed a problem, identified a pattern and reached a practical conclusion."
            )
        }

        if (item === "Product Curiosity") {
            suggestions.push(
                "Make your interest in product development, user experience and improving digital products more visible in your summary or projects."
            )
        }

        if (item === "Data Analysis Tools") {
            suggestions.push(
                "Mention practical use of Excel, Google Sheets or data visualisation tools, including the type of analysis you performed."
            )
        }

        if (item === "SQL and Python") {
            suggestions.push(
                "Show how you used SQL or Python to work with data in a project or practical assignment."
            )
        }

        if (item === "AI and Generative AI") {
            suggestions.push(
                "Explain your specific contribution to AI or Generative AI workflows, including the tools and methods used."
            )
        }

        if (item === "Communication") {
            suggestions.push(
                "Include a genuine example of presenting findings, explaining technical work or communicating recommendations."
            )
        }

        if (item === "Ownership and Attention to Detail") {
            suggestions.push(
                "Highlight a project or internship task where you independently took responsibility and carefully validated the result."
            )
        }
    }

    if (productRole) {
        if (missingRequired.includes("Product Analytics and User Behaviour")) {
            suggestions.push(
                "Your resume does not clearly demonstrate user behaviour analysis. If you have analysed user interactions or usage patterns, describe the findings."
            )
        }

        if (missingRequired.includes("Product Metrics and Evaluation")) {
            suggestions.push(
                "Include genuine examples of evaluating product effectiveness, response quality, engagement or task completion."
            )
        }

        if (missingRequired.includes("Product Discovery and Prioritisation")) {
            suggestions.push(
                "If you have participated in requirements gathering, feature analysis or prioritisation, describe your specific contribution."
            )
        }
    }

    for (const item of missingPreferred) {
        if (item === "Cloud Platforms") {
            suggestions.push(
                "Cloud platform experience is not evident. Mention AWS, GCP or Azure only if you have genuinely used them."
            )
        }

        if (item === "Agile Development Practices") {
            suggestions.push(
                "Mention Agile or Scrum workflows only if you have genuinely participated in them."
            )
        }

        if (item === "Web Frameworks") {
            suggestions.push(
                "Mention the web frameworks you have used and the features you implemented with them."
            )
        }

        if (item === "Prior Internship") {
            suggestions.push(
                "Add relevant internship experience with your responsibilities and technical contributions."
            )
        }

        if (item === "Personal Projects") {
            suggestions.push(
                "Include relevant personal projects with their technologies and your individual contribution."
            )
        }
    }

    const missingTeamwork = softSkills.find(
        item => item.keyword === "Teamwork" && !item.matched
    )

    if (missingTeamwork) {
        suggestions.push(
            "If your internships or projects involved collaboration, describe your specific contribution to the team."
        )
    }

    return unique(suggestions).slice(0, 6)
}


const stopWords = new Set([
    "the", "and", "for", "with", "from", "using", "used", "into",
    "that", "this", "their", "your", "have", "has", "had", "was",
    "were", "are", "been", "being", "its", "our", "they", "them",
    "which", "while", "where", "when", "what", "how", "who",
    "to", "of", "in", "on", "at", "by", "as", "an", "a",
    "is", "it", "or", "be", "through", "across", "also",
    "developed", "built", "created", "engineered", "implemented",
    "integrated", "designed", "constructed", "utilized",
    "utilizing", "made", "worked", "helped", "performed",
    "provided", "delivered", "users", "user", "application",
    "project", "alongside", "leveraging", "leveraged",
    "features", "feature", "enabling", "specific"
])

const normalizeBulletWords = text => String(text || "")
    .toLowerCase()
    .replace(/c\+\+/g, " cpp ")
    .replace(/c#/g, " csharp ")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()

const meaningfulWords = text => normalizeBulletWords(text)
    .split(" ")
    .filter(word => word.length > 2 && !stopWords.has(word))



const getBulletEvidenceContext = (resume, original) => {
    const sections = getResumeSections(resume)

    const allowedSections = [
        sections["Work Experience"],
        sections.Projects
    ].filter(Boolean)

    const targetWords = [...new Set(meaningfulWords(original))]
    const target = normalizeBulletWords(original)

    let bestMatch = null
    let bestScore = 0

    for (const section of allowedSections) {
        const lines = section
            .split("\n")
            .map(line => line.trim())
            .filter(Boolean)

        for (let i = 0; i < lines.length; i++) {
            const normalizedLine = normalizeBulletWords(lines[i])
            const lineWords = new Set(meaningfulWords(lines[i]))

            const common = targetWords.filter(word => lineWords.has(word))
            const coverage = common.length / Math.max(1, targetWords.length)

            const exactMatch =
                normalizedLine.includes(target) ||
                target.includes(normalizedLine)

            const score = exactMatch ? 1 : coverage

            if (score > bestScore) {
                bestScore = score

                bestMatch = {
                    found: exactMatch || (
                        common.length >= 2 && coverage >= 0.35
                    ),
                    context: lines.slice(
                        Math.max(0, i - 2),
                        Math.min(lines.length, i + 4)
                    ).join("\n"),
                    section
                }
            }
        }
    }

    return bestMatch?.found
        ? bestMatch
        : {
            found: false,
            context: "",
            section: ""
        }
}




const getBulletSuggestions = async (resume, jd) => {
    const sections = getResumeSections(resume)

    const experience = sections["Work Experience"] || ""
    const projects = sections.Projects || ""

    const eligibleContent = [
        experience ? `WORK EXPERIENCE:\n${experience}` : "",
        projects ? `PROJECTS:\n${projects}` : ""
    ].filter(Boolean).join("\n\n")

    if (eligibleContent.replace(/\s/g, "").length < 100) {
        return []
    }

    const response = await askAi([
        {
            role: "system",
            content: `You are a strict evidence-based resume editor.

Return valid JSON only:
{
  "bulletSuggestions": [
    {
      "original": "Exact existing resume bullet",
      "improved": "Improved resume bullet",
      "reason": "Explain the actual wording improvement"
    }
  ]
}

Generate up to 4 suggestions. Return fewer when fewer genuine improvements exist.

STRICT RULES:
- Select original bullets only from Work Experience or Projects.
- Copy each original bullet accurately.
- Preserve the exact factual meaning of the original.
- Improve sentence structure, clarity, action verbs and readability.
- You may combine facts only when they belong to the same project or internship.
- Do not add inferred outcomes or benefits.
- Do not claim enhanced, improved, increased, reduced, optimized or boosted results unless explicitly supported by the resume.
- Do not invent efficiency, engagement, accuracy, performance, revenue, user behaviour or business impact.
- Do not add automated workflows unless the resume explicitly describes the automation.
- Do not add technologies, responsibilities, metrics or achievements that are not supported.
- Do not force job description keywords into bullets.
- Do not make synonym-only changes.
- Keep improved bullets concise and professional.
- The reason must describe the actual wording improvement only. Never make unsupported claims about relevance to the target role.
- Return an empty array if no meaningful, factually safe rewrite is possible.`
        },
        {
            role: "user",
            content: `JOB DESCRIPTION:\n${jd.slice(0, 7000)}\n\nRESUME EXPERIENCE AND PROJECTS:\n${eligibleContent.slice(0, 12000)}`
        }
    ])

    const parsed = parseAIJson(response)

    const bullets = Array.isArray(parsed.bulletSuggestions)
        ? parsed.bulletSuggestions
        : []

    console.log("ATS BULLET DEBUG: AI suggestions received:", bullets.length)

    const accepted = []
    const seen = new Set()

    const unsupportedTools = [
        "aws", "gcp", "azure", "junit", "selenium",
        "playwright", "docker", "kubernetes", "spring boot",
        "postgresql", "oracle", "tensorflow", "pytorch",
        "scikit learn"
    ]

    const getNumbers = text =>
        String(text).match(/\d+(?:\.\d+)?%?/g) || []

    const unsupportedClaims = [
        /\b(?:increased|boosted|reduced|decreased|improved|enhanced|optimized|optimised)\s+(?:revenue|conversion|retention|engagement|accuracy|efficiency|productivity|performance|scalability|customer interaction|information retrieval)\b/i,
        /\b(?:resulting in|leading to|achieved|delivered)\s+\d+(?:\.\d+)?%?\b/i,
        /\bautomated workflows?\b/i,
        /\befficient(?:ly)?\b/i,
        /\bseamless(?:ly)?\b/i
    ]

    for (const item of bullets) {
        const original = String(item.original || "").trim()
        const improved = String(item.improved || "").trim()

        if (!original || !improved) continue
        if (original.length < 25 || improved.length < 25) continue

        const originalNormalized = normalizeBulletWords(original)
        const improvedNormalized = normalizeBulletWords(improved)

        if (
            originalNormalized === improvedNormalized ||
            seen.has(originalNormalized)
        ) continue

        const evidence = getBulletEvidenceContext(resume, original)

        if (!evidence.found) {
            console.log("ATS BULLET REJECTED: Original bullet not found")
            continue
        }

        const evidenceText = `${evidence.section}\n${evidence.context}`

        const originalWords = new Set(meaningfulWords(original))
        const improvedWords = new Set(meaningfulWords(improved))
        const evidenceWords = new Set(meaningfulWords(evidenceText))

        const addedWords = [...improvedWords].filter(
            word => !originalWords.has(word)
        )

        const removedWords = [...originalWords].filter(
            word => !improvedWords.has(word)
        )

        if (!addedWords.length || !removedWords.length) continue

        const unsupportedAddedWords = addedWords.filter(word =>
    !evidenceWords.has(word) &&
    ![
        "effectively",
        "clearly",
        "efficiently",
        "structured",
        "reusable",
        "maintainable",
        "maintainability",
        "professional",
        "responsive",
        "integrated",
        "developed",
        "implemented",
        "designed",
        "created",
        "built",
        "using",
        "across",
        "within",
        "while",
        "through"
    ].includes(word)
)

if (unsupportedAddedWords.length > 3) {
    console.log(
        "ATS BULLET REJECTED: Unsupported added terms",
        unsupportedAddedWords
    )
    continue
}

        const intersection = [...originalWords].filter(
            word => improvedWords.has(word)
        ).length

        const union = new Set([
            ...originalWords,
            ...improvedWords
        ]).size

        const similarity = union ? intersection / union : 1

        if (similarity > 0.92) continue

        const oldNumbers = getNumbers(original)
        const newNumbers = getNumbers(improved)

        if (newNumbers.some(number => !oldNumbers.includes(number))) {
            console.log("ATS BULLET REJECTED: Unsupported numbers")
            continue
        }

        const hasUnsupportedTool = unsupportedTools.some(tool =>
            contains(improved, [tool]) &&
            !contains(evidenceText, [tool])
        )

        if (hasUnsupportedTool) {
            console.log("ATS BULLET REJECTED: Unsupported technology")
            continue
        }

        const hasUnsupportedClaim = unsupportedClaims.some(pattern =>
            pattern.test(improved) && !pattern.test(evidenceText)
        )

        if (hasUnsupportedClaim) {
            console.log("ATS BULLET REJECTED: Unsupported impact claim")
            continue
        }

        seen.add(originalNormalized)

        accepted.push({
            original,
            improved,
            reason: String(item.reason || "").trim() ||
                "Improves clarity and sentence structure while preserving the original experience."
        })

        if (accepted.length === 4) break
    }

    if (!accepted.length) {
    console.log("ATS BULLET REVIEW DEBUG: No suggestions to review")
    return []
}

try {
    const reviewInput = accepted.map(item => {
        const evidence = getBulletEvidenceContext(resume, item.original)

        return {
            original: item.original,
            improved: item.improved,
            sourceSection: evidence.section,
            sourceContext: evidence.context
        }
    })

    const reviewResponse = await askAi([
        {
            role: "system",
            content: `You are a strict professional resume editor.

Review the suggested resume bullet rewrites and return only genuinely useful improvements.

Rules:
1. Preserve the exact original meaning and all factual details.
2. Do not invent skills, tools, responsibilities, metrics, results or achievements.
3. Do not make synonym-only changes.
4. Improve actual sentence structure, clarity, conciseness or professional wording.
5. The improved sentence must sound natural and grammatically correct.
6. Reject a suggestion if the original sentence is already good and does not need improvement.
7. Reject awkward constructions such as "provide users with understanding".
8. Do not change a sentence just to make it look different.
9. Use the source context only to verify facts, not to add new claims.
10. Return fewer suggestions if necessary. Returning an empty array is acceptable.

Example of a bad rewrite:
Original: "Integrated AI-generated business insights to help users understand payment status."
Bad: "Integrated AI-generated business insights to provide users with understanding of payment status."

Example of a bad rewrite:
Original: "Improved frontend maintainability by organizing interface elements into reusable components."
Bad: "Enhanced frontend maintainability by structuring interface elements into reusable components."

Return valid JSON only:
{
  "bulletSuggestions": [
    {
      "original": "Exact original sentence",
      "improved": "Genuinely improved sentence",
      "reason": "Specific explanation of what was improved"
    }
  ]
}`
        },
        {
            role: "user",
            content: JSON.stringify({
                jobDescription: jd,
                suggestions: reviewInput
            })
        }
    ])

    const reviewData = parseAIJson(reviewResponse)
    const reviewedSuggestions = Array.isArray(reviewData?.bulletSuggestions)
        ? reviewData.bulletSuggestions
        : []

    const acceptedByOriginal = new Map(
        accepted.map(item => [
            normalizeBulletWords(item.original),
            item
        ])
    )

    const finalSuggestions = []
    const finalSeen = new Set()

    for (const item of reviewedSuggestions) {
        const original = String(item.original || "").trim()
        const improved = String(item.improved || "").trim()
        const key = normalizeBulletWords(original)

        const sourceItem = acceptedByOriginal.get(key)

        if (!sourceItem || finalSeen.has(key)) continue
        if (improved.length < 25) continue
        if (normalizeBulletWords(improved) === normalizeBulletWords(sourceItem.original)) continue

        if (/provide users with understanding/i.test(improved)) continue

        const originalWords = new Set(meaningfulWords(sourceItem.original))
        const improvedWords = new Set(meaningfulWords(improved))

        const addedWords = [...improvedWords].filter(word => !originalWords.has(word))
        const removedWords = [...originalWords].filter(word => !improvedWords.has(word))

        if (!addedWords.length || !removedWords.length) continue

        const intersection = [...originalWords].filter(word => improvedWords.has(word)).length
        const union = new Set([...originalWords, ...improvedWords]).size
        const similarity = intersection / Math.max(1, union)

        if (similarity > 0.92) continue

        const evidence = getBulletEvidenceContext(resume, sourceItem.original)
        const evidenceText = `${sourceItem.original}\n${evidence.section}\n${evidence.context}`

        const originalNumbers = getNumbers(sourceItem.original)

        if (getNumbers(improved).some(number => !originalNumbers.includes(number))) {
            continue
        }

        if (
            unsupportedTools.some(tool =>
                contains(improved, [tool]) && !contains(evidenceText, [tool])
            )
        ) {
            continue
        }

        if (
            unsupportedClaims.some(pattern => {
                pattern.lastIndex = 0
                const appearsInImproved = pattern.test(improved)

                pattern.lastIndex = 0
                const appearsInEvidence = pattern.test(evidenceText)

                return appearsInImproved && !appearsInEvidence
            })
        ) {
            continue
        }

        finalSeen.add(key)

        finalSuggestions.push({
            original: sourceItem.original,
            improved,
            reason: String(item.reason || "").trim() ||
                "Improves clarity and sentence structure while preserving the original experience."
        })

        if (finalSuggestions.length === 4) break
    }

    console.log("ATS BULLET REVIEW DEBUG:", {
    generated: accepted.length,
    reviewed: reviewedSuggestions.length,
    finalAccepted: finalSuggestions.length
})

if (!finalSuggestions.length) {
    console.log("ATS BULLET REVIEW: Using first-stage validated suggestions")
    return accepted
}

return finalSuggestions
} catch (error) {
    console.error("ATS BULLET REVIEW ERROR:", error.message)
    return []
}
}





const createSummary = (
    score,
    requiredScore,
    preferredScore,
    missingRequired,
    missingPreferred,
    hasPreferred
) => {
    const level = score >= 85
        ? "strong"
        : score >= 70
            ? "good"
            : score >= 50
                ? "moderate"
                : "limited"

    let summary = `Your resume shows a ${level} match for this role, with an estimated ATS compatibility score of ${score}%.`

    if (requiredScore !== null) {
        summary += ` Required-skill alignment is ${requiredScore}%.`
    }

    if (hasPreferred && preferredScore !== null) {
        summary += ` Preferred-skill alignment is ${preferredScore}%.`
    } else {
        summary += " The job description does not specify a separate preferred-skills section."
    }

    if (missingRequired.length) {
        summary += ` Areas to strengthen include ${missingRequired.slice(0, 3).join(", ")}.`
    } else if (missingPreferred.length) {
        summary += ` Consider strengthening preferred areas such as ${missingPreferred.slice(0, 3).join(", ")}.`
    }

    return summary
}

export const analyseATS = async (req, res) => {
    let filePath

    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Please upload your resume."
            })
        }

        filePath = req.file.path

        const jobDescription = String(req.body.jobDescription || "").trim()

        if (jobDescription.length < 50) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid job description."
            })
        }

        const { text: resumeText, pages } = await extractResumeText(req.file)

        if (resumeText.length < 100) {
            return res.status(400).json({
                success: false,
                message: "Could not extract enough text from this resume. Please upload a text-based PDF or DOCX."
            })
        }

        const resumeSections = getResumeSections(resumeText)
        const sections = detectSections(resumeText)
        const jdSections = extractJDSections(jobDescription)

        let aiData = {}

        try {
            const aiResponse = await askAi([
                {
                    role: "system",
                    content: `Return only valid JSON.

Analyze the job description and resume.
Extract concise requirements using exact concepts from the job description.
Separate minimum requirements from preferred requirements.
Do not include responsibilities as minimum qualifications unless they are explicitly listed as requirements.
Do not invent requirements.
Do not treat a missing preferred section as a list of missing skills.
Group alternatives such as SQL or Python into one requirement when appropriate.

Return:
{
"role":"",
"requiredRequirements":[{"keyword":""}],
"preferredRequirements":[{"keyword":""}],
"strengths":[],
"suggestions":[],
"hrRedFlags":[],
"seniority":{"estimatedLevel":"Intern","confidence":"medium","explanation":""},
"summary":""
}`
                },
                {
                    role: "user",
                    content: `JOB DESCRIPTION:\n${jobDescription.slice(0, 10000)}\n\nRESUME:\n${resumeText.slice(0, 14000)}`
                }
            ])

            aiData = parseAIJson(aiResponse)
        } catch (error) {
            console.error("ATS AI evaluation error:", error.message)
        }

        const productRole = isProductAnalyticsRole(jobDescription)

        let requiredNames
        let preferredNames

        if (productRole) {
            requiredNames = extractProductRequirements(
                jdSections.required,
                jdSections.responsibilities
            )

            preferredNames = []
        } else {
            requiredNames = extractGenericRequirements(
                jdSections.required || jobDescription,
                aiData.requiredRequirements,
                "required"
            )

            preferredNames = extractGenericRequirements(
                jdSections.preferred,
                aiData.preferredRequirements,
                "preferred"
            )
        }

        if (!requiredNames.length && Array.isArray(aiData.requiredRequirements)) {
            requiredNames = unique(
                aiData.requiredRequirements
                    .map(item => typeof item === "string"
                        ? item
                        : item?.keyword || item?.name
                    )
                    .filter(Boolean)
                    .map(canonical)
            )
        }

        const required = requiredNames.map(name =>
            matchRequirement(name, resumeText, resumeSections)
        )

        const preferred = preferredNames.map(name =>
            matchRequirement(name, resumeText, resumeSections)
        )

        const requiredScore = calculateMatch(required)
        const hasPreferred = preferred.length > 0
        const preferredScore = hasPreferred
            ? calculateMatch(preferred)
            : null

        const testingRole = contains(jobDescription, [
            "test engineering",
            "quality assurance",
            "software testing",
            "test automation",
            "qa engineer",
            "test engineer"
        ])

        const experienceScore = calculateExperience(
            resumeSections,
            productRole,
            testingRole
        )

        const projectScore = calculateProjects(
            resumeSections.Projects,
            productRole,
            testingRole
        )

        const educationScore = calculateEducation(
            resumeText,
            resumeSections.Education
        )

        const readabilityScore = calculateReadability(
            resumeText,
            sections
        )

        const scoreBreakdown = {
            requiredSkills: requiredScore ?? 0,
            preferredSkills: preferredScore,
            experience: experienceScore,
            projects: projectScore,
            education: educationScore,
            readability: readabilityScore
        }

        const weights = {
            requiredSkills: 0.40,
            preferredSkills: 0.10,
            experience: 0.20,
            projects: 0.15,
            education: 0.10,
            readability: 0.05
        }

        let total = 0
        let activeWeight = 0

        for (const [key, weight] of Object.entries(weights)) {
            if (key === "requiredSkills" && requiredScore === null) {
                continue
            }

            if (key === "preferredSkills" && !hasPreferred) {
                continue
            }

            total += scoreBreakdown[key] * weight
            activeWeight += weight
        }

        const atsScore = activeWeight
            ? clamp(total / activeWeight)
            : 0

        const matchedRequiredKeywords = required
            .filter(item => item.matched)
            .map(item => item.keyword)

        const matchedPreferredKeywords = preferred
            .filter(item => item.matched)
            .map(item => item.keyword)

        const missingRequiredKeywords = required
            .filter(item => !item.matched)
            .map(item => item.keyword)

        const missingPreferredKeywords = preferred
            .filter(item => !item.matched)
            .map(item => item.keyword)

        const matchedKeywords = unique([
            ...matchedRequiredKeywords,
            ...matchedPreferredKeywords
        ])

        const softSkills = getSoftSkills(resumeText)

        const strengths = getStrengths(
            resumeText,
            required,
            preferred
        )

        const suggestions = getSuggestions(
            missingRequiredKeywords,
            missingPreferredKeywords,
            softSkills,
            productRole
        )

        let bulletSuggestions = []

        try {
            bulletSuggestions = await getBulletSuggestions(
                resumeText,
                jobDescription
            )
        } catch (error) {
            console.error("Resume rewrite error:", error.message)
        }

        const resumeImprovements = bulletSuggestions.map(item => ({
            section: "Resume Bullet",
            original: item.original,
            improved: item.improved,
            recommendation: item.improved,
            reason: item.reason
        }))

        const contactFound = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(resumeText)
        const githubFound = /github\.com\//i.test(resumeText)
        const linkedinFound = /linkedin\.com\/in\//i.test(resumeText)

        const detectedSections = sections
            .filter(item => item.found)
            .map(item => item.name)

        const atsEssentials = {
            fileFormat: {
                status: "good",
                value: (req.file.originalname.split(".").pop() || "").toUpperCase(),
                details: "Supported document format."
            },
            fileSize: {
                status: req.file.size <= 5 * 1024 * 1024 ? "good" : "warning",
                value: `${(req.file.size / 1048576).toFixed(2)} MB`,
                details: "Uploaded resume file size."
            },
            contactInformation: {
                status: contactFound ? "good" : "warning",
                details: [
                    contactFound ? "Email detected" : "Email not detected",
                    linkedinFound ? "LinkedIn detected" : "LinkedIn not detected",
                    githubFound ? "GitHub detected" : "GitHub not detected"
                ].join(". ")
            },
            sectionHeadings: {
                status: detectedSections.length >= 4 ? "good" : "warning",
                details: `Detected ${detectedSections.length} standard sections.`,
                foundSections: detectedSections
            },
            datesAndLinks: {
                status: /\b(19|20)\d{2}\b/.test(resumeText) ? "good" : "warning",
                details: "Date and profile link extraction check."
            },
            readability: {
                status: readabilityScore >= 70 ? "good" : "warning",
                details: `${resumeText.split(/\s+/).length} words extracted. This is a text extraction estimate, not a visual ATS guarantee.`
            }
        }

        const lines = resumeText.split("\n").filter(Boolean)

        const contentAnalysis = {
            atsParseRate: readabilityScore,
            quantifyingImpact: clamp(
                lines.filter(line => /\d+/.test(line)).length /
                Math.max(1, lines.length) * 100
            ),
            repetition: 100,
            grammar: 75,
            bulletConsistency: 75,
            issues: []
        }

        const sectionAnalysis = {
            score: clamp(detectedSections.length / sections.length * 100),
            sections
        }

        const summary = createSummary(
            atsScore,
            requiredScore,
            preferredScore,
            missingRequiredKeywords,
            missingPreferredKeywords,
            hasPreferred
        )

        const report = {
            success: true,
            atsScore,
            role: aiData.role || "Target Role",
            hasPreferredSkills: hasPreferred,
            resumeMetadata: {
                fileName: req.file.originalname,
                fileType: req.file.mimetype,
                fileSize: req.file.size,
                pages
            },
            scoreBreakdown,
            contentAnalysis,
            sectionAnalysis,
            atsEssentials,
            requirements: {
                required,
                preferred
            },
            softSkills,
            hrRedFlags: Array.isArray(aiData.hrRedFlags)
                ? aiData.hrRedFlags
                : [],
            seniority: aiData.seniority || {
                estimatedLevel: "Intern",
                confidence: "medium",
                explanation: "Entry-level role assessment."
            },
            tailoring: {
                roleAlignment: atsScore,
                requiredSkillsMatch: requiredScore ?? 0,
                preferredSkillsMatch: preferredScore,
                experienceRelevance: experienceScore,
                projectRelevance: projectScore,
                matchedKeywords,
                matchedRequiredKeywords,
                matchedPreferredKeywords,
                missingRequiredKeywords,
                missingPreferredKeywords,
                strengths,
                suggestions
            },
            matchedKeywords,
            matchedRequiredKeywords,
            matchedPreferredKeywords,
            missingRequiredKeywords,
            missingPreferredKeywords,
            strengths,
            suggestions,
            bulletSuggestions,
            resumeImprovements,
            summary,
            scoringInfo: {
                method: "Evidence-based job description and resume comparison",
                weights: {
                    requiredSkills: 40,
                    preferredSkills: 10,
                    experience: 20,
                    projects: 15,
                    education: 10,
                    readability: 5
                },
                requirementCounts: {
                    required: required.length,
                    matchedRequired: matchedRequiredKeywords.length,
                    missingRequired: missingRequiredKeywords.length,
                    preferred: preferred.length,
                    matchedPreferred: matchedPreferredKeywords.length,
                    missingPreferred: missingPreferredKeywords.length
                },
                confidence: required.length ? "standard" : "limited",
                note: hasPreferred
                    ? "Estimated compatibility score, not an employer-specific ATS score. Scores are based on evidence detected in the uploaded resume."
                    : "No separate preferred-skills section was found in the job description. Preferred skills are excluded from the score calculation rather than treated as missing or automatically matched."
            }
        }

        return res.status(200).json(report)
    } catch (error) {
        console.error("ATS Analysis Error:", error)

        return res.status(500).json({
            success: false,
            message: error.message || "Unable to analyze resume."
        })
    } finally {
        if (filePath && fs.existsSync(filePath)) {
            fs.unlink(filePath, error => {
                if (error) console.error("Resume cleanup error:", error)
            })
        }
    }
}