
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { serverUrl } from '../App';
import Step3Report from '../components/Step3Report';

function InterviewReport() {
  const { interviewId } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchReport = async () => {
      try {
        if (!interviewId) {
          setError('Interview ID is missing');
          return;
        }

        const result = await axios.get(
          `${serverUrl}/api/interview/report/${interviewId}`,
          { withCredentials: true }
        );

        setReport(result.data);

      } catch (error) {
        console.log(error);
        setError(
          error.response?.data?.message || 'Failed to load interview report'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [interviewId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500 text-lg">Loading report...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-red-500">{error}</p>
        <button
          onClick={() => window.history.back()}
          className="px-5 py-2 bg-emerald-600 text-white rounded-lg"
        >
          Back to History
        </button>
      </div>
    );
  }

  return <Step3Report report={report} />;
}

export default InterviewReport;
