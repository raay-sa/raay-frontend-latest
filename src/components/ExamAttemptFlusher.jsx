import { useEffect } from "react";
import StudentAssignmentsService from "../services/student/assignmentsService";

const PENDING_KEY = "pending-exam-submits";
const FLUSH_FLAG = "flush-exam-pending";

const readJSON = (k, f = null) => {
    try {
        const s = localStorage.getItem(k);
        return s ? JSON.parse(s) : f;
    } catch {
        return f;
    }
};
const writeJSON = (k, v) => {
    try {
        v == null
            ? localStorage.removeItem(k)
            : localStorage.setItem(k, JSON.stringify(v));
    } catch { }
};

export default function ExamAttemptFlusher() {
    useEffect(() => {
        // Only flush if the exam page requested it before unload
        const shouldFlush = sessionStorage.getItem(FLUSH_FLAG) === "1";
        const queue = readJSON(PENDING_KEY, []);

        if (!shouldFlush || !Array.isArray(queue) || queue.length === 0) return;

        (async () => {
            const remain = [];
            for (const item of queue) {
                const payload = item?.payload;
                // basic payload sanity
                if (
                    !payload ||
                    typeof payload.exam_id !== "number" ||
                    !Array.isArray(payload.answers)
                ) {
                    continue;
                }

                try {
                    await StudentAssignmentsService.submitExam(payload);
                    // success → drop from queue
                } catch (e) {
                    // keep only on network/5xx to retry later; drop 4xx like 422 to avoid loops
                    const status = e?.response?.status;
                    if (!status || status >= 500) {
                        remain.push(item);
                    }
                    // else ignore (likely already submitted / validation), don’t requeue
                }
            }

            writeJSON(PENDING_KEY, remain.length ? remain : null);
            sessionStorage.removeItem(FLUSH_FLAG);
        })();
    }, []);

    return null;
}
