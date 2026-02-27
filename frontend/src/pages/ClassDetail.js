import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import ConfirmModal from '../components/ConfirmModal';
import AttendanceStatistics from '../components/AttendanceStatistics';
import * as XLSX from 'xlsx';
import './Table.css';

const ClassDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [cls, setCls] = useState(null);
  const [students, setStudents] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [gradebook, setGradebook] = useState([]);
  const [assignmentsList, setAssignmentsList] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [attendanceSessions, setAttendanceSessions] = useState([]);
  const [excelFile, setExcelFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [sessionRecords, setSessionRecords] = useState({});
  const [myEnrollment, setMyEnrollment] = useState(null);
  const [tab, setTab] = useState('students');
  const [modal, setModal] = useState(null);
  const [editing, setEditing] = useState(null);
  const [studentsAll, setStudentsAll] = useState([]);
  const [confirm, setConfirm] = useState(null);
  const [assignmentForm, setAssignmentForm] = useState({
    title: '',
    description: '',
    deadline: '',
    maxScore: 10,
    type: 'individual',
    mode: 'file',
    durationMinutes: 60,
  });
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [assignmentPage, setAssignmentPage] = useState(1);
  const assignmentsPerPage = 5;

  const canEdit = user?.role === 'admin' || user?.role === 'teacher';

  // Helper function to safely convert ID to string
  const safeIdToString = (id) => {
    if (!id) return null;
    const idValue = id._id || id;
    return idValue?.toString() || null;
  };

  const fetchClass = () => api.get(`/classes/${id}`).then(({ data }) => setCls(data.data));
  const fetchStudents = () => api.get(`/classes/${id}/students`).then(({ data }) => setStudents(data.data));
  const fetchAssignments = () => api.get(`/classes/${id}/assignments`).then(({ data }) => setAssignments(data.data));
  const fetchGradebook = () => api.get(`/classes/${id}/gradebook`).then(({ data }) => {
    const d = data.data;
    // new API shape: { gradebook, assignments, submissions }
    setGradebook(d.gradebook || []);
    setAssignmentsList(d.assignments || []);
    setSubmissions(d.submissions || []);
    
    // Debug logging chi tiết
    console.log('=== GRADEBOOK DEBUG ===');
    console.log('Gradebook data:', {
      gradebook: d.gradebook?.length || 0,
      assignments: d.assignments?.length || 0,
      submissions: d.submissions?.length || 0,
      userRole: user?.role,
      userId: user?._id,
      classId: id
    });
    
    if (d.submissions && d.submissions.length > 0) {
      console.log('All submissions:', d.submissions);
      console.log('Sample submission structure:', d.submissions[0]);
    } else {
      console.log('❌ NO SUBMISSIONS DATA FOUND!');
    }
    
    if (d.assignments && d.assignments.length > 0) {
      console.log('All assignments:', d.assignments.map(a => ({ 
        id: a._id, 
        title: a.title, 
        status: a.status 
      })));
    }
    
    console.log('=== END DEBUG ===');
  });
  const fetchAnnouncements = () => api.get(`/classes/${id}/announcements`).then(({ data }) => setAnnouncements(data.data));
  const fetchSchedules = () => api.get(`/classes/${id}/schedules`).then(({ data }) => setSchedules(data.data));
  const fetchAttendance = async () => {
    const { data } = await api.get(`/classes/${id}/attendance/sessions`);
    setAttendanceSessions(data.data);
    const map = {};
    for (const s of data.data || []) {
      // teacher/admin view: all records
      if (canEdit) {
        const { data } = await api.get(`/attendance/sessions/${s._id}/records`);
        map[s._id] = data?.data || [];
      }
    }
    setSessionRecords(map);
  };

  // student-specific attendance (sessions + own records)
  const [myAttendance, setMyAttendance] = useState(null);
  const fetchMyAttendance = async () => {
    try {
      const { data } = await api.get(`/attendance/my-attendance/${id}`);
      setMyAttendance(data.data);
    } catch (err) {
      // ignore if not student or not enrolled
    }
  };

  // student-specific enrollment info
  const fetchMyEnrollment = async () => {
    try {
      const { data } = await api.get(`/classes/${id}/my-enrollment`);
      setMyEnrollment(data.data);
    } catch (err) {
      // ignore if not student or not enrolled
    }
  };

  useEffect(() => { fetchClass(); }, [id]);
  useEffect(() => {
    if (!id) return;
    console.log('=== USEEFFECT DEBUG ===');
    console.log('Fetching data for class:', id);
    console.log('User role:', user?.role);
    console.log('User ID:', user?._id);
    
    fetchStudents();
    fetchAssignments().catch(() => {});
    if (canEdit) {
      console.log('Fetching gradebook (teacher/admin)...');
      fetchGradebook().catch(() => {});
    }
    fetchAnnouncements().catch(() => {});
    fetchSchedules().catch(() => {});
    // always fetch attendance sessions for both students and teachers
  // fetchAttendance().catch(() => {});  // Tạm thởi comment để tránh 404 error
  if (user?.role === 'student') {
    console.log('Fetching gradebook (student)...');
    fetchGradebook().catch(() => {});
    fetchMyAttendance();
    fetchMyEnrollment();
  }
  console.log('=== END USEEFFECT DEBUG ===');
  }, [id, canEdit, user]);
  
  // Refresh data when coming back from submission page
  useEffect(() => {
    if (location.state?.refreshAfterSubmission) {
      fetchGradebook().catch(() => {});
      fetchMyEnrollment();
      // Clear the state to avoid infinite refresh
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state?.refreshAfterSubmission, location.pathname, navigate]);
  useEffect(() => {
    if (user?.role === 'admin') api.get('/admin/users', { params: { role: 'student' } }).then(({ data }) => setStudentsAll(data.data));
  }, [user?.role]);

  const handleAddStudent = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    await api.post(`/classes/${id}/students`, { studentId: fd.get('studentId') });
    setModal(null);
    fetchStudents();
  };
  const handleRemoveStudent = (userId) => {
    setConfirm({ title: 'Xóa sinh viên', message: 'Xóa khỏi lớp?', danger: true, onConfirm: async () => {
      await api.delete(`/classes/${id}/students/${userId}`);
      setConfirm(null);
      fetchStudents();
      fetchGradebook();
      toast.success('Đã xóa');
    }, onCancel: () => setConfirm(null) });
  };
  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    try {
      const payload = {
      title: assignmentForm.title,
      description: assignmentForm.description,
      deadline: assignmentForm.deadline,
      maxScore: parseFloat(assignmentForm.maxScore) || 10,
      type: assignmentForm.type || 'individual',
      mode: assignmentForm.mode || 'file',
      durationMinutes: parseInt(assignmentForm.durationMinutes) || 60,
    };
    if (payload.mode === 'quiz') {
      // ensure quiz questions are fully filled
      const incomplete = quizQuestions.some(q =>
        !q.content || !q.optionA || !q.optionB || !q.optionC || !q.optionD || !q.correctAnswer
      );
      if (incomplete) {
        toast.error('Vui lòng điền đầy đủ nội dung, 4 đáp án và chọn đáp án đúng cho mỗi câu hỏi');
        return;
      }
      payload.questions = quizQuestions.map(q => ({
        content: q.content,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
        correctAnswer: q.correctAnswer,
      }));
    }
    await api.post(`/classes/${id}/assignments`, payload);
    setModal(null);
    setQuizQuestions([]);
    setAssignmentForm({
      title: '',
      description: '',
      deadline: '',
      maxScore: 10,
      type: 'individual',
      mode: 'file',
      durationMinutes: 60,
    });
    fetchAssignments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi tạo bài');
    }
  };
  const handleUpdateAssignment = async (e) => {
    e.preventDefault();
    try {
      if (!editing) return;
      const payload = {
      title: assignmentForm.title,
      description: assignmentForm.description,
      deadline: assignmentForm.deadline,
      maxScore: parseFloat(assignmentForm.maxScore) || 10,
      type: assignmentForm.type || 'individual',
      mode: assignmentForm.mode || 'file',
      durationMinutes: parseInt(assignmentForm.durationMinutes) || 60,
    };
    if (payload.mode === 'quiz') {
      const incomplete = quizQuestions.some(q =>
        !q.content || !q.optionA || !q.optionB || !q.optionC || !q.optionD || !q.correctAnswer
      );
      if (incomplete) {
        toast.error('Vui lòng điền đầy đủ nội dung, 4 đáp án và chọn đáp án đúng cho mỗi câu hỏi');
        return;
      }
      payload.questions = quizQuestions.map(q => ({
        content: q.content,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
        correctAnswer: q.correctAnswer,
      }));
    }
    await api.put(`/assignments/${editing._id}`, payload);
    setModal(null);
    setEditing(null);
    setQuizQuestions([]);
    fetchAssignments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi cập nhật bài');
    }
  };
  const handleDeleteAssignment = (a) => {
    setConfirm({ title: 'Xóa bài tập', message: `Xóa "${a.title}"?`, danger: true, onConfirm: async () => {
      await api.delete(`/assignments/${a._id}`);
      setConfirm(null);
      fetchAssignments();
      toast.success('Đã xóa');
    }, onCancel: () => setConfirm(null) });
  };
  const handlePublishAssignment = async (a) => {
    await api.patch(`/assignments/${a._id}/publish`);
    fetchAssignments();
  };
  const handleCloseAssignment = async (a) => {
    await api.patch(`/assignments/${a._id}/close`);
    fetchAssignments();
  };

  const handleStatusChange = async (assignment, newStatus) => {
    try {
      // Call API to update status in database
      await api.patch(`/assignments/${assignment._id}/status`, { status: newStatus });
      
      // Update local state immediately for better UX
      setAssignments(prev => prev.map(a => 
        a._id === assignment._id ? { ...a, status: newStatus } : a
      ));
      
      toast.success(`Đã cập nhật trạng thái bài tập: ${
        newStatus === 'draft' ? 'Nháp' : 
        newStatus === 'published' ? 'Đã giao bài' : 
        'Hoàn Thành'
      }`);
      
    } catch (error) {
      toast.error('Lỗi khi cập nhật trạng thái: ' + error.message);
      // Revert to original state on error
      fetchAssignments();
    }
  };
  const handleUpdateGrade = async (studentId, qt, gk, ck) => {
    await api.put(`/classes/${id}/gradebook/${studentId}`, { qt, gk, ck });
    fetchGradebook();
    toast.success('Đã lưu điểm');
  };
  const handleGradeRowBlur = (g, e) => {
    const row = e.target.closest('tr');
    const inputs = row?.querySelectorAll('input[type="number"]');
    if (!inputs || inputs.length < 3) return;
    const qt = parseFloat(inputs[0].value) || 0;
    const gk = parseFloat(inputs[1].value) || 0;
    const ck = parseFloat(inputs[2].value) || 0;
    handleUpdateGrade(g.studentId?._id || g.studentId, qt, gk, ck);
  };
  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    await api.post(`/classes/${id}/announcements`, { title: fd.get('title'), content: fd.get('content') });
    setModal(null);
    fetchAnnouncements();
  };
  const handleDeleteAnnouncement = (aId) => {
    setConfirm({ title: 'Xóa thông báo', message: 'Xóa?', danger: true, onConfirm: async () => {
      await api.delete(`/announcements/${aId}`);
      setConfirm(null);
      fetchAnnouncements();
      toast.success('Đã xóa');
    }, onCancel: () => setConfirm(null) });
  };
  const handleCreateSchedule = async (e) => {
    e.preventDefault();
    try {
      const fd = new FormData(e.target);
      const shift = fd.get('shift');
      
      // Xác định thời gian theo ca
      let startTime, endTime;
      if (shift === 'sáng') {
        startTime = '08:30';
        endTime = '11:30';
      } else if (shift === 'chiều') {
        startTime = '13:30';
        endTime = '17:00';
      } else {
        toast.error('Vui lòng chọn ca học');
        return;
      }
      
      const response = await api.post(`/classes/${id}/schedules`, {
        dayOfWeek: parseInt(fd.get('dayOfWeek')),
        startTime,
        endTime,
        room: fd.get('room'),
        shift
      });
      
      // Backend đã tự động gửi email thông báo cho sinh viên
      toast.success(response.data.message || 'Đã tạo lịch học');
      
      setModal(null);
      fetchSchedules();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi thêm lịch học');
    }
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

  const handleFileImport = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setImporting(true);
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Tạo assignment KHÔNG có attachments (sẽ upload sau)
        const assignment = {
          title: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
          description: `File imported: ${file.name}`,
          maxScore: 10,
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
          durationMinutes: 60,
          type: 'individual',
          mode: 'file',
          questions: []
          // Không gửi attachments - sẽ upload file riêng
        };
        
        console.log(`Creating assignment with file: ${file.name}`);
        const response = await api.post(`/classes/${id}/assignments`, assignment);
        console.log('Assignment created:', response.data);
        
        // Upload file thực tế qua endpoint attachments
        const formData = new FormData();
        formData.append('file', file);
        
        try {
          const uploadResponse = await api.post(`/assignments/${response.data.data._id}/attachments`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          console.log(`File uploaded successfully:`, uploadResponse.data);
        } catch (uploadError) {
          console.error('File upload error:', uploadError);
          toast.error(`Lỗi upload file ${file.name}: ${uploadError.message}`);
        }
      }
      
      toast.success(`Đã import ${files.length} file thành công!`);
      fetchAssignments();
      
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Lỗi khi import file: ' + error.message);
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  const handleExcelImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setExcelFile(file);
    
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        
        console.log('Raw Excel data:', data);
        console.log('Number of rows:', data.length);
        
        // Process Excel data
        const assignments = data.map((row, index) => {
          console.log(`Processing row ${index + 1}:`, row);
          
          // Map mode từ Excel sang backend enum
          let mode = 'file'; // default
          const modeValue = (row['Loại'] || row['type'] || '').toLowerCase();
          
          if (modeValue === 'file' || modeValue === 'assignment') {
            mode = 'file';
          } else if (modeValue === 'quiz' || modeValue === 'test') {
            mode = 'quiz';
          }
          
          return {
            title: row['Tên bài tập'] || row['title'] || '',
            description: row['Mô tả'] || row['description'] || '',
            maxScore: parseFloat(row['Điểm tối đa'] || row['maxScore']) || 10,
            deadline: row['Hạn nộp'] || row['deadline'] || '',
            durationMinutes: parseInt(row['Thời gian (phút)'] || row['durationMinutes']) || 60,
            type: 'individual', // default type
            mode: mode, // file hoặc quiz
            questions: mode === 'quiz' ? parseQuestions(row['Câu hỏi'] || row['questions']) : []
          };
        });
        
        console.log('Processed assignments:', assignments);
        
        setImporting(true);
        
        // Create assignments one by one
        let successCount = 0;
        let errorCount = 0;
        
        for (const assignment of assignments) {
          if (assignment.title) {
            try {
              console.log('Creating assignment:', assignment);
              const response = await api.post(`/classes/${id}/assignments`, assignment);
              console.log('Assignment created response:', response.data);
              successCount++;
            } catch (error) {
              console.error('Error creating assignment:', error.response?.data || error.message);
              errorCount++;
            }
          }
        }
        
        console.log(`Import summary: ${successCount} success, ${errorCount} errors`);
        
        toast.success(`Đã import ${assignments.length} bài tập thành công!`);
        
        // Đợi một chút rồi fetch lại để đảm bảo backend đã xử lý xong
        setTimeout(() => {
          fetchAssignments();
        }, 1000);
        
        setExcelFile(null);
        e.target.value = '';
        
      } catch (error) {
        toast.error('Lỗi khi import file Excel: ' + error.message);
      } finally {
        setImporting(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  const parseQuestions = (questionsText) => {
    if (!questionsText) return [];
    try {
      // Nếu questionsText là array (từ test data), return nguyên vẹn
      if (Array.isArray(questionsText)) {
        return questionsText.map((q, index) => {
          if (typeof q === 'string') {
            // Parse string format
            const line = q.trim();
            if (!line) return null;
            
            // Format cũ: Câu hỏi | Đáp án đúng
            if (line.includes('|')) {
              const parts = line.split('|');
              if (parts.length >= 2) {
                return {
                  question: parts[0].trim(),
                  options: ['A', 'B', 'C', 'D'],
                  correctAnswer: parts[1]?.trim() || 'A'
                };
              }
            }
            
            // Format mới: Câu hỏi | A | B | C | D | Đáp án đúng
            if (line.includes('|') && line.split('|').length >= 5) {
              const parts = line.split('|');
              return {
                question: parts[0].trim(),
                options: [
                  parts[1]?.trim() || 'A',
                  parts[2]?.trim() || 'B', 
                  parts[3]?.trim() || 'C',
                  parts[4]?.trim() || 'D'
                ],
                correctAnswer: parts[5]?.trim() || 'A'
              };
            }
            
            // Nếu không match format nào, tạo câu hỏi đơn giản
            return {
              question: line,
              options: ['A', 'B', 'C', 'D'],
              correctAnswer: 'A'
            };
          } else {
            // Nếu là object (từ test data), return nguyên vẹn
            return q;
          }
        });
      }
      
      // Parse questions từ text format - xử lý cả format cũ và mới
      const lines = questionsText.split('\n').filter(q => q.trim());
      return lines.map((line, index) => {
        line = line.trim();
        if (!line) return null;
        
        // Format cũ: Câu hỏi | Đáp án đúng
        if (line.includes('|')) {
          const parts = line.split('|');
          if (parts.length >= 2) {
            return {
              question: parts[0].trim(),
              options: ['A', 'B', 'C', 'D'],
              correctAnswer: parts[1]?.trim() || 'A'
            };
          }
        }
        
        // Format mới: Câu hỏi | A | B | C | D | Đáp án đúng
        if (line.includes('|') && line.split('|').length >= 5) {
          const parts = line.split('|');
          return {
            question: parts[0].trim(),
            options: [
              parts[1]?.trim() || 'A',
              parts[2]?.trim() || 'B', 
              parts[3]?.trim() || 'C',
              parts[4]?.trim() || 'D'
            ],
            correctAnswer: parts[5]?.trim() || 'A'
          };
        }
        
        // Nếu không match format nào, tạo câu hỏi đơn giản
        return {
          question: line,
          options: ['A', 'B', 'C', 'D'],
          correctAnswer: 'A'
        };
      }).filter(q => q !== null);
    } catch {
      return [];
    }
  };
  const handleUpdateSchedule = async (e) => {
    e.preventDefault();
    try {
      const fd = new FormData(e.target);
      await api.put(`/schedules/${editing._id}`, {
        dayOfWeek: parseInt(fd.get('dayOfWeek')),
        startTime: fd.get('startTime'),
        endTime: fd.get('endTime'),
        room: fd.get('room'),
      });
      toast.success('Cập nhật lịch học thành công');
      setModal(null);
      setEditing(null);
      fetchSchedules();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi cập nhật lịch học');
    }
  };
  const handleDeleteSchedule = (sId) => {
    setConfirm({ title: 'Xóa lịch học', message: 'Xóa?', danger: true, onConfirm: async () => {
      await api.delete(`/schedules/${sId}`);
      setConfirm(null);
      fetchSchedules();
      toast.success('Đã xóa');
    }, onCancel: () => setConfirm(null) });
  };
  const handleCreateAttendanceSession = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      await api.post(`/classes/${id}/attendance/sessions`, { date: fd.get('date'), shift: fd.get('shift') });
      setModal(null);
      fetchAttendance();
      toast.success('Đã tạo buổi điểm danh');
    } catch (err) { toast.error(err.response?.data?.message || 'Lỗi'); }
  };

  const handleExportGradebook = async () => {
    const { data } = await api.get(`/classes/${id}/gradebook/export`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([data]));
    const a = document.createElement('a');
    a.href = url;
    a.download = `gradebook-${cls?.name || 'class'}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const DAYS = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

  const openEditAssignment = async (a) => {
    try {
      const { data } = await api.get(`/assignments/${a._id}`);
      const asg = data.data;
      setEditing(asg);
      setAssignmentForm({
        title: asg.title || '',
        description: asg.description || '',
        deadline: asg.deadline ? asg.deadline.slice(0, 16) : '',
        maxScore: asg.maxScore ?? 10,
        type: asg.type || 'individual',
        mode: asg.mode || 'file',
        durationMinutes: asg.durationMinutes || 60,
      });
      if (asg.mode === 'quiz' && Array.isArray(asg.questions)) {
        setQuizQuestions(asg.questions.map((q) => ({
          content: q.content || '',
          optionA: q.optionA || '',
          optionB: q.optionB || '',
          optionC: q.optionC || '',
          optionD: q.optionD || '',
          correctAnswer: q.correctAnswer || '',
        })));
      } else {
        setQuizQuestions([]);
      }
      setModal('editAssignment');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không tải được bài tập');
    }
  };

  if (!cls) return <div>Đang tải...</div>;

  return (
    <div className="page">
      <button onClick={() => navigate('/classes')} style={{ marginBottom: 16 }}>← Quay lại</button>
      <h1>{cls.name}</h1>
      <p>Môn: {cls.subjectId?.name} | GV: {cls.teacherId?.name} | HK {cls.semester} - {cls.year}</p>
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <button className={tab === 'students' ? 'btn-primary' : ''} onClick={() => setTab('students')}>Sinh viên</button>
        <button className={tab === 'assignments' ? 'btn-primary' : ''} onClick={() => setTab('assignments')}>Bài tập</button>
        {canEdit && <button className={tab === 'gradebook' ? 'btn-primary' : ''} onClick={() => setTab('gradebook')}>Bảng điểm</button>}
        <button className={tab === 'announcements' ? 'btn-primary' : ''} onClick={() => setTab('announcements')}>Thông báo</button>
        <button className={tab === 'schedule' ? 'btn-primary' : ''} onClick={() => setTab('schedule')}>Lịch học</button>
        {(user?.role === 'student' || canEdit) && <button className={tab === 'attendance' ? 'btn-primary' : ''} onClick={() => setTab('attendance')}>Điểm danh</button>}
      </div>

      {tab === 'students' && (
        <div className="table-box">
          <div className="page-header">
            <div>
              <h3>Sinh viên trong lớp</h3>
              {user?.role === 'admin' && (
                <p className="page-subtitle">Admin: có thể thêm / xóa sinh viên khỏi lớp.</p>
              )}
              {user?.role === 'teacher' && (
                <p className="page-subtitle">Giảng viên: chỉ xem danh sách sinh viên, thêm/xóa do Admin thực hiện.</p>
              )}
            </div>
            {user?.role === 'admin' && (
              <button className="btn-primary" onClick={() => setModal('addStudent')}>Thêm sinh viên</button>
            )}
          </div>
          <table>
            <thead><tr><th>Mã SV</th><th>Họ tên</th><th>Email</th>{user?.role === 'admin' && <th>Thao tác</th>}</tr></thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td
                    colSpan={user?.role === 'admin' ? 4 : 3}
                    style={{ textAlign: 'center', padding: 16, color: '#666' }}
                  >
                    {user?.role === 'admin'
                      ? 'Chưa có sinh viên trong lớp. Bấm "Thêm sinh viên" để thêm.'
                      : 'Chưa có sinh viên trong lớp. Vui lòng liên hệ Admin để thêm sinh viên vào lớp.'}
                  </td>
                </tr>
              ) : (
                students.map((s) => (
                  <tr key={s._id}>
                    <td>{s.studentCode}</td>
                    <td>{s.name}</td>
                    <td>{s.email}</td>
                    {user?.role === 'admin' && (
                      <td><button className="btn-danger" onClick={() => handleRemoveStudent(s._id)}>Xóa</button></td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'assignments' && (
        <div className="table-box">
          <div className="page-header">
            <h3>Bài tập</h3>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              {canEdit && (
                <>
                  <button className="btn-primary" onClick={() => { setEditing(null); setModal('assignment'); }}>+ Thêm bài tập</button>
                  <label className="btn-primary" style={{ cursor: 'pointer' }}>
                    📁 Import Excel
                    <input 
                      type="file" 
                      accept=".xlsx,.xls" 
                      onChange={handleExcelImport} 
                      style={{ display: 'none' }}
                      disabled={importing}
                    />
                  </label>
                  <label className="btn-primary" style={{ cursor: 'pointer' }}>
                    📎 Import Files
                    <input 
                      type="file" 
                      accept=".pdf,.doc,.docx,.zip,.rar,.txt,.jpg,.png,.mp4,.mp3" 
                      multiple
                      onChange={handleFileImport} 
                      style={{ display: 'none' }}
                      disabled={importing}
                    />
                  </label>
                </>
              )}
            </div>
          </div>
          <table>
          <thead>
            <tr>
              {user?.role === 'student' ? (
                <>
                  <th>Bài tập</th>
                  <th>Hạn nộp</th>
                  <th>Điểm của bạn</th>
                  <th>Làm bài</th>
                </>
              ) : (
                <>
                  <th>Bài tập</th>
                  <th>Hạn nộp</th>
                  <th>Điểm tối đa</th>
                  <th>Trạng thái</th>
                  <th>Link</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {(() => {
              // Pagination logic
              const startIndex = (assignmentPage - 1) * assignmentsPerPage;
              const endIndex = startIndex + assignmentsPerPage;
              const paginatedAssignments = assignments.slice(startIndex, endIndex);
              
              return paginatedAssignments.map((a) => (
              <tr key={a._id}>
                <td>{a.title}</td>
                <td>{new Date(a.deadline).toLocaleString()}</td>
                
                {user?.role === 'student' ? (
                  <>
                    {/* Student View - 4 cột */}
                    <td>
                      {(() => {
                        // Tìm submission cho điểm
                        const submission = submissions.find(s => {
                          const subStudentId = safeIdToString(s.studentId);
                          const subAssignmentId = safeIdToString(s.assignmentId);
                          // Skip invalid submissions
                          if (!subStudentId || !subAssignmentId) return false;
                          return subStudentId === user._id.toString() && 
                                 subAssignmentId === a._id;
                        });
                        
                        if (submission && submission.score != null) {
                          return <span style={{ color: '#2e7d32', fontWeight: 'bold' }}>{submission.score}/{a.maxScore}</span>;
                        } else if (submission) {
                          return <span style={{ color: '#666' }}>Đã nộp (chưa chấm)</span>;
                        } else {
                          return <span style={{ color: '#999' }}>-</span>;
                        }
                      })()}
                    </td>
                    <td>
                      {(() => {
                        // Tìm submission để hiển thị trạng thái
                        const submission = submissions.find(s => {
                          const subStudentId = safeIdToString(s.studentId);
                          const subAssignmentId = safeIdToString(s.assignmentId);
                          // Skip invalid submissions
                          if (!subStudentId || !subAssignmentId) return false;
                          return subStudentId === user._id.toString() && 
                                 subAssignmentId === a._id;
                        });
                        
                        // Logic đơn giản dựa vào database
                        if (submission) {
                          return <span style={{ color: '#2e7d32', fontWeight: 'bold' }}>Đã hoàn thành</span>;
                        } else if (a.status === 'published') {
                          return (
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <Link to={`/assignments/${a._id}/submit`}>Làm bài</Link>
                              {a.attachments && a.attachments.length > 0 && (
                                <button 
                                  onClick={() => downloadAttachment(a.attachments[0])}
                                  style={{ 
                                    background: '#2196f3', 
                                    color: 'white', 
                                    border: 'none', 
                                    padding: '4px 8px', 
                                    borderRadius: '4px', 
                                    cursor: 'pointer',
                                    fontSize: '12px'
                                  }}
                                  title="Download file"
                                >
                                  📥 Download
                                </button>
                              )}
                            </div>
                          );
                        } else if (a.status === 'draft') {
                          return <span style={{ color: '#999', fontStyle: 'italic' }}>Bài tập nháp</span>;
                        } else if (a.status === 'completed') {
                          return <span style={{ color: '#c62828', fontWeight: 'bold' }}>Đã đóng</span>;
                        } else {
                          return <span style={{ color: '#999' }}>-</span>;
                        }
                      })()}
                    </td>
                  </>
                ) : (
                  <>
                    {/* Teacher View - 5 cột */}
                    <td>{a.maxScore}</td>
                    <td>
                      <select 
                        value={a.status} 
                        onChange={(e) => handleStatusChange(a, e.target.value)}
                        style={{ padding: '4px', borderRadius: '4px', border: '1px solid #ddd' }}
                      >
                        <option value="draft">Nháp (Chỉ mình xem)</option>
                        <option value="published">Đã giao bài (Student thấy)</option>
                        <option value="completed">Hoàn Thành (Student không làm)</option>
                      </select>
                    </td>
                    <td>
                      <Link to={`/assignments/${a._id}/submissions`}>Xem Bài Nộp</Link>
                    </td>
                  </>
                )}
              </tr>
            ));
            })()}
          </tbody>
        </table>
        
        {/* Pagination Controls */}
        {assignments.length > assignmentsPerPage && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            gap: '12px', 
            marginTop: '20px',
            padding: '12px'
          }}>
            <button
              onClick={() => setAssignmentPage(prev => Math.max(1, prev - 1))}
              disabled={assignmentPage === 1}
              style={{
                padding: '8px 16px',
                background: assignmentPage === 1 ? '#ccc' : '#2196f3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: assignmentPage === 1 ? 'not-allowed' : 'pointer'
              }}
            >
              ← Trang trước
            </button>
            
            <span style={{ color: '#666', fontSize: '14px' }}>
              Trang {assignmentPage} / {Math.ceil(assignments.length / assignmentsPerPage)}
            </span>
            
            <button
              onClick={() => setAssignmentPage(prev => Math.min(Math.ceil(assignments.length / assignmentsPerPage), prev + 1))}
              disabled={assignmentPage >= Math.ceil(assignments.length / assignmentsPerPage)}
              style={{
                padding: '8px 16px',
                background: assignmentPage >= Math.ceil(assignments.length / assignmentsPerPage) ? '#ccc' : '#2196f3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: assignmentPage >= Math.ceil(assignments.length / assignmentsPerPage) ? 'not-allowed' : 'pointer'
              }}
            >
              Trang sau →
            </button>
          </div>
        )}
        </div>
      )}

      {tab === 'gradebook' && canEdit && (
        <div className="table-box">
          <div className="page-header">
            <h3>Bảng điểm</h3>
            <button className="btn-primary" onClick={handleExportGradebook}>Xuất Excel</button>
          </div>
          <table>
            <thead>
              <tr>
                <th>Mã SV</th>
                <th>Họ tên</th>
                {assignmentsList.map(a => (
                  <th key={a._id} style={{whiteSpace: 'nowrap'}}>{a.title}</th>
                ))}
                <th>Điểm TB bài tập</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const gbMap = Object.fromEntries(gradebook.map(g => [(g.studentId?._id || g.studentId)?.toString(), g]));
                return students.map(s => {
                  const gb = gbMap[(s._id || s).toString()];
                  return gb ? { ...gb, studentId: gb.studentId || s } : { studentId: s, qt: 0, gk: 0, ck: 0, total: 0, averageScore: 0 };
                });
              })().map((g, idx) => {
                const studentIdStr = (g.studentId?._id || g.studentId)?.toString();
                return (
                  <tr key={g._id || studentIdStr || idx}>
                    <td>{g.studentId?.studentCode}</td>
                    <td>{g.studentId?.name}</td>
                    {assignmentsList.map(a => {
                      const sub = submissions.find(s => (s.studentId?._id || s.studentId)?.toString() === studentIdStr && (s.assignmentId?._id || s.assignmentId)?.toString() === a._id);
                      let display;
                      if (sub) {
                        display = sub.score != null ? sub.score : (sub.status === 'late' ? 'QH' : '');
                      } else {
                        // not submitted yet - check deadline
                        display = new Date() > new Date(a.deadline) ? 'QH' : '';
                      }
                      return <td key={a._id}>{display}</td>;
                    })}
                    <td>{g.averageScore ?? 0}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'announcements' && (
        <div className="table-box">
          <div className="page-header">
            <h3>Thông báo</h3>
            {canEdit && <button className="btn-primary" onClick={() => setModal('announcement')}>+ Thông báo</button>}
          </div>
          <table>
            <thead><tr><th>Tiêu đề</th><th>Nội dung</th><th>Người gửi</th><th>Ngày</th>{canEdit && <th>Thao tác</th>}</tr></thead>
            <tbody>
              {announcements.map((a) => (
                <tr key={a._id}>
                  <td>{a.title}</td>
                  <td>{a.content?.substring(0, 50)}...</td>
                  <td>{a.teacherId?.name}</td>
                  <td>{new Date(a.createdAt).toLocaleString()}</td>
                  {canEdit && <td><button className="btn-danger" onClick={() => handleDeleteAnnouncement(a._id)}>Xóa</button></td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'schedule' && (
        <div className="table-box">
          <div className="page-header">
            <h3>Lịch học</h3>
            {canEdit && <button className="btn-primary" onClick={() => setModal('schedule')}>+ Thêm lịch</button>}
          </div>
          <table>
            <thead><tr><th>Thứ</th><th>Giờ</th><th>Phòng</th>{canEdit && <th>Thao tác</th>}</tr></thead>
            <tbody>
              {schedules.map((s) => (
                <tr key={s._id}>
                  <td>{s.dayLabel || DAYS[s.dayOfWeek] || `Thứ ${s.dayOfWeek + 1}`}</td>
                  <td>{s.startTime} - {s.endTime}</td>
                  <td>{s.room || '-'}</td>
                  {canEdit && (
                  <td>
                    <button onClick={() => { setEditing(s); setModal('editSchedule'); }}>Sửa</button>
                    <button className="btn-danger" onClick={() => handleDeleteSchedule(s._id)}>Xóa</button>
                  </td>
                )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'attendance' && (
        <>
          {canEdit && <AttendanceStatistics classId={id} refreshTrigger={attendanceSessions.length} />}
          
          <div className="table-box">
            <h3>Buổi điểm danh</h3>
            {user?.role === 'student' ? (
            <table>
              <thead><tr><th>Ngày</th><th>Ca</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
              <tbody>
                {(myAttendance?.sessions || []).map((s) => {
                  const rec = myAttendance.records.find(r => r.sessionId === s._id);
                  const statusText = rec ? (rec.status === 'present' ? '✓ Có mặt' : (rec.status === 'late' ? 'Trễ' : '✗ Vắng')) : 'Chưa điểm danh';
                  return (
                    <tr key={s._id}>
                      <td>{new Date(s.date).toLocaleDateString()}</td>
                      <td>{s.shift || '-'}</td>
                      <td>{statusText}</td>
                      <td>
                        {rec && rec.status === 'present' && (
                          <span>Đã điểm danh</span>
                        )}
                        {rec && rec.status === 'late' && (
                          <span>Đã điểm danh (trễ)</span>
                        )}
                        {rec && rec.status === 'absent' && (
                          <span>Đã điểm danh (vắng)</span>
                        )}
                        {!rec && (
                          <Link to={`/check-in/${s._id}`}>Điểm danh</Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : canEdit && (
            <table>
              <thead><tr><th>Ngày</th><th>Ca</th><th>Mã</th><th>Đã điểm danh</th><th>Thao tác</th></tr></thead>
              <tbody>
                {attendanceSessions.map((s) => {
                  const records = sessionRecords[s._id] || [];
                  const checkedIn = records.filter(r => r.status === 'present');
                  return (
                    <tr key={s._id}>
                      <td>{new Date(s.date).toLocaleDateString()}</td>
                      <td>{s.shift || '-'}</td>
                      <td>{s.code || '-'}</td>
                      <td>
                        <strong>{checkedIn.length}</strong>/{students.length}
                        {checkedIn.length > 0 && (
                          <div style={{ fontSize: 12, color: '#555', marginTop: 4 }}>
                            {checkedIn.map(r => r.studentId?.name || r.studentId?.studentCode || '-').join(', ')}
                          </div>
                        )}
                      </td>
                      <td><Link to={`/classes/${id}/attendance/${s._id}/qr`}>QR</Link></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          {canEdit && <button className="btn-primary" style={{ marginTop: 16 }} onClick={() => setModal('attendanceSession')}>+ Tạo buổi điểm danh</button>}
        </div>
        </>
      )}

      {modal === 'addStudent' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Thêm sinh viên</h3>
            <form onSubmit={handleAddStudent}>
              <select name="studentId" required>
                <option value="">Chọn sinh viên</option>
                {studentsAll.filter(s => !students.find(st => st._id === s._id)).map(s => (
                  <option key={s._id} value={s._id}>{s.name} - {s.email}</option>
                ))}
              </select>
              <div><button type="submit">Thêm</button><button type="button" onClick={() => setModal(null)}>Hủy</button></div>
            </form>
          </div>
        </div>
      )}
      {modal === 'assignment' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Thêm bài tập</h3>
            <form onSubmit={handleCreateAssignment}>
              <input
                name="title"
                placeholder="Tiêu đề"
                value={assignmentForm.title}
                onChange={e => setAssignmentForm(f => ({ ...f, title: e.target.value }))}
                required
              />
              <textarea
                name="description"
                placeholder="Mô tả"
                rows={3}
                value={assignmentForm.description}
                onChange={e => setAssignmentForm(f => ({ ...f, description: e.target.value }))}
              />
              <input
                name="deadline"
                type="datetime-local"
                value={assignmentForm.deadline}
                onChange={e => setAssignmentForm(f => ({ ...f, deadline: e.target.value }))}
                required
              />
              <input
                name="maxScore"
                type="number"
                step="0.1"
                placeholder="Điểm tối đa"
                value={assignmentForm.maxScore}
                onChange={e => setAssignmentForm(f => ({ ...f, maxScore: e.target.value }))}
              />
              <select
                name="type"
                value={assignmentForm.type}
                onChange={e => setAssignmentForm(f => ({ ...f, type: e.target.value }))}
              >
                <option value="individual">Cá nhân</option>
                <option value="group">Nhóm</option>
              </select>
              <select
                name="mode"
                value={assignmentForm.mode}
                onChange={e => setAssignmentForm(f => ({ ...f, mode: e.target.value }))}
              >
                <option value="file">Bài nộp file / tự luận</option>
                <option value="quiz">Bài trắc nghiệm (tự chấm)</option>
              </select>
              {assignmentForm.mode === 'quiz' && (
                <>
                  <input
                    name="durationMinutes"
                    type="number"
                    min="1"
                    placeholder="Thời gian làm bài (phút)"
                    value={assignmentForm.durationMinutes}
                    onChange={e => setAssignmentForm(f => ({ ...f, durationMinutes: e.target.value }))}
                  />
                  <div style={{ maxHeight: 300, overflowY: 'auto', marginTop: 8, borderTop: '1px solid #eee', paddingTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
                    <h4>Câu hỏi trắc nghiệm</h4>
                    {quizQuestions.length === 0 && (
                      <div style={{ fontStyle: 'italic', color: '#555', marginBottom: 8 }}>
                        Chưa có câu hỏi. Bấm + Thêm câu hỏi để bắt đầu.
                      </div>
                    )}
                    {quizQuestions.map((q, idx) => (
                      <div key={idx} style={{ display: 'block', marginBottom: 4, padding: 8, border: '1px solid #eee', borderRadius: 8 }}>
                        <div><strong>Câu {idx + 1}</strong></div>
                        <textarea
                          placeholder="Nội dung câu hỏi"
                          rows={2}
                          value={q.content}
                          onChange={e => {
                            const next = [...quizQuestions];
                            next[idx] = { ...next[idx], content: e.target.value };
                            setQuizQuestions(next);
                          }}
                        />
                        {['A', 'B', 'C', 'D'].map(opt => (
                          <input
                            key={opt}
                            placeholder={`Đáp án ${opt}`}
                            value={q[`option${opt}`] || ''}
                            onChange={e => {
                              const next = [...quizQuestions];
                              next[idx] = { ...next[idx], [`option${opt}`]: e.target.value };
                              setQuizQuestions(next);
                            }}
                            style={{ display: 'block', marginTop: 4 }}
                          />
                        ))}
                        <select
                          value={q.correctAnswer || ''}
                          onChange={e => {
                            const next = [...quizQuestions];
                            next[idx] = { ...next[idx], correctAnswer: e.target.value };
                            setQuizQuestions(next);
                          }}
                          style={{ marginTop: 4 }}
                        >
                          <option value="">Đáp án đúng</option>
                          <option value="A">A</option>
                          <option value="B">B</option>
                          <option value="C">C</option>
                          <option value="D">D</option>
                        </select>
                        <button
                          type="button"
                          className="btn-danger"
                          style={{ marginTop: 4 }}
                          onClick={() => setQuizQuestions(qs => qs.filter((_, i) => i !== idx))}
                        >
                          Xóa câu hỏi
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setQuizQuestions(qs => [...qs, { content: '', optionA: '', optionB: '', optionC: '', optionD: '', correctAnswer: '' }])}
                    >
                      + Thêm câu hỏi
                    </button>
                  </div>
                </>
              )}
              <div><button type="submit">Tạo</button><button type="button" onClick={() => setModal(null)}>Hủy</button></div>
            </form>
          </div>
        </div>
      )}
      {modal === 'editAssignment' && editing && (
        <div className="modal-overlay" onClick={() => { setModal(null); setEditing(null); setQuizQuestions([]); }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Sửa bài tập</h3>
            <form onSubmit={handleUpdateAssignment}>
              <input
                name="title"
                placeholder="Tiêu đề"
                value={assignmentForm.title}
                onChange={e => setAssignmentForm(f => ({ ...f, title: e.target.value }))}
                required
              />
              <textarea
                name="description"
                placeholder="Mô tả"
                rows={3}
                value={assignmentForm.description}
                onChange={e => setAssignmentForm(f => ({ ...f, description: e.target.value }))}
              />
              <input
                name="deadline"
                type="datetime-local"
                value={assignmentForm.deadline}
                onChange={e => setAssignmentForm(f => ({ ...f, deadline: e.target.value }))}
                required
              />
              <input
                name="maxScore"
                type="number"
                step="0.1"
                placeholder="Điểm tối đa"
                value={assignmentForm.maxScore}
                onChange={e => setAssignmentForm(f => ({ ...f, maxScore: e.target.value }))}
              />
              <select
                name="type"
                value={assignmentForm.type}
                onChange={e => setAssignmentForm(f => ({ ...f, type: e.target.value }))}
              >
                <option value="individual">Cá nhân</option>
                <option value="group">Nhóm</option>
              </select>
              <select
                name="mode"
                value={assignmentForm.mode}
                onChange={e => setAssignmentForm(f => ({ ...f, mode: e.target.value }))}
              >
                <option value="file">Bài nộp file / tự luận</option>
                <option value="quiz">Bài trắc nghiệm (tự chấm)</option>
              </select>
              {assignmentForm.mode === 'quiz' && (
                <>
                  <input
                    name="durationMinutes"
                    type="number"
                    min="1"
                    placeholder="Thời gian làm bài (phút)"
                    value={assignmentForm.durationMinutes}
                    onChange={e => setAssignmentForm(f => ({ ...f, durationMinutes: e.target.value }))}
                  />
                  <div style={{ maxHeight: 300, overflowY: 'auto', marginTop: 8, borderTop: '1px solid #eee', paddingTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
                    <h4>Câu hỏi trắc nghiệm</h4>
                    {quizQuestions.length === 0 && (
                      <div style={{ fontStyle: 'italic', color: '#555', marginBottom: 8 }}>
                        Chưa có câu hỏi. Bấm + Thêm câu hỏi để bắt đầu.
                      </div>
                    )}
                    {quizQuestions.map((q, idx) => (
                      <div key={idx} style={{ display: 'block', marginBottom: 4, padding: 8, border: '1px solid #eee', borderRadius: 8 }}>
                        <div><strong>Câu {idx + 1}</strong></div>
                        <textarea
                          placeholder="Nội dung câu hỏi"
                          rows={2}
                          value={q.content}
                          onChange={e => {
                            const next = [...quizQuestions];
                            next[idx] = { ...next[idx], content: e.target.value };
                            setQuizQuestions(next);
                          }}
                        />
                        {['A', 'B', 'C', 'D'].map(opt => (
                          <input
                            key={opt}
                            placeholder={`Đáp án ${opt}`}
                            value={q[`option${opt}`] || ''}
                            onChange={e => {
                              const next = [...quizQuestions];
                              next[idx] = { ...next[idx], [`option${opt}`]: e.target.value };
                              setQuizQuestions(next);
                            }}
                            style={{ display: 'block', marginTop: 4 }}
                          />
                        ))}
                        <select
                          value={q.correctAnswer || ''}
                          onChange={e => {
                            const next = [...quizQuestions];
                            next[idx] = { ...next[idx], correctAnswer: e.target.value };
                            setQuizQuestions(next);
                          }}
                          style={{ marginTop: 4 }}
                        >
                          <option value="">Đáp án đúng</option>
                          <option value="A">A</option>
                          <option value="B">B</option>
                          <option value="C">C</option>
                          <option value="D">D</option>
                        </select>
                        <button
                          type="button"
                          className="btn-danger"
                          style={{ marginTop: 4 }}
                          onClick={() => setQuizQuestions(qs => qs.filter((_, i) => i !== idx))}
                        >
                          Xóa câu hỏi
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setQuizQuestions(qs => [...qs, { content: '', optionA: '', optionB: '', optionC: '', optionD: '', correctAnswer: '' }])}
                    >
                      + Thêm câu hỏi
                    </button>
                  </div>
                </>
              )}
              <div><button type="submit">Cập nhật</button><button type="button" onClick={() => { setModal(null); setEditing(null); setQuizQuestions([]); }}>Hủy</button></div>
            </form>
          </div>
        </div>
      )}
      {modal === 'announcement' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Gửi thông báo</h3>
            <form onSubmit={handleCreateAnnouncement}>
              <input name="title" placeholder="Tiêu đề" required />
              <textarea name="content" placeholder="Nội dung" rows={4} />
              <div><button type="submit">Gửi</button><button type="button" onClick={() => setModal(null)}>Hủy</button></div>
            </form>
          </div>
        </div>
      )}
      {modal === 'attendanceSession' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Tạo buổi điểm danh</h3>
            <form onSubmit={handleCreateAttendanceSession}>
              <input name="date" type="date" required />
              <input name="shift" placeholder="Ca (VD: Sáng)" />
              <div><button type="submit">Tạo</button><button type="button" onClick={() => setModal(null)}>Hủy</button></div>
            </form>
          </div>
        </div>
      )}
      {modal === 'schedule' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Thêm lịch học</h3>
            <form onSubmit={handleCreateSchedule}>
              <select name="dayOfWeek" required>
                <option value="1">Thứ 2</option>
                <option value="2">Thứ 3</option>
                <option value="3">Thứ 4</option>
                <option value="4">Thứ 5</option>
                <option value="5">Thứ 6</option>
                <option value="6">Thứ 7</option>
                <option value="0">Chủ nhật</option>
              </select>
              <select name="shift" required>
                <option value="">-- Chọn ca học --</option>
                <option value="sáng">Ca sáng (8:30 - 11:30)</option>
                <option value="chiều">Ca chiều (13:30 - 17:00)</option>
              </select>
              <input name="room" placeholder="Phòng học" required />
              <div>
                <button type="submit">Thêm</button>
                <button type="button" onClick={() => setModal(null)}>Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {modal === 'editSchedule' && editing && (
        <div className="modal-overlay" onClick={() => { setModal(null); setEditing(null); }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Sửa lịch học</h3>
            <form onSubmit={handleUpdateSchedule}>
              <select name="dayOfWeek" defaultValue={editing.dayOfWeek} required>
                <option value="1">Thứ 2</option>
                <option value="2">Thứ 3</option>
                <option value="3">Thứ 4</option>
                <option value="4">Thứ 5</option>
                <option value="5">Thứ 6</option>
                <option value="6">Thứ 7</option>
                <option value="0">Chủ nhật</option>
              </select>
              <input name="startTime" type="time" defaultValue={editing.startTime} required />
              <input name="endTime" type="time" defaultValue={editing.endTime} required />
              <input name="room" placeholder="Phòng học" defaultValue={editing.room} />
              <div><button type="submit">Cập nhật</button><button type="button" onClick={() => { setModal(null); setEditing(null); }}>Hủy</button></div>
            </form>
          </div>
        </div>
      )}
      {confirm && (
        <ConfirmModal title={confirm.title} message={confirm.message} danger={confirm.danger} onConfirm={() => confirm.onConfirm()} onCancel={confirm.onCancel} />
      )}
    </div>
  );
};

export default ClassDetail;
