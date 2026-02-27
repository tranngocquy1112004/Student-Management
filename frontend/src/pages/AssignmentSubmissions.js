import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import './Table.css';

const AssignmentSubmissions = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [assignment, setAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gradingMode, setGradingMode] = useState({});

  useEffect(() => {
    fetchAssignment();
    fetchSubmissions();
  }, [id]);

  const fetchAssignment = async () => {
    try {
      const { data } = await api.get(`/assignments/${id}`);
      setAssignment(data.data);
    } catch (error) {
      toast.error('Lỗi khi tải bài tập');
    }
  };

  const fetchSubmissions = async () => {
    try {
      const { data } = await api.get(`/assignments/${id}/submissions`);
      setSubmissions(data.data);
    } catch (error) {
      toast.error('Lỗi khi tải bài nộp');
    } finally {
      setLoading(false);
    }
  };

  const handleGradeChange = (submissionId, field, value) => {
    setGradingMode(prev => ({
      ...prev,
      [submissionId]: {
        ...prev[submissionId],
        [field]: value
      }
    }));
  };

  const handleGradeSubmit = async (submissionId) => {
    const grading = gradingMode[submissionId];
    if (!grading.score && grading.score <= 0) {
      toast.error('Vui lòng nhập điểm hợp lệ');
      return;
    }

    try {
      await api.put(`/submissions/${submissionId}/grade`, {
        score: parseFloat(grading.score),
        feedback: grading.feedback || ''
      });
      
      toast.success('Đã lưu điểm');
      setGradingMode(prev => {
        const { [submissionId]: removed, ...rest } = prev;
        return rest;
      });
      
      // Refresh submissions
      fetchSubmissions();
    } catch (error) {
      toast.error('Lỗi khi lưu điểm: ' + error.message);
    }
  };

  const downloadSubmission = async (submission) => {
    try {
      const response = await api.get(`/submissions/${submission._id}/download`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Determine filename based on submission type
      let filename;
      if (submission.files && submission.files.length > 0) {
        // Use original filename from submission
        filename = submission.files[0].name;
      } else if (submission.content) {
        // Text submission
        filename = `${submission.studentId.name}_${assignment.title}_submission.txt`;
      } else {
        // Fallback
        filename = `${submission.studentId.name}_${assignment.title}_submission.zip`;
      }
      
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Đã tải xuống bài nộp');
    } catch (error) {
      toast.error('Lỗi khi tải bài nộp: ' + error.message);
    }
  };

  const downloadAnswerKey = async () => {
    try {
      const response = await api.get(`/assignments/${id}/answer-key`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `${assignment.title}_dap_an.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Đã tải xuống đáp án');
    } catch (error) {
      toast.error('Lỗi khi tải đáp án: ' + error.message);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!assignment) return <div>Không tìm thấy bài tập</div>;

  const isEssay = assignment.mode === 'file';
  const isQuiz = assignment.mode === 'quiz';

  return (
    <div className="page">
      <button onClick={() => navigate(-1)} style={{ marginBottom: 16 }}>← Quay lại</button>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1>{assignment.title}</h1>
        <div>
          {isQuiz && (
            <button 
              onClick={downloadAnswerKey}
              style={{ 
                background: '#ff9800', 
                color: 'white', 
                border: 'none', 
                padding: '8px 16px', 
                borderRadius: '4px', 
                cursor: 'pointer'
              }}
            >
              📄 Tải đáp án
            </button>
          )}
          <span style={{ marginLeft: 12, color: '#666' }}>
            {submissions.length} sinh viên đã nộp / {assignment.students?.length || 0} sinh viên tổng
          </span>
        </div>
      </div>

      <p><strong>Mô tả:</strong> {assignment.description}</p>
      <p><strong>Hạn nộp:</strong> {new Date(assignment.deadline).toLocaleString()}</p>
      <p><strong>Điểm tối đa:</strong> {assignment.maxScore}</p>
      <p><strong>Loại:</strong> {isEssay ? 'Bài tự luận' : 'Bài trắc nghiệm'}</p>

      {/* Statistics */}
      <div style={{ 
        backgroundColor: '#f5f5f5', 
        border: '1px solid #ddd', 
        borderRadius: 8, 
        padding: 16, 
        marginBottom: 24 
      }}>
        <h3>📊 Thống kê</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#2196f3' }}>{submissions.length}</div>
            <div>Đã nộp bài</div>
          </div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#4caf50' }}>
              {submissions.filter(s => s.score !== null && s.score !== undefined).length}
            </div>
            <div>Đã chấm điểm</div>
          </div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#ff9800' }}>
              {submissions.filter(s => s.score === null || s.score === undefined).length}
            </div>
            <div>Chờ chấm</div>
          </div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#9c27b0' }}>
              {submissions.length > 0 ? (submissions.reduce((sum, s) => sum + (s.score || 0), 0) / submissions.length).toFixed(1) : 0}
            </div>
            <div>Điểm trung bình</div>
          </div>
        </div>
      </div>

      {/* Submissions List */}
      <div className="table-box">
        <h3>📝 Danh sách bài nộp</h3>
        <table>
          <thead>
            <tr>
              <th>STT</th>
              <th>Sinh viên</th>
              <th>Ngày nộp</th>
              <th>Trạng thái</th>
              <th>Điểm</th>
              <th>Nhận xét</th>
              <th>File</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((submission, index) => (
              <tr key={submission._id}>
                <td>{index + 1}</td>
                <td>{submission.studentId.name}</td>
                <td>{new Date(submission.submittedAt).toLocaleString()}</td>
                <td>
                  {submission.status === 'submitted' && <span style={{ color: '#ff9800' }}>Đã nộp</span>}
                  {submission.status === 'graded' && <span style={{ color: '#4caf50' }}>Đã chấm</span>}
                  {submission.status === 'late' && <span style={{ color: '#f44336' }}>Nộp muộn</span>}
                </td>
                <td>
                  {isQuiz ? (
                    <span style={{ color: submission.score !== null ? '#2e7d32' : '#666' }}>
                      {submission.score !== null ? `${submission.score}/${assignment.questions.length}` : '-'}
                    </span>
                  ) : (
                    submission.status === 'graded' ? (
                      <span style={{ color: '#2e7d32', fontWeight: 'bold' }}>
                        {submission.score}/{assignment.maxScore}
                      </span>
                    ) : (
                      <input
                        type="number"
                        min="0"
                        max={assignment.maxScore}
                        step="0.5"
                        value={gradingMode[submission._id]?.score || ''}
                        onChange={(e) => handleGradeChange(submission._id, 'score', e.target.value)}
                        placeholder="Điểm"
                        style={{ width: 80, padding: 4 }}
                      />
                    )
                  )}
                </td>
                <td>
                  {isEssay && (
                    <textarea
                      value={gradingMode[submission._id]?.feedback || ''}
                      onChange={(e) => handleGradeChange(submission._id, 'feedback', e.target.value)}
                      placeholder="Nhận xét"
                      rows={2}
                      style={{ width: 150, padding: 4, resize: 'vertical' }}
                    />
                  )}
                </td>
                <td>
                  <button 
                    onClick={() => downloadSubmission(submission)}
                    style={{ 
                      background: '#2196f3', 
                      color: 'white', 
                      border: 'none', 
                      padding: '4px 8px', 
                      borderRadius: '4px', 
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    📥 Download
                  </button>
                </td>
                <td>
                  {isEssay && submission.status !== 'graded' && (
                    <button 
                      onClick={() => handleGradeSubmit(submission._id)}
                      style={{ 
                        background: '#4caf50', 
                        color: 'white', 
                        border: 'none', 
                        padding: '6px 12px', 
                        borderRadius: '4px', 
                        cursor: 'pointer',
                        marginLeft: 8
                      }}
                    >
                      💾 Lưu điểm
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AssignmentSubmissions;
