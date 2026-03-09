import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { PageLoading } from '../components/Loading';
import './Table.css';

const GradeSubmissions = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/assignments/${id}`).then(({ data }) => setAssignment(data.data));
    api.get(`/assignments/${id}/submissions`).then(({ data }) => setSubmissions(data.data)).finally(() => setLoading(false));
  }, [id]);

  const handleGrade = async (subId, score, feedback) => {
    try {
      const scoreNum = parseFloat(score);
      if (scoreNum < 0) {
        toast.error('Điểm không được nhỏ hơn 0');
        return;
      }
      if (scoreNum > assignment.maxScore) {
        toast.error(`Điểm không được vượt quá ${assignment.maxScore} điểm`);
        return;
      }
      await api.post(`/submissions/${subId}/grade`, { score: scoreNum, feedback });
      toast.success('Đã chấm điểm');
      api.get(`/assignments/${id}/submissions`).then(({ data }) => setSubmissions(data.data));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi');
    }
  };

  if (loading) return <PageLoading />;
  if (!assignment) return <div>Không tìm thấy</div>;

  return (
    <div className="page">
      <button onClick={() => navigate(-1)}>← Quay lại</button>
      <h1>Chấm bài: {assignment.title}</h1>
      <div className="table-box">
        <table>
          <thead><tr><th>SV</th><th>Nội dung</th><th>Trạng thái</th><th>Điểm</th><th>Thao tác</th></tr></thead>
          <tbody>
            {submissions.map((s) => (
              <tr key={s._id}>
                <td>{s.studentId?.name}</td>
                <td>{s.content?.substring(0, 50)}...</td>
                <td>{s.status}</td>
                <td>{s.score ?? '-'}</td>
                <td>
                  {s.status !== 'graded' && (
                    <GradeForm submission={s} onGrade={handleGrade} maxScore={assignment.maxScore} />
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

const GradeForm = ({ submission, onGrade, maxScore }) => {
  const [score, setScore] = useState('');
  const [feedback, setFeedback] = useState('');
  return (
    <form onSubmit={(e) => { e.preventDefault(); onGrade(submission._id, score, feedback); }} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <input 
        type="number" 
        min="0"
        max={maxScore || 10}
        step="0.1" 
        placeholder="Điểm" 
        value={score} 
        onChange={e => setScore(e.target.value)} 
        required 
        style={{ width: 80 }} 
      />
      <input placeholder="Nhận xét" value={feedback} onChange={e => setFeedback(e.target.value)} style={{ width: 150 }} />
      <button type="submit">Chấm</button>
    </form>
  );
};

export default GradeSubmissions;
