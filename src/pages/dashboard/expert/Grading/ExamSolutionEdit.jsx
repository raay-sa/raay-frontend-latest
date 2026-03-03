import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import PageSkeleton from '../../../../components/Loaders/PageSkeleton';
import { gradingService } from '../../../../services/teacher/gradingService';

export default function TeacherExamSolutionEdit() {
  const { solutionId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [row, setRow] = useState(null);

  // points map: { [question_id]: number }
  const [points, setPoints] = useState({});

  useEffect(() => {
    (async () => {
      try {
        const { data } = await gradingService.getExamSolution(solutionId);
        const r = data?.data || null;
        setRow(r);

        // prefill only essay/string (manual) questions
        const essayIds = new Set((r?.exam?.questions || []).filter(q => q.type === 'string').map(q => q.id));
        const init = {};
        (r?.answers || []).forEach(a => {
          if (essayIds.has(a.question_id)) init[a.question_id] = Number(a.points ?? 0);
        });
        setPoints(init);
      } finally {
        setLoading(false);
      }
    })();
  }, [solutionId]);

  const manualQuestions = useMemo(() => {
    const qById = new Map((row?.exam?.questions || []).map(q => [q.id, q]));
    return (row?.answers || [])
      .filter(a => (qById.get(a.question_id)?.type === 'string'))
      .map(a => ({
        qid: a.question_id,
        text: qById.get(a.question_id)?.question || '',
        max: Number(qById.get(a.question_id)?.points ?? 0),
        studentAnswer: a.text_answer ?? '',
        current: Number(points[a.question_id] ?? 0),
      }));
  }, [row, points]);

  const onSave = async () => {
    // build payload
    const questions = manualQuestions.map(mq => ({
      id: mq.qid,
      points: Number(points[mq.qid] ?? 0),
    }));
    await gradingService.gradeExamSolution(solutionId, questions);
    navigate('/teacher/assessments/exams');
  };

  if (loading) return <PageSkeleton />;
  if (!row) return <div className="p-6 text-red-600">تعذر تحميل حل الاختبار</div>;

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">تقييم اختبار</h2>
        <Link className="text-primary underline" to="/teacher/assessments/exams">عودة للقائمة</Link>
      </div>

      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        {/* Header info */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-500">الطالب</div>
            <div className="font-semibold">{row?.student?.name || '—'}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">الاختبار</div>
            <div className="font-semibold">{row?.exam?.title || '—'}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">البرنامج</div>
            <div className="font-semibold">{row?.exam?.program?.title || '—'}</div>
          </div>
        </div>

        {/* Manual grading fields */}
        <div className="pt-4 space-y-4">
          <h3 className="font-semibold">الأسئلة المقاليّة (تُقيَّم يدوياً)</h3>

          {manualQuestions.length === 0 && (
            <div className="text-gray-600">لا توجد أسئلة مقالية في هذا الاختبار.</div>
          )}

          {manualQuestions.map((mq) => (
            <div key={mq.qid} className="border rounded-lg p-4 space-y-2">
              <div className="font-semibold">{mq.text}</div>
              <div className="text-sm text-gray-600">
                إجابة الطالب: <span className="font-medium text-gray-800">{mq.studentAnswer || '—'}</span>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-600">الدرجة</label>
                <input
                  type="number"
                  value={points[mq.qid] ?? 0}
                  onChange={(e) => setPoints(p => ({ ...p, [mq.qid]: e.target.value }))}
                  className="border rounded-lg px-3 py-2 w-32"
                  min={0}
                  max={mq.max}
                />
                <span className="text-xs text-gray-500">الحد الأقصى: {mq.max}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={onSave} className="bg-primary text-white px-4 py-2 rounded-lg">حفظ</button>
          <button onClick={() => navigate(-1)} className="bg-gray-100 px-4 py-2 rounded-lg">إلغاء</button>
        </div>
      </div>
    </div>
  );
}
