// src/hooks/useProgramReport.js
import { useState, useEffect, useCallback } from "react";
import TraineesService from "../services/admin/traineesService";

export default function useProgramReport(programId, initialPage = 1) {
  const [program, setProgram] = useState(null);
  const [students, setStudents] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(initialPage);

  const fetchReport = useCallback(async (pageNum = 1) => {
    if (!programId) return;
    
    setLoading(true);
    try {
      const response = await TraineesService.getProgramReport(programId, { page: pageNum });
      const payload = response?.data || {};
      
      // Set program data - the API response structure is response.data.data.program
      if (payload.data?.program) {
        setProgram(payload.data.program);
      }
      
      // Set students data with pagination - the API response structure is response.data.data.subscriptions
      if (payload.data?.subscriptions) {
        const studentsData = payload.data.subscriptions.data || [];
        const studentsMeta = payload.data.subscriptions;
        
        // Transform students data
        const transformedStudents = studentsData.map((student, index) => ({
          id: student.id,
          idx: (pageNum - 1) * (studentsMeta.per_page || 10) + index + 1,
          name: student.name || '',
          email: student.email || '',
          phone: student.phone || '',
          image: student.image,
          type: student.type || 'trainee',
          programs_count: student.programs_count || 0,
          reviews_count: student.reviews_count || 0,
          assignments_status: student.assignments_status || 'not_started',
          assignments_progress: student.assignments_progress || 0,
          exam_score: student.exam_score || 0,
          student_progress: student.student_progress || 0,
          raw: student,
        }));
        
        setStudents(transformedStudents);
        setPagination({
          current_page: studentsMeta.current_page || 1,
          last_page: studentsMeta.last_page || 1,
          per_page: studentsMeta.per_page || 10,
          total: studentsMeta.total || 0,
        });
      }
    } catch (error) {
      console.error("Error fetching program report:", error);
      setProgram(null);
      setStudents([]);
      setPagination({});
    } finally {
      setLoading(false);
    }
  }, [programId]);

  useEffect(() => {
    fetchReport(page);
  }, [fetchReport, page]);

  const refetch = useCallback(() => {
    fetchReport(page);
  }, [fetchReport, page]);

  return {
    program,
    students,
    pagination,
    loading,
    page,
    setPage,
    refetch,
  };
}
