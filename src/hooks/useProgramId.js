// src/pages/dashboard/Shared/Course/hooks/useProgramId.js
import { useParams, useSearchParams } from "react-router-dom";

export default function useProgramId() {
  const params = useParams();
  const [search] = useSearchParams();
  return (
    params.id ||
    params.programId ||
    params.courseId ||
    search.get("id") ||
    search.get("program_id") ||
    null
  );
}
