// src/pages/dashboard/hooks/useActivities.js
import { useEffect, useState } from "react";
import StudentAssignmentsService from "../services/student/assignmentsService";
import { mapAssignment, mapExam } from "../utils";

export default function useActivities(programId) {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!programId) return;
    (async () => {
      try {
        setLoading(true);
        const { data } = await StudentAssignmentsService.list({
          per_page: 50,
          "programs_id[]": [Number(programId)],
        });
        const assignments = (data?.data?.assignments?.data || []).map(
          mapAssignment
        );
        const exams = (data?.data?.exams?.data || []).map(mapExam);
        setItems([...assignments, ...exams]);
      } finally {
        setLoading(false);
      }
    })();
  }, [programId]);

  return { loading, items };
}
