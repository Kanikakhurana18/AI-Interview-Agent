import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { serverUrl } from '../App';

import {
  FaArrowLeft,
  FaSearch,
  FaBriefcase,
  FaCheckCircle,
  FaClock,
  FaChartLine,
  FaRegCalendarAlt,
  FaArrowRight,
  FaFileAlt,
  FaFilter
} from 'react-icons/fa';

function History() {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');

  const navigate = useNavigate();

  // Fetch interviews
  const getMyInterviews = async () => {
    try {
      const result = await axios.get(
        serverUrl + '/api/interview/get-interview',
        { withCredentials: true }
      );

      const data = result.data;
      setInterviews(
        Array.isArray(data) ? data : data.interviews || []
      );

    } catch (error) {
      console.error('Error fetching interviews:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getMyInterviews();
  }, []);

  // Statistics
  const completed = interviews.filter(
    item => item.status === 'Completed'
  );

  const pending = interviews.filter(
    item => item.status !== 'Completed'
  );

  const averageScore = completed.length
    ? completed.reduce(
        (sum, item) => sum + (Number(item.finalScore) || 0), 0
      ) / completed.length
    : 0;

  // Search and filter
  const filteredInterviews = useMemo(() => {
    return interviews.filter(item => {
      const matchesSearch = (item.role || '')
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesFilter =
        filter === 'All' ||
        (filter === 'Completed' && item.status === 'Completed') ||
        (filter === 'Incompleted' && item.status !== 'Completed');

      return matchesSearch && matchesFilter;
    });
  }, [interviews, search, filter]);

  const formatDate = (date) => {
    if (!date) return 'Date unavailable';

    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-[#f7f9fc] py-8 px-4 sm:px-6 lg:px-10">

      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-4 mb-9">

          <button
            onClick={() => navigate('/')}
            className="p-3 bg-white rounded-xl border border-gray-200 shadow-sm hover:bg-gray-50 transition"
          >
            <FaArrowLeft className="text-gray-600" />
          </button>

          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
              Interview History
            </h1>

            <p className="text-sm text-gray-500 mt-1">
              Track your progress and review your past interviews.
            </p>
          </div>

        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-9">

          {/* Total */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-blue-50">
                <FaBriefcase className="text-blue-600 text-lg" />
              </div>
              <span className="text-xs text-gray-400">Overall</span>
            </div>

            <h2 className="text-2xl font-bold text-gray-800">
              {interviews.length}
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Total Interviews
            </p>
          </div>

          {/* Completed */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-emerald-50">
                <FaCheckCircle className="text-emerald-600 text-lg" />
              </div>
              <span className="text-xs text-gray-400">Success</span>
            </div>

            <h2 className="text-2xl font-bold text-gray-800">
              {completed.length}
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Completed
            </p>
          </div>

          {/* Pending */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-amber-50">
                <FaClock className="text-amber-600 text-lg" />
              </div>
              <span className="text-xs text-gray-400">Remaining</span>
            </div>

            <h2 className="text-2xl font-bold text-gray-800">
              {pending.length}
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Incomplete
            </p>
          </div>

          {/* Average Score */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-purple-50">
                <FaChartLine className="text-purple-600 text-lg" />
              </div>
              <span className="text-xs text-gray-400">Performance</span>
            </div>

            <h2 className="text-2xl font-bold text-gray-800">
              {averageScore.toFixed(1)}
              <span className="text-sm text-gray-400">/10</span>
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Average Score
            </p>
          </div>

        </div>

        {/* Interview History Section */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-7">

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-7">

            <div>
              <h2 className="text-xl font-bold text-gray-800">
                Your Interviews
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                {filteredInterviews.length} interviews found
              </p>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-500">
              <FaFileAlt />
              Interview Reports
            </div>

          </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-3 mb-7">

            <div className="relative flex-1">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by job role..."
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-gray-700"
              />
            </div>

            <div className="relative sm:w-48">
              <FaFilter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />

              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-gray-700 appearance-none cursor-pointer"
              >
                <option value="All">All Interviews</option>
                <option value="Completed">Completed</option>
                <option value="Incompleted">Incompleted</option>
              </select>
            </div>

          </div>

          {/* Loading */}
          {loading ? (

            <div className="py-16 text-center">
              <div className="w-9 h-9 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500 text-sm">
                Loading your interviews...
              </p>
            </div>

          ) : filteredInterviews.length === 0 ? (

            /* Empty State */
            <div className="py-16 text-center">

              <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-5">
                <FaFileAlt className="text-emerald-600 text-2xl" />
              </div>

              <h3 className="text-lg font-bold text-gray-800">
                {search || filter !== 'All'
                  ? 'No matching interviews'
                  : 'No interviews yet'}
              </h3>

              <p className="text-sm text-gray-500 mt-2">
                {search || filter !== 'All'
                  ? 'Try changing your search or filter.'
                  : 'Start your first AI-powered interview and track your performance here.'}
              </p>

              {!search && filter === 'All' && (
                <button
                  onClick={() => navigate('/')}
                  className="mt-5 px-6 py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition"
                >
                  Start Interview
                </button>
              )}

            </div>

          ) : (

            /* Interview Cards */
            <div className="grid gap-5">

              {filteredInterviews.map((item) => {

                const isCompleted = item.status === 'Completed';

                const score = Math.min(
                  10,
                  Math.max(0, Number(item.finalScore) || 0)
                );

                return (

                  <div
                    key={item._id}
                    className="p-5 sm:p-6 rounded-2xl border border-gray-100 bg-white hover:border-emerald-200 hover:shadow-md transition-all duration-300"
                  >

                    {/* Card Header */}
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">

                      <div>
                        <h3 className="text-lg sm:text-xl font-bold text-gray-800">
                          {item.role}
                        </h3>

                        <p className="text-sm text-gray-500 mt-1">
                          {item.experience} Experience
                        </p>
                      </div>

                      <span className={`w-fit px-3 py-1.5 rounded-full text-xs font-semibold ${
                        isCompleted
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}>
                        {isCompleted ? 'Completed' : 'Incompleted'}
                      </span>

                    </div>

                    {/* Details */}
                    <div className="flex flex-wrap gap-x-6 gap-y-3 mt-5 text-sm text-gray-500">

                      <div className="flex items-center gap-2">
                        <FaBriefcase className="text-emerald-600" />
                        {item.mode}
                      </div>

                      <div className="flex items-center gap-2">
                        <FaFileAlt className="text-emerald-600" />
                        {item.questions?.length || 0} Questions
                      </div>

                      <div className="flex items-center gap-2">
                        <FaRegCalendarAlt className="text-emerald-600" />
                        {formatDate(item.createdAt)}
                      </div>

                    </div>

                    {/* Score */}
                    <div className="mt-6 pt-5 border-t border-gray-100">

                      <div className="flex justify-between items-center mb-3">

                        <div>
                          <p className="text-sm font-semibold text-gray-700">
                            Final Performance
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {isCompleted
                              ? 'Your overall interview score'
                              : 'Complete your interview to get a score'}
                          </p>
                        </div>

                        <p className="text-xl font-bold text-emerald-600">
                          {isCompleted ? `${score.toFixed(1)}/10` : '--'}
                        </p>

                      </div>

                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-linear-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                          style={{
                            width: `${isCompleted ? score * 10 : 0}%`
                          }}
                        ></div>
                      </div>

                    </div>

                    {/* Footer */}
                    <div className="flex justify-end mt-5">

                      <button
                        onClick={() => navigate(`/report/${item._id}`)}
                        disabled={!isCompleted}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
                      >
                        View Report
                        <FaArrowRight />
                      </button>

                    </div>

                  </div>

                );
              })}

            </div>

          )}

        </div>

      </div>

    </div>
  );
}

export default History;
