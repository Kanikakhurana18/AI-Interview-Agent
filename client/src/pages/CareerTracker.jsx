
import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { motion, AnimatePresence } from 'motion/react'
import {
  FaBriefcase,
  FaBuilding,
  FaCalendarAlt,
  FaChevronDown,
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
  FaArrowUp,
  FaUserFriends,
  FaCheckCircle,
  FaPaperPlane,
  FaChartLine
} from 'react-icons/fa'

const API = 'http://localhost:8000/api'

const statuses = ['Applied', 'Assessment', 'Interview', 'Selected', 'Rejected']

const statusStyles = {
  Applied: 'bg-blue-50 text-blue-600 border-blue-100',
  Assessment: 'bg-amber-50 text-amber-600 border-amber-100',
  Interview: 'bg-purple-50 text-purple-600 border-purple-100',
  Selected: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  Rejected: 'bg-rose-50 text-rose-600 border-rose-100'
}

const emptyForm = {
  companyName: '',
  jobRole: '',
  appliedDate: new Date().toISOString().split('T')[0],
  status: 'Applied',
  interviewDate: '',
  followUpDate: '',
  gotReferral: false,
  notes: ''
}

const formatDate = date => {
  if (!date) return 'Not scheduled'

  const parsedDate = new Date(date)

  if (Number.isNaN(parsedDate.getTime())) return 'Not scheduled'

  return parsedDate.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

const ApplicationTracker = () => {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [fetchError, setFetchError] = useState('')

  const fetchApplications = async () => {
    try {
      setLoading(true)
      setFetchError('')

      const { data } = await axios.get(`${API}/application/get`, {
        withCredentials: true
      })

      const list = data.applications || data.data || []
      setApplications(Array.isArray(list) ? list : [])
    } catch (err) {
      setFetchError(err.response?.data?.message || 'Unable to load applications')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchApplications()
  }, [])

  const filteredApplications = useMemo(() => {
    return applications.filter(item => {
      const query = search.toLowerCase()

      const matchesSearch =
        item.companyName?.toLowerCase().includes(query) ||
        item.jobRole?.toLowerCase().includes(query)

      const matchesFilter = filter === 'All' || item.status === filter

      return matchesSearch && matchesFilter
    })
  }, [applications, search, filter])

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const upcomingInterviews = applications.filter(item => {
    if (!item.interviewDate || ['Selected', 'Rejected'].includes(item.status)) return false

    const date = new Date(item.interviewDate)
    date.setHours(0, 0, 0, 0)

    return date >= today
  }).length

  const activeApplications = applications.filter(item =>
    !['Selected', 'Rejected'].includes(item.status)
  ).length

  const selectedApplications = applications.filter(item =>
    item.status === 'Selected'
  ).length

  const stats = [
    {
      title: 'Total Applications',
      value: applications.length,
      icon: <FaBriefcase />,
      color: 'bg-purple-100 text-purple-600',
      detail: 'All tracked applications'
    },
    {
      title: 'In Progress',
      value: activeApplications,
      icon: <FaClipboardList />,
      color: 'bg-blue-100 text-blue-600',
      detail: 'Active opportunities'
    },
    {
      title: 'Upcoming Interviews',
      value: upcomingInterviews,
      icon: <FaCalendarAlt />,
      color: 'bg-amber-100 text-amber-600',
      detail: 'Scheduled interview rounds'
    },
    {
      title: 'Offers Received',
      value: selectedApplications,
      icon: <FaTrophy />,
      color: 'bg-emerald-100 text-emerald-600',
      detail: 'Successful applications'
    }
  ]

  const openAddModal = () => {
    setEditingId(null)
    setForm({
      ...emptyForm,
      appliedDate: new Date().toISOString().split('T')[0]
    })
    setError('')
    setShowModal(true)
  }

  const openEditModal = item => {
    setEditingId(item._id)

    setForm({
      companyName: item.companyName || '',
      jobRole: item.jobRole || '',
      appliedDate: item.appliedDate
        ? new Date(item.appliedDate).toISOString().split('T')[0]
        : '',
      status: item.status || 'Applied',
      interviewDate: item.interviewDate
        ? new Date(item.interviewDate).toISOString().split('T')[0]
        : '',
      followUpDate: item.followUpDate
        ? new Date(item.followUpDate).toISOString().split('T')[0]
        : '',
      gotReferral: item.gotReferral ?? false,
      notes: item.notes || ''
    })

    setError('')
    setShowModal(true)
  }

  const handleSubmit = async e => {
    e.preventDefault()

    try {
      setSaving(true)
      setError('')

      if (editingId) {
        await axios.put(`${API}/application/update/${editingId}`, form, {
          withCredentials: true
        })
      } else {
        await axios.post(`${API}/application/add`, form, {
          withCredentials: true
        })
      }

      setShowModal(false)
      setForm(emptyForm)
      setEditingId(null)

      await fetchApplications()
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  const deleteApplication = async id => {
    if (!window.confirm('Are you sure you want to delete this application?')) return

    try {
      await axios.delete(`${API}/application/delete/${id}`, {
        withCredentials: true
      })

      setApplications(prev => prev.filter(item => item._id !== id))
    } catch (err) {
      alert(err.response?.data?.message || 'Unable to delete application')
    }
  }

  const updateStatus = async (id, status) => {
    try {
      await axios.put(`${API}/application/update/${id}`, { status }, {
        withCredentials: true
      })

      setApplications(prev => prev.map(item =>
        item._id === id ? { ...item, status } : item
      ))
    } catch (err) {
      alert(err.response?.data?.message || 'Unable to update status')
    }
  }

  const recentApplications = [...applications]
    .sort((a, b) =>
      new Date(b.createdAt || b.appliedDate) -
      new Date(a.createdAt || a.appliedDate)
    )
    .slice(0, 4)

  const activities = applications.flatMap(item => {
    const entries = []

    if (item.interviewDate && !['Selected', 'Rejected'].includes(item.status)) {
      entries.push({
        type: 'Interview',
        date: item.interviewDate,
        company: item.companyName,
        role: item.jobRole
      })
    }

    if (item.followUpDate && !['Selected', 'Rejected'].includes(item.status)) {
      entries.push({
        type: 'Follow-up',
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
  }).sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 5)

  const closeModal = () => {
    if (saving) return
    setShowModal(false)
    setEditingId(null)
    setError('')
  }

  return (
    <div className="min-h-screen bg-[#FAF9FF] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-7">

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
              Manage your job applications, track interview rounds and stay on top of every opportunity.
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
                <FaArrowUp className="text-sm text-[#C7C1D8]" />
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

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

          <section className="rounded-2xl border border-[#EEEAF9] bg-white p-5 shadow-sm lg:col-span-2 sm:p-6">
            <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-lg font-bold text-[#211B3A]">
                  My Applications
                </h2>
                <p className="mt-1 text-sm text-[#918AA5]">
                  Your complete job application pipeline
                </p>
              </div>

              <span className="w-fit rounded-lg bg-[#F3EFFF] px-3 py-1.5 text-xs font-semibold text-[#7657E8]">
                {applications.length} Applications
              </span>
            </div>

            <div className="mb-5 flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[#A49DB7]" />

                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search company or job role..."
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

                <FaChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#A49DB7]" />
              </div>
            </div>

            {loading ? (
              <div className="py-16 text-center text-sm text-[#918AA5]">
                Loading applications...
              </div>
            ) : fetchError ? (
              <div className="rounded-xl border border-rose-100 bg-rose-50 p-5 text-center">
                <p className="text-sm font-medium text-rose-600">{fetchError}</p>
                <button
                  onClick={fetchApplications}
                  className="mt-3 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#7657E8] shadow-sm"
                >
                  Try Again
                </button>
              </div>
            ) : filteredApplications.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#DED7F2] bg-[#FCFBFF] px-5 py-14 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F1ECFF] text-2xl text-[#7657E8]">
                  <FaBriefcase />
                </div>

                <h3 className="mt-4 font-bold text-[#332B4A]">
                  {search || filter !== 'All'
                    ? 'No matching applications'
                    : 'Start tracking your applications'}
                </h3>

                <p className="mx-auto mt-2 max-w-sm text-sm text-[#918AA5]">
                  {search || filter !== 'All'
                    ? 'Try changing your search or status filter.'
                    : 'Add your first job application and manage every opportunity from one place.'}
                </p>

                {!search && filter === 'All' && (
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
              <div className="space-y-3">
                {filteredApplications.map((item, index) => (
                  <motion.div
                    key={item._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                    className="rounded-xl border border-[#F0EDF7] p-4 transition hover:border-[#DCD2FA] hover:bg-[#FDFCFF]"
                  >
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                      <div className="flex min-w-0 gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F1ECFF] text-lg text-[#7657E8]">
                          <FaBuilding />
                        </div>

                        <div className="min-w-0">
                          <h3 className="truncate font-bold text-[#332B4A]">
                            {item.companyName}
                          </h3>

                          <p className="mt-1 text-sm text-[#817B96]">
                            {item.jobRole}
                          </p>

                          <p className="mt-2 flex items-center gap-1.5 text-xs text-[#A09AAF]">
                            <FaCalendarAlt />
                            Applied {formatDate(item.appliedDate)}
                          </p>

                          {item.gotReferral && (
                            <span className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600">
                              <FaUserFriends />
                              Referral Received
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                        <select
                          value={item.status}
                          onChange={e => updateStatus(item._id, e.target.value)}
                          className={`max-w-36 rounded-lg border px-3 py-2 text-xs font-semibold outline-none ${statusStyles[item.status] || statusStyles.Applied}`}
                        >
                          {statuses.map(status => (
                            <option key={status}>{status}</option>
                          ))}
                        </select>

                        <button
                          onClick={() => openEditModal(item)}
                          title="Edit application"
                          className="rounded-lg border border-[#EEEAF9] p-2.5 text-[#82799D] transition hover:bg-[#F2EEFF] hover:text-[#7657E8]"
                        >
                          <FaEdit />
                        </button>

                        <button
                          onClick={() => deleteApplication(item._id)}
                          title="Delete application"
                          className="rounded-lg border border-[#F8E5E8] p-2.5 text-[#D47B8B] transition hover:bg-rose-50"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>

                    {(item.interviewDate || item.followUpDate || item.notes) && (
                      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-[#F2EFF8] pt-3 text-xs text-[#89829D]">
                        {item.interviewDate && (
                          <span className="flex items-center gap-1.5">
                            <FaCalendarAlt className="text-[#7657E8]" />
                            Interview: {formatDate(item.interviewDate)}
                          </span>
                        )}

                        {item.followUpDate && (
                          <span className="flex items-center gap-1.5">
                            <FaRegCalendarCheck className="text-[#7657E8]" />
                            Follow-up: {formatDate(item.followUpDate)}
                          </span>
                        )}

                        {item.notes && (
                          <span className="max-w-full truncate">
                            Note: {item.notes}
                          </span>
                        )}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </section>

          <div className="space-y-6">

            <section className="rounded-2xl border border-[#EEEAF9] bg-white p-5 shadow-sm">
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
                <div className="space-y-4">
                  {activities.map((activity, index) => (
                    <div key={`${activity.company}-${activity.type}-${index}`} className="flex gap-3">
                      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F5F1FF] text-sm text-[#7657E8]">
                        {activity.type === 'Interview'
                          ? <FaCalendarAlt />
                          : <FaRegCalendarCheck />}
                      </div>

                      <div className="min-w-0 flex-1">
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
                <div className="py-7 text-center">
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

            <section className="rounded-2xl border border-[#EEEAF9] bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-bold text-[#332B4A]">
                  Recently Added
                </h2>
                <FaPaperPlane className="text-sm text-[#B5A8DC]" />
              </div>

              {recentApplications.length ? (
                <div className="space-y-4">
                  {recentApplications.map(item => (
                    <div key={item._id} className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#514A68]">
                          {item.companyName}
                        </p>
                        <p className="mt-1 truncate text-xs text-[#9A94AC]">
                          {item.jobRole}
                        </p>
                      </div>

                      <span className={`shrink-0 rounded-lg border px-2 py-1 text-[10px] font-semibold ${statusStyles[item.status] || statusStyles.Applied}`}>
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-5 text-center text-sm text-[#A09AAF]">
                  No applications added yet
                </p>
              )}
            </section>

          </div>
        </div>
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
                    {editingId ? 'Edit Application' : 'Add New Application'}
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
                      onChange={e => setForm({ ...form, companyName: e.target.value })}
                      placeholder="e.g. Google"
                      className="mt-2 w-full rounded-xl border border-[#EAE5F4] px-4 py-3 font-normal outline-none transition focus:border-[#9B80F0]"
                    />
                  </label>

                  <label className="text-sm font-semibold text-[#514A68]">
                    Job Role *
                    <input
                      required
                      value={form.jobRole}
                      onChange={e => setForm({ ...form, jobRole: e.target.value })}
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
                      onChange={e => setForm({ ...form, appliedDate: e.target.value })}
                      className="mt-2 w-full rounded-xl border border-[#EAE5F4] px-4 py-3 font-normal outline-none focus:border-[#9B80F0]"
                    />
                  </label>

                  <label className="text-sm font-semibold text-[#514A68]">
                    Application Status
                    <select
                      value={form.status}
                      onChange={e => setForm({ ...form, status: e.target.value })}
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
                      onChange={e => setForm({ ...form, interviewDate: e.target.value })}
                      className="mt-2 w-full rounded-xl border border-[#EAE5F4] px-4 py-3 font-normal outline-none focus:border-[#9B80F0]"
                    />
                  </label>

                  <label className="text-sm font-semibold text-[#514A68]">
                    Follow-up Date
                    <input
                      type="date"
                      value={form.followUpDate}
                      onChange={e => setForm({ ...form, followUpDate: e.target.value })}
                      className="mt-2 w-full rounded-xl border border-[#EAE5F4] px-4 py-3 font-normal outline-none focus:border-[#9B80F0]"
                    />
                  </label>

                  <label className="text-sm font-semibold text-[#514A68] sm:col-span-2">
                    Referral Received?
                    <select
                      value={String(form.gotReferral)}
                      onChange={e => setForm({
                        ...form,
                        gotReferral: e.target.value === 'true'
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
                    onChange={e => setForm({ ...form, notes: e.target.value })}
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
                      ? 'Saving...'
                      : editingId
                        ? 'Update Application'
                        : 'Save Application'}
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
