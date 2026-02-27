import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { PageLoading } from '../components/Loading';
import './Table.css';

const SubmitAssignment = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [assignment, setAssignment] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [myEnrollment, setMyEnrollment] = useState(null);
  const [content, setContent] = useState('');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Quiz state
  const [quizAnswers, setQuizAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [submittingQuiz, setSubmittingQuiz] = useState(false);

  useEffect(() => {
    api.get(`/assignments/${id}`).then(({ data }) => {
      const a = data.data;
      setAssignment(a);
      if (a?.mode === 'quiz' && Array.isArray(a.questions)) {
        const initial = {};
        a.questions.forEach(q => { initial[q._id] = ''; });
        setQuizAnswers(initial);
        const dur = a.durationMinutes || 60;
        setTimeLeft(dur * 60);
      }
    });
    api.get(`/assignments/${id}/my-submission`).then(({ data }) => {
      setSubmission(data.data);
      if (data.data) setContent(data.data.content || '');
    }).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    // Fetch enrollment info to check if class is completed
    if (user?.role === 'student' && assignment?.classId) {
      api.get(`/classes/${assignment.classId}/my-enrollment`).then(({ data }) => {
        setMyEnrollment(data.data);
      }).catch(() => {});
    }
  }, [user, assignment?.classId]);

  // Countdown timer for quiz
  useEffect(() => {
    if (!assignment || assignment.mode !== 'quiz') return;
    if (!timeLeft || timeLeft <= 0) return;
    const t = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(t);
          // auto submit when time is up
          if (!submittingQuiz && assignment.status === 'published' && (!submission || submission.status !== 'graded')) {
            handleQuizSubmit(true).catch(() => {});
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignment, timeLeft, submission, submittingQuiz]);

  const handleFileSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('content', content);
      files.forEach(f => formData.append('files', f));
      if (submission) {
        await api.put(`/assignments/${id}/resubmit`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Đã nộp lại bài');
      } else {
        await api.post(`/assignments/${id}/submit`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Đã nộp bài');
      }
      navigate(-1, { state: { refreshAfterSubmission: true } });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi');
    }
  };

  const handleQuizAnswerChange = (questionId, value) => {
    setQuizAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleQuizSubmit = async (auto = false) => {
    if (!assignment || assignment.mode !== 'quiz') return;
    setSubmittingQuiz(true);
    try {
      const answers = Object.entries(quizAnswers)
        .filter(([, selected]) => selected)
        .map(([questionId, selectedAnswer]) => ({ questionId, selectedAnswer }));
      if (answers.length === 0) {
        if (!auto) toast.error('Vui lòng chọn ít nhất 1 câu trả lời');
      }
      const { data } = await api.post(`/assignments/${id}/submit`, { answers });
      toast.success(`Đã nộp bài. Đúng ${data.data?.correctCount}/${data.data?.totalQuestions} câu`);
      navigate(-1, { state: { refreshAfterSubmission: true } });
    } catch (err) {
      if (!auto) toast.error(err.response?.data?.message || 'Lỗi');
    } finally {
      setSubmittingQuiz(false);
    }
  };

  if (loading) return <PageLoading />;
  if (!assignment) return <div>Không tìm thấy bài tập</div>;

  const canSubmit = assignment.status === 'published' && (!submission || submission.status !== 'graded');
  const isLate = new Date() > new Date(assignment.deadline);
  const isQuiz = assignment.mode === 'quiz';
  const isClassCompleted = myEnrollment?.isCompleted;

  const formatTime = (sec) => {
    if (sec == null) return '';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const downloadAttachment = async (attachment) => {
    try {
      // Tạo link download từ backend
      const response = await api.get(`/assignments/download/${attachment.name}`, {
        responseType: 'blob'
      });
      
      // Tạo download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = attachment.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success(`Đã tải xuống ${attachment.name}`);
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Lỗi khi tải file: ' + error.message);
    }
  };

  return (
    <div className="page">
      <button onClick={() => navigate(-1)} style={{ marginBottom: 16 }}>← Quay lại</button>
      <h1>{assignment.title}</h1>
      <p>{assignment.description}</p>
      <p>Hạn nộp: {new Date(assignment.deadline).toLocaleString()} | Điểm tối đa: {assignment.maxScore}</p>
      
      {/* Download attachments section */}
      {assignment.attachments && assignment.attachments.length > 0 && (
        <div style={{ 
          backgroundColor: '#e3f2fd', 
          border: '1px solid #2196f3', 
          borderRadius: 8, 
          padding: 16, 
          marginBottom: 16
        }}>
          <h4 style={{ marginBottom: 12, color: '#1976d2' }}>📎 Tài liệu tham khảo</h4>
          {assignment.attachments.map((attachment, index) => (
            <div key={index} style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '8px 0',
              borderBottom: index < assignment.attachments.length - 1 ? '1px solid #e0e0e0' : 'none'
            }}>
              <span style={{ flex: 1 }}>{attachment.name}</span>
              <button 
                onClick={() => downloadAttachment(attachment)}
                style={{ 
                  background: '#2196f3', 
                  color: 'white', 
                  border: 'none', 
                  padding: '6px 12px', 
                  borderRadius: '4px', 
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                📥 Download
              </button>
            </div>
          ))}
        </div>
      )}
      
      {isClassCompleted && (
        <div style={{ 
          backgroundColor: '#ffebee', 
          border: '1px solid #f44336', 
          borderRadius: 8, 
          padding: 16, 
          marginBottom: 16,
          color: '#c62828',
          fontWeight: 'bold'
        }}>
          ⚠️ Môn học này đã hoàn thành. Bạn không thể nộp bài tập nữa.
        </div>
      )}
      {submission?.status === 'graded' && (
        <p><strong>Điểm: {submission.score}</strong> | Nhận xét: {submission.feedback}</p>
      )}

      {isQuiz ? (
        canSubmit && !isClassCompleted ? (
          <div className="form-box">
            <div style={{ marginBottom: 16 }}>
              <strong>Thời gian làm bài:</strong> {assignment.durationMinutes || 60} phút
              {timeLeft != null && (
                <span style={{ marginLeft: 16, color: timeLeft <= 60 ? '#c62828' : '#1b5e20' }}>
                  ⏱ {formatTime(timeLeft)}
                </span>
              )}
            </div>
            {assignment.questions && assignment.questions.length === 0 && (
              <p><em>Không có câu hỏi cho bài trắc nghiệm này.</em></p>
            )}
            {(assignment.questions || []).map((q, idx) => (
              <div key={q._id} style={{ marginBottom: 16, padding: 12, border: '1px solid #eee', borderRadius: 8 }}>
                <div><strong>Câu {idx + 1}:</strong> {q.content}</div>
                <div className="quiz-options">
                  {['A', 'B', 'C', 'D'].map(opt => (
                    <label key={opt} style={{ display: 'block', marginTop: 4 }}>
                      <input
                        type="radio"
                        name={q._id}
                        value={opt}
                        checked={quizAnswers[q._id] === opt}
                        onChange={e => handleQuizAnswerChange(q._id, e.target.value)}
                      />{' '}
                      {opt}. {q[`option${opt}`]}
                    </label>
                  ))}
                </div>
              </div>
            ))}
            {isLate && <p style={{ color: '#c62828' }}>Đã quá hạn - nộp sẽ bị đánh dấu trễ</p>}
            <button type="button" onClick={() => handleQuizSubmit(false)} disabled={submittingQuiz}>
              {submittingQuiz ? 'Đang nộp...' : 'Nộp bài'}
            </button>
          </div>
        ) : (
          <div>Không thể nộp bài (đã chấm, đã đóng hoặc đã hoàn thành môn học).</div>
        )
      ) : (
        canSubmit && !isClassCompleted && (
          <form onSubmit={handleFileSubmit} className="form-box">
            <textarea placeholder="Nội dung bài nộp" value={content} onChange={e => setContent(e.target.value)} rows={6} />
            <input type="file" multiple accept=".pdf,.doc,.docx,.txt,.zip" onChange={e => setFiles(Array.from(e.target.files || []))} />
            {isLate && <p style={{ color: '#c62828' }}>Đã quá hạn - nộp sẽ bị đánh dấu trễ</p>}
            <button type="submit">Nộp bài</button>
          </form>
        )
      )}
    </div>
  );
};

export default SubmitAssignment;
