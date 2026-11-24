
import React, { useEffect, useMemo, useState } from "react"
import axios from "axios"
import { motion, AnimatePresence } from "motion/react"
import {
  DndContext,
  closestCorners,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  DragOverlay
} from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import {
  FaBriefcase,
  FaBuilding,
  FaCalendarAlt,
  FaClock,
  FaEdit,
  FaFilter,
  FaPlus,
  FaSearch,
  FaTrash,
  FaTrophy,
  FaTimes,
  FaRegCalendarCheck,
  FaClipboardList,
  FaUserFriends,
  FaPaperPlane,
  FaChartLine,
  FaGripVertical,
  FaArrowRight,
  FaCheckCircle
} from "react-icons/fa"

const API = "http://localhost:8000/api"

const statuses = ["Applied", "Assessment", "Interview", "Selected", "Rejected"]

const statusConfig = {
  Applied: {
    color: "bg-blue-500",
    light: "bg-blue-50",
    text: "text-blue-600",
    border: "border-blue-100"
  },
  Assessment: {
    color: "bg-amber-500",
    light: "bg-amber-50",
    text: "text-amber-600",
    border: "border-amber-100"
  },
  Interview: {
    color: "bg-purple-500",
    light: "bg-purple-50",
    text: "text-purple-600",
    border: "border-purple-100"
  },
  Selected: {
    color: "bg-emerald-500",
    light: "bg-emerald-50",
    text: "text-emerald-600",
    border: "border-emerald-100"
  },
  Rejected: {
    color: "bg-rose-500",
    light: "bg-rose-50",
    text: "text-rose-600",
    border: "border-rose-100"
  }
}

const emptyForm = {
  companyName: "",
  jobRole: "",
  appliedDate: new Date().toISOString().split("T")[0],
  status: "Applied",
  interviewDate: "",
  followUpDate: "",
  gotReferral: false,
  notes: ""
}

const formatDate = date => {
  if (!date) return "Not scheduled"

  const parsedDate = new Date(date)

  if (Number.isNaN(parsedDate.getTime())) return "Not scheduled"

  return parsedDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  })
}

const toInputDate = date => {
  if (!date) return ""

  const parsed = new Date(date)

  if (Number.isNaN(parsed.getTime())) return ""

  const year = parsed.getFullYear()
  const month = String(parsed.getMonth() + 1).padStart(2, "0")
  const day = String(parsed.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

const ApplicationCard = ({ item, onEdit, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    isDragging
  } = useDraggable({
    id: item._id,
    data: {
      application: item
    }
  })

  const config = statusConfig[item.status] || statusConfig.Applied

  return (
    <motion.div
      ref={setNodeRef}
      layout
      style={{
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.35 : 1,
        touchAction: "none"
      }}
      className="rounded-xl border border-[#EEEAF7] bg-white p-4 shadow-sm transition hover:border-[#D8CCFA] hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F1ECFF] text-[#7657E8]">
            <FaBuilding />
          </div>

          <div className="min-w-0">
            <h3 className="truncate text-sm font-bold text-[#332B4A]">
              {item.companyName}
            </h3>
            <p className="mt-1 text-xs leading-5 text-[#817B96]">
              {item.jobRole}
            </p>
          </div>
        </div>

        <button
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          type="button"
          title="Drag application"
          className="shrink-0 cursor-grab rounded-lg p-2 text-[#AAA2BE] transition hover:bg-[#F3EFFF] hover:text-[#7657E8] active:cursor-grabbing"
        >
          <FaGripVertical />
        </button>
      </div>

      <div className="mt-4 space-y-2 border-t border-[#F1EEF7] pt-3">
        <p className="flex items-center gap-2 text-xs text-[#918AA5]">
          <FaCalendarAlt className="text-[#9A83E8]" />
          Applied {formatDate(item.appliedDate)}
        </p>

        {item.interviewDate && (
          <p className="flex items-center gap-2 text-xs text-[#918AA5]">
            <FaClock className="text-[#9A83E8]" />
            Interview {formatDate(item.interviewDate)}
          </p>
        )}

        {item.followUpDate && (
          <p className="flex items-center gap-2 text-xs text-[#918AA5]">
            <FaRegCalendarCheck className="text-[#9A83E8]" />
            Follow-up {formatDate(item.followUpDate)}
          </p>
        )}

        {item.gotReferral && (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-600">
            <FaUserFriends />
            Referral Received
          </span>
        )}

        {item.notes && (
          <p className="line-clamp-2 text-xs leading-5 text-[#918AA5]">
            {item.notes}
          </p>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-[#F1EEF7] pt-3">
        <span className={`rounded-lg border px-2 py-1 text-[10px] font-semibold ${config.light} ${config.text} ${config.border}`}>
          {item.status}
        </span>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onEdit(item)}
            title="Edit application"
            className="rounded-lg p-2 text-[#9289A8] transition hover:bg-[#F2EEFF] hover:text-[#7657E8]"
          >
            <FaEdit />
          </button>

          <button
            type="button"
            onClick={() => onDelete(item._id)}
            title="Delete application"
            className="rounded-lg p-2 text-[#D18B99] transition hover:bg-rose-50 hover:text-rose-600"
          >
            <FaTrash />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

const ApplicationColumn = ({
  status,
  items,
  onEdit,
  onDelete
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: status
  })

  const config = statusConfig[status]

  return (
    <div className="flex w-[285px] shrink-0 flex-col">
      <div className="mb-3 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${config.color}`} />
          <h3 className="text-sm font-bold text-[#332B4A]">
            {status}
          </h3>
          <span className="rounded-md bg-[#F0EDF7] px-2 py-0.5 text-[10px] font-bold text-[#817B96]">
            {items.length}
          </span>
        </div>

        <span className="text-xs text-[#B0A9C0]">
          <FaGripVertical />
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={`flex min-h-[390px] flex-1 flex-col gap-3 rounded-2xl border p-3 transition-colors ${
          isOver
            ? "border-[#A58CF4] bg-[#F1ECFF]"
            : "border-[#EEEAF7] bg-[#F7F5FC]"
        }`}
      >
        {items.length ? (
          items.map(item => (
            <ApplicationCard
              key={item._id}
              item={item}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))
        ) : (
          <div className={`flex min-h-[150px] flex-1 flex-col items-center justify-center rounded-xl border border-dashed ${
            isOver
              ? "border-[#A58CF4] bg-white"
              : "border-[#DDD6EE]"
          }`}>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#B7ABD9]">
              <FaBriefcase />
            </div>
            <p className="mt-3 text-xs font-medium text-[#A09AAF]">
              {isOver ? "Drop application here" : "No applications yet"}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

const ApplicationTracker = () => {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("All")
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [fetchError, setFetchError] = useState("")
  const [activeApplication, setActiveApplication] = useState(null)
  const [movingId, setMovingId] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8
      }
    }),
    useSensor(KeyboardSensor)
  )

  const fetchApplications = async () => {
    try {
      setLoading(true)
      setFetchError("")

      const { data } = await axios.get(`${API}/application/get`, {
        withCredentials: true
      })

      const list = data.applications || data.data || []
      setApplications(Array.isArray(list) ? list : [])
    } catch (err) {
      setFetchError(
        err.response?.data?.message || "Unable to load applications"
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchApplications()
  }, [])

  const filteredApplications = useMemo(() => {
    return applications.filter(item => {
      const query = search.toLowerCase().trim()

      const matchesSearch =
        item.companyName?.toLowerCase().includes(query) ||
        item.jobRole?.toLowerCase().includes(query)

      const matchesFilter =
        filter === "All" || item.status === filter

      return matchesSearch && matchesFilter
    })
  }, [applications, search, filter])

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const upcomingInterviews = applications.filter(item => {
    if (
      !item.interviewDate ||
      ["Selected", "Rejected"].includes(item.status)
    ) return false

    const date = new Date(item.interviewDate)
    date.setHours(0, 0, 0, 0)

    return date >= today
  }).length

  const activeApplications = applications.filter(item =>
    !["Selected", "Rejected"].includes(item.status)
  ).length

  const selectedApplications = applications.filter(item =>
    item.status === "Selected"
  ).length

  const stats = [
    {
      title: "Total Applications",
      value: applications.length,
      icon: <FaBriefcase />,
      color: "bg-purple-100 text-purple-600",
      detail: "All tracked applications"
    },
    {
      title: "In Progress",
      value: activeApplications,
      icon: <FaClipboardList />,
      color: "bg-blue-100 text-blue-600",
      detail: "Active opportunities"
    },
    {
      title: "Upcoming Interviews",
      value: upcomingInterviews,
      icon: <FaCalendarAlt />,
      color: "bg-amber-100 text-amber-600",
      detail: "Scheduled interview rounds"
    },
    {
      title: "Offers Received",
      value: selectedApplications,
      icon: <FaTrophy />,
      color: "bg-emerald-100 text-emerald-600",
      detail: "Successful applications"
    }
  ]

  const openAddModal = () => {
    setEditingId(null)
    setForm({
      ...emptyForm,
      appliedDate: new Date().toISOString().split("T")[0]
    })
    setError("")
    setShowModal(true)
  }

  const openEditModal = item => {
    setEditingId(item._id)

    setForm({
      companyName: item.companyName || "",
      jobRole: item.jobRole || "",
      appliedDate: toInputDate(item.appliedDate),
      status: item.status || "Applied",
      interviewDate: toInputDate(item.interviewDate),
      followUpDate: toInputDate(item.followUpDate),
      gotReferral: item.gotReferral ?? false,
      notes: item.notes || ""
    })

    setError("")
    setShowModal(true)
  }

  const handleSubmit = async e => {
    e.preventDefault()

    try {
      setSaving(true)
      setError("")

      if (editingId) {
        await axios.put(
          `${API}/application/update/${editingId}`,
          form,
          { withCredentials: true }
        )
      } else {
        await axios.post(
          `${API}/application/add`,
          form,
          { withCredentials: true }
        )
      }

      setShowModal(false)
      setForm(emptyForm)
      setEditingId(null)

      await fetchApplications()
    } catch (err) {
      setError(
        err.response?.data?.message || "Something went wrong"
      )
    } finally {
      setSaving(false)
    }
  }

  const deleteApplication = async id => {
    if (!window.confirm("Are you sure you want to delete this application?")) {
      return
    }

    try {
      await axios.delete(`${API}/application/delete/${id}`, {
        withCredentials: true
      })

      setApplications(prev =>
        prev.filter(item => item._id !== id)
      )
    } catch (err) {
      alert(
        err.response?.data?.message || "Unable to delete application"
      )
    }
  }

  const updateStatus = async (id, newStatus) => {
    const previousApplications = applications

    setApplications(prev =>
      prev.map(item =>
        item._id === id
          ? { ...item, status: newStatus }
          : item
      )
    )

    setMovingId(id)

    try {
      await axios.put(
        `${API}/application/update/${id}`,
        { status: newStatus },
        { withCredentials: true }
      )
    } catch (err) {
      setApplications(previousApplications)

      alert(
        err.response?.data?.message || "Unable to update application status"
      )
    } finally {
      setMovingId(null)
    }
  }

  const handleDragStart = event => {
    const dragged = applications.find(
      item => item._id === event.active.id
    )

    setActiveApplication(dragged || null)
  }

  const handleDragEnd = async event => {
    setActiveApplication(null)

    const { active, over } = event

    if (!over) return

    const application = applications.find(
      item => item._id === active.id
    )

    if (!application) return

    const targetStatus = statuses.includes(over.id)
      ? over.id
      : applications.find(item => item._id === over.id)?.status

    if (!targetStatus || targetStatus === application.status) return

    await updateStatus(application._id, targetStatus)
  }

  const recentApplications = [...applications]
    .sort((a, b) =>
      new Date(b.createdAt || b.appliedDate) -
      new Date(a.createdAt || a.appliedDate)
    )
    .slice(0, 4)

  const activities = applications.flatMap(item => {
    const entries = []

    if (
      item.interviewDate &&
      !["Selected", "Rejected"].includes(item.status)
    ) {
      entries.push({
        type: "Interview",
        date: item.interviewDate,
        company: item.companyName,
        role: item.jobRole
      })
    }

    if (
      item.followUpDate &&
      !["Selected", "Rejected"].includes(item.status)
    ) {
      entries.push({
        type: "Follow-up",
        date: item.followUpDate,
        company: item.companyName,
        role: item.jobRole
      })
    }

    return entries
  }).filter(item => {
    const date = new Date(item.date)
    date.setHours(0, 0, 0, 0)
    return date >= today
  }).sort((a, b) =>
    new Date(a.date) - new Date(b.date)
  ).slice(0, 5)

  const closeModal = () => {
    if (saving) return

    setShowModal(false)
    setEditingId(null)
    setError("")
  }

  const groupedApplications = statuses.reduce((groups, status) => {
    groups[status] = filteredApplications.filter(
      item => item.status === status
    )
    return groups
  }, {})

  return (
    <div className="min-h-screen bg-[#FAF9FF] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1600px] space-y-7">

        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#7657E8]" />
              <p className="text-sm font-semibold tracking-wide text-[#7657E8]">
                YOUR JOB SEARCH
              </p>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-[#211B3A] sm:text-3xl">
              Application Tracker
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-[#817B96]">
              Organise your opportunities, move applications through every stage and stay prepared for your next interview.
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 rounded-xl bg-[#7657E8] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-200 transition hover:-translate-y-0.5 hover:bg-[#6545D5]"
          >
            <FaPlus />
            Add Application
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.07 }}
              className="rounded-2xl border border-[#EEEAF9] bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl text-lg ${stat.color}`}>
                  {stat.icon}
                </div>
                <FaArrowRight className="text-sm text-[#C7C1D8]" />
              </div>

              <h2 className="mt-5 text-3xl font-bold text-[#211B3A]">
                {stat.value}
              </h2>

              <p className="mt-1 text-sm font-semibold text-[#514A68]">
                {stat.title}
              </p>

              <p className="mt-1 text-xs text-[#9A94AC]">
                {stat.detail}
              </p>
            </motion.div>
          ))}
        </div>

        <section className="rounded-2xl border border-[#EEEAF9] bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[#211B3A]">
                  Application Pipeline
                </h2>
                <span className="rounded-lg bg-[#F3EFFF] px-2.5 py-1 text-[10px] font-bold text-[#7657E8]">
                  KANBAN BOARD
                </span>
              </div>

              <p className="mt-1 text-sm text-[#918AA5]">
                Drag and drop applications to update their progress
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1 sm:w-64">
                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[#A49DB7]" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search company or role..."
                  className="w-full rounded-xl border border-[#EEEAF9] bg-[#FCFBFF] py-3 pl-11 pr-4 text-sm text-[#332B4A] outline-none transition focus:border-[#A58CF4]"
                />
              </div>

              <div className="relative sm:w-48">
                <FaFilter className="absolute left-4 top-1/2 -translate-y-1/2 text-xs text-[#A49DB7]" />
                <select
                  value={filter}
                  onChange={e => setFilter(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-[#EEEAF9] bg-[#FCFBFF] py-3 pl-10 pr-9 text-sm text-[#514A68] outline-none focus:border-[#A58CF4]"
                >
                  <option value="All">All Status</option>
                  {statuses.map(status => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="py-20 text-center text-sm text-[#918AA5]">
              Loading applications...
            </div>
          ) : fetchError ? (
            <div className="rounded-xl border border-rose-100 bg-rose-50 p-5 text-center">
              <p className="text-sm font-medium text-rose-600">
                {fetchError}
              </p>
              <button
                onClick={fetchApplications}
                className="mt-3 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#7657E8] shadow-sm"
              >
                Try Again
              </button>
            </div>
          ) : (
            <>
              {filteredApplications.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#DED7F2] bg-[#FCFBFF] px-5 py-14 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F1ECFF] text-2xl text-[#7657E8]">
                    <FaBriefcase />
                  </div>

                  <h3 className="mt-4 font-bold text-[#332B4A]">
                    {search || filter !== "All"
                      ? "No matching applications"
                      : "Start tracking your applications"}
                  </h3>

                  <p className="mx-auto mt-2 max-w-sm text-sm text-[#918AA5]">
                    Add your first job application and manage every opportunity from one place.
                  </p>

                  {!search && filter === "All" && (
                    <button
                      onClick={openAddModal}
                      className="mt-5 rounded-xl bg-[#7657E8] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#6545D5]"
                    >
                      <FaPlus className="mr-2 inline" />
                      Add your first application
                    </button>
                  )}
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCorners}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  onDragCancel={() => setActiveApplication(null)}
                >
                  <div className="overflow-x-auto pb-4">
                    <div className="flex min-w-max items-start gap-4">
                      {statuses.map(status => (
                        <ApplicationColumn
                          key={status}
                          status={status}
                          items={groupedApplications[status]}
                          onEdit={openEditModal}
                          onDelete={deleteApplication}
                        />
                      ))}
                    </div>
                  </div>

                  <DragOverlay>
                    {activeApplication ? (
                      <div className="w-[270px] rotate-2 rounded-xl border border-[#CFC1F7] bg-white p-4 shadow-2xl">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F1ECFF] text-[#7657E8]">
                            <FaBuilding />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-[#332B4A]">
                              {activeApplication.companyName}
                            </p>
                            <p className="truncate text-xs text-[#817B96]">
                              {activeApplication.jobRole}
                            </p>
                          </div>
                        </div>
                        <p className="mt-3 text-xs text-[#918AA5]">
                          Moving application...
                        </p>
                      </div>
                    ) : null}
                  </DragOverlay>
                </DndContext>
              )}
            </>
          )}

          {movingId && (
            <p className="mt-3 flex items-center gap-2 text-xs font-medium text-[#7657E8]">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#7657E8]" />
              Saving application status...
            </p>
          )}
        </section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <section className="rounded-2xl border border-[#EEEAF9] bg-white p-5 shadow-sm lg:col-span-2 sm:p-6">
            <div className="mb-5 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F1ECFF] text-[#7657E8]">
                <FaClock />
              </div>
              <div>
                <h2 className="font-bold text-[#332B4A]">
                  Upcoming Activity
                </h2>
                <p className="text-xs text-[#A09AAF]">
                  Your next application milestones
                </p>
              </div>
            </div>

            {activities.length ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {activities.map((activity, index) => (
                  <div
                    key={`${activity.company}-${activity.type}-${index}`}
                    className="flex gap-3 rounded-xl border border-[#F0EDF7] p-4"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F5F1FF] text-[#7657E8]">
                      {activity.type === "Interview"
                        ? <FaCalendarAlt />
                        : <FaRegCalendarCheck />}
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#514A68]">
                        {activity.type}
                      </p>
                      <p className="truncate text-xs text-[#918AA5]">
                        {activity.company} · {activity.role}
                      </p>
                      <p className="mt-1 text-xs font-medium text-[#7657E8]">
                        {formatDate(activity.date)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <FaCalendarAlt className="mx-auto text-2xl text-[#D2C9EA]" />
                <p className="mt-3 text-sm font-medium text-[#817B96]">
                  No upcoming activity
                </p>
                <p className="mt-1 text-xs text-[#AAA4B8]">
                  Scheduled interviews and follow-ups will appear here
                </p>
              </div>
            )}
          </section>

          <section className="rounded-2xl bg-linear-to-br from-[#7657E8] to-[#9A7AF3] p-5 text-white shadow-lg shadow-purple-200">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-lg">
              <FaChartLine />
            </div>

            <h2 className="mt-4 text-lg font-bold">
              Your next opportunity awaits!
            </h2>

            <p className="mt-2 text-sm leading-6 text-white/80">
              Stay consistent, prepare for every interview and keep your job search organised with MockAura AI.
            </p>

            <div className="mt-5 flex items-center justify-between rounded-xl bg-white/15 px-4 py-3">
              <span className="text-sm text-white/85">
                Applications tracked
              </span>
              <span className="text-xl font-bold">
                {applications.length}
              </span>
            </div>
          </section>
        </div>

        <section className="rounded-2xl border border-[#EEEAF9] bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-[#332B4A]">
                Recently Added
              </h2>
              <p className="mt-1 text-xs text-[#A09AAF]">
                Your latest job opportunities
              </p>
            </div>
            <FaPaperPlane className="text-sm text-[#B5A8DC]" />
          </div>

          {recentApplications.length ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {recentApplications.map(item => {
                const config = statusConfig[item.status] || statusConfig.Applied

                return (
                  <div
                    key={item._id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-[#F0EDF7] p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#514A68]">
                        {item.companyName}
                      </p>
                      <p className="mt-1 truncate text-xs text-[#9A94AC]">
                        {item.jobRole}
                      </p>
                    </div>

                    <span className={`shrink-0 rounded-lg border px-2 py-1 text-[10px] font-semibold ${config.light} ${config.text} ${config.border}`}>
                      {item.status}
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="py-5 text-center text-sm text-[#A09AAF]">
              No applications added yet
            </p>
          )}
        </section>
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#211B3A]/45 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              className="my-auto w-full max-w-xl rounded-2xl bg-white p-5 shadow-2xl sm:p-7"
            >
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-[#211B3A]">
                    {editingId ? "Edit Application" : "Add New Application"}
                  </h2>
                  <p className="mt-1 text-sm text-[#918AA5]">
                    Keep your job application details up to date
                  </p>
                </div>

                <button
                  onClick={closeModal}
                  className="rounded-lg bg-[#F5F2FB] p-2.5 text-[#817B96] transition hover:text-[#7657E8]"
                >
                  <FaTimes />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className="text-sm font-semibold text-[#514A68]">
                    Company Name *
                    <input
                      required
                      value={form.companyName}
                      onChange={e => setForm({
                        ...form,
                        companyName: e.target.value
                      })}
                      placeholder="e.g. Google"
                      className="mt-2 w-full rounded-xl border border-[#EAE5F4] px-4 py-3 font-normal outline-none transition focus:border-[#9B80F0]"
                    />
                  </label>

                  <label className="text-sm font-semibold text-[#514A68]">
                    Job Role *
                    <input
                      required
                      value={form.jobRole}
                      onChange={e => setForm({
                        ...form,
                        jobRole: e.target.value
                      })}
                      placeholder="e.g. Software Engineer"
                      className="mt-2 w-full rounded-xl border border-[#EAE5F4] px-4 py-3 font-normal outline-none transition focus:border-[#9B80F0]"
                    />
                  </label>

                  <label className="text-sm font-semibold text-[#514A68]">
                    Applied Date *
                    <input
                      required
                      type="date"
                      value={form.appliedDate}
                      onChange={e => setForm({
                        ...form,
                        appliedDate: e.target.value
                      })}
                      className="mt-2 w-full rounded-xl border border-[#EAE5F4] px-4 py-3 font-normal outline-none focus:border-[#9B80F0]"
                    />
                  </label>

                  <label className="text-sm font-semibold text-[#514A68]">
                    Application Status
                    <select
                      value={form.status}
                      onChange={e => setForm({
                        ...form,
                        status: e.target.value
                      })}
                      className="mt-2 w-full rounded-xl border border-[#EAE5F4] bg-white px-4 py-3 font-normal outline-none focus:border-[#9B80F0]"
                    >
                      {statuses.map(status => (
                        <option key={status}>{status}</option>
                      ))}
                    </select>
                  </label>

                  <label className="text-sm font-semibold text-[#514A68]">
                    Interview Date
                    <input
                      type="date"
                      value={form.interviewDate}
                      onChange={e => setForm({
                        ...form,
                        interviewDate: e.target.value
                      })}
                      className="mt-2 w-full rounded-xl border border-[#EAE5F4] px-4 py-3 font-normal outline-none focus:border-[#9B80F0]"
                    />
                  </label>

                  <label className="text-sm font-semibold text-[#514A68]">
                    Follow-up Date
                    <input
                      type="date"
                      value={form.followUpDate}
                      onChange={e => setForm({
                        ...form,
                        followUpDate: e.target.value
                      })}
                      className="mt-2 w-full rounded-xl border border-[#EAE5F4] px-4 py-3 font-normal outline-none focus:border-[#9B80F0]"
                    />
                  </label>

                  <label className="text-sm font-semibold text-[#514A68] sm:col-span-2">
                    Referral Received?
                    <select
                      value={String(form.gotReferral)}
                      onChange={e => setForm({
                        ...form,
                        gotReferral: e.target.value === "true"
                      })}
                      className="mt-2 w-full rounded-xl border border-[#EAE5F4] bg-white px-4 py-3 font-normal outline-none focus:border-[#9B80F0]"
                    >
                      <option value="false">No</option>
                      <option value="true">Yes</option>
                    </select>
                  </label>
                </div>

                <label className="block text-sm font-semibold text-[#514A68]">
                  Notes
                  <textarea
                    rows="3"
                    value={form.notes}
                    onChange={e => setForm({
                      ...form,
                      notes: e.target.value
                    })}
                    placeholder="Add interview details, recruiter contact or reminders..."
                    className="mt-2 w-full resize-none rounded-xl border border-[#EAE5F4] px-4 py-3 font-normal outline-none transition focus:border-[#9B80F0]"
                  />
                </label>

                {error && (
                  <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-500">
                    {error}
                  </p>
                )}

                <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-xl border border-[#EAE5F4] px-5 py-3 text-sm font-semibold text-[#817B96] transition hover:bg-[#FAF9FF]"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-xl bg-[#7657E8] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#6545D5] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving
                      ? "Saving..."
                      : editingId
                        ? "Update Application"
                        : "Save Application"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ApplicationTracker
