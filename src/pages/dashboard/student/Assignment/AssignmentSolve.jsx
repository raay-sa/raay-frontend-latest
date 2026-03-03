import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import BackButton from '../../../../components/BackButton';
import QuestionCard from '../../../../components/QuestionCard';
import AssignmentFinishModal from './AssignmentFinishModal';
import AssignmentFailModal from './AssignmentFailModal';
import Modal from '../../../../components/Modals/Modal';
import { ClockIcon } from '@heroicons/react/24/outline';
import StudentAssignmentsService from '../../../../services/student/assignmentsService';
import http from '../../../../services/http';
import { PiWarningCircleDuotone } from 'react-icons/pi';

const ATTEMPT_KEY = 'current-exam-attempt';
const PENDING_KEY = 'pending-exam-submits';
const FLUSH_FLAG = 'flush-exam-pending';

const readJSON = (k, f = null) => { try { const s = localStorage.getItem(k); return s ? JSON.parse(s) : f; } catch { return f; } };
const writeJSON = (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, JSON.stringify(v)); } catch { } };

function durationToSeconds(duration) {
    if (!duration) return 0;
    const s = String(duration).trim();
    if (/^\d+$/.test(s)) return parseInt(s, 10) * 60;
    const m = s.match(/(\d+)\s*دقيقة/);
    if (m) return parseInt(m[1], 10) * 60;
    const mmss = s.match(/^(\d+):(\d{2})$/);
    if (mmss) return parseInt(mmss[1], 10) * 60 + parseInt(mmss[2], 10);
    return 0;
}

function buildNormalizedPayload(examId, uiQuestions, answersMap) {
    const answers = uiQuestions.map(q => {
        const val = answersMap?.[q.id];
        if (q.type === 'essay') {
            const t = (val ?? '').toString().trim();
            return { question_id: q.id, option_id: null, text_answer: t || null };
        }
        let optId = null;
        if (Array.isArray(val)) {
            const first = val[0];
            optId = Number.isInteger(first) ? first : q.options.find(o => o.label === first)?.id ?? null;
        } else if (val != null) {
            optId = Number.isInteger(val) ? val : (q.options.find(o => o.label === val)?.id ?? null);
        }
        return { question_id: q.id, option_id: optId ?? null, text_answer: null };
    });
    return { exam_id: Number(examId), answers };
}

function LeaveConfirmModal({ open, onCancel, onConfirm }) {
    if (!open) return null;
    return (
        <Modal>
            <div className="text-center space-y-4 p-4">
                <PiWarningCircleDuotone className="w-8 h-8 sm:w-10 sm:h-10 mx-auto text-yellow-500" />
                <h2 className="text-lg sm:text-xl font-bold">هل تريد المغادرة؟</h2>
                <p className="text-gray-700 text-sm sm:text-base">إذا غادرت الآن، سيتم إرسال إجاباتك الحالية كما هي.</p>
                <div className="flex flex-col sm:flex-row justify-center gap-3">
                    <button onClick={onCancel} className="px-3 sm:px-4 py-2 rounded-lg bg-gray-200 text-sm sm:text-base">متابعة الاختبار</button>
                    <button onClick={onConfirm} className="px-3 sm:px-4 py-2 rounded-lg bg-primary text-white text-sm sm:text-base">إرسال والمغادرة</button>
                </div>
            </div>
        </Modal>
    );
}

export default function AssignmentSolve() {
    const { examId } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [exam, setExam] = useState(null);

    const [started, setStarted] = useState(false);
    const [answers, setAnswers] = useState({});
    const [timeLeft, setTimeLeft] = useState(0);
    const timerRef = useRef(null);

    const [finishScore, setFinishScore] = useState(null);
    const [failScore, setFailScore] = useState(null);
    const [awaitingModal, setAwaitingModal] = useState(false);

    // Leave-guard modal
    const [leaveOpen, setLeaveOpen] = useState(false);
    const pendingHrefRef = useRef(null); // 'BACK' for back intent, or a path/url

    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                const { data } = await StudentAssignmentsService.getExam(examId);
                setExam(data?.data || null);
                // clear any live attempt for a *previous* session
                writeJSON(ATTEMPT_KEY, null);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        })();
    }, [examId]);

    const uiQuestions = useMemo(() => {
        if (!exam) return [];
        return (exam.questions || []).map(q => {
            let type = 'single';
            if (q.type === 'multiple_choice') type = 'single';
            else if (q.type === 'string') type = 'essay';
            return {
                id: q.id,
                text: q.question,
                type,
                points: q.points ?? 1,
                options: (q.options || []).map(o => ({ id: o.id, label: o.option })),
            };
        });
    }, [exam]);

    const successRate = Number(exam?.success_rate ?? 70);
    const totalQuestions = exam?.questions_count ?? (exam?.questions?.length || 0);

    const startExam = () => {
        if (!exam) return;
        setStarted(true);
        const durationSec = durationToSeconds(exam.duration) || 0;
        setTimeLeft(durationSec);

        // push a state so back button triggers popstate we can intercept
        try { history.pushState({ examLock: true }, '', window.location.href); } catch { }

        writeJSON(ATTEMPT_KEY, {
            started: true,
            examId: Number(examId),
            questions: uiQuestions.map(q => ({ id: q.id, type: q.type === 'essay' ? 'string' : 'multiple_choice', options: q.options })),
            answersMap: {},
            deadlineAt: durationSec ? Date.now() + durationSec * 1000 : null,
        });
    };

    const handleAnswer = (qid, val) => {
        if (!started) return;
        setAnswers(prev => {
            const next = { ...prev, [qid]: val };
            const live = readJSON(ATTEMPT_KEY, null);
            if (live?.examId === Number(examId)) {
                live.answersMap = { ...(live.answersMap || {}), [qid]: val };
                writeJSON(ATTEMPT_KEY, live);
            }
            return next;
        });
    };

    useEffect(() => {
        if (!started || timeLeft <= 0) return;
        timerRef.current = setInterval(() => {
            setTimeLeft(t => {
                const n = t - 1;
                if (n <= 0) {
                    clearInterval(timerRef.current);
                    finishAndSubmit(true);
                    return 0;
                }
                return n;
            });
        }, 1000);
        return () => clearInterval(timerRef.current);
    }, [started, timeLeft]);

    const buildPayload = () => buildNormalizedPayload(examId, uiQuestions, answers);

    const queueSubmit = (payload) => {
        const arr = readJSON(PENDING_KEY, []);
        arr.push({ payload, queuedAt: Date.now() });
        writeJSON(PENDING_KEY, arr);
    };

    const finishAndSubmit = async (auto = false) => {
        const payload = buildPayload();
        try {
            const { data } = await StudentAssignmentsService.submitExam(payload);
            writeJSON(ATTEMPT_KEY, null);

            const body = data?.data || {};
            const grade = body.student_grade_percentage;

            if (grade == null) { setAwaitingModal(true); return; }
            const g = Number(grade);
            if (g >= successRate) setFinishScore(g);
            else setFailScore(g);
        } catch (e) {
            queueSubmit(payload);
            writeJSON(ATTEMPT_KEY, null);
            if (!auto) {
                alert('تم حفظ محاولتك وسيتم إرسالها تلقائياً عند توفر الاتصال.');
                navigate('/student/assignments');
            }
        }
    };

    // --------- LEAVE GUARD (modal + submit) ----------
    useEffect(() => {
        if (!started) return;

        const onDocClick = (e) => {
            const anchor = e.target.closest && e.target.closest('a[href]');
            if (!anchor) return;

            const href = anchor.getAttribute('href');
            if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href === 'javascript:void(0)') return;

            const dest = new URL(href, window.location.origin);
            const current = new URL(window.location.href);

            if (dest.pathname !== current.pathname || dest.search !== current.search) {
                e.preventDefault();
                pendingHrefRef.current = dest.pathname + dest.search + dest.hash;
                setLeaveOpen(true);
            }
        };

        document.addEventListener('click', onDocClick, true);
        return () => document.removeEventListener('click', onDocClick, true);
    }, [started]);

    useEffect(() => {
        if (!started) return;

        const onPop = () => {
            try { history.pushState({ examLock: true }, '', window.location.href); } catch { }
            pendingHrefRef.current = 'BACK';
            setLeaveOpen(true);
        };

        window.addEventListener('popstate', onPop);
        return () => window.removeEventListener('popstate', onPop);
    }, [started]);

    // Refresh/close: native confirm + keepalive submit + queue
    const beforeUnload = (e) => {
        const live = readJSON(ATTEMPT_KEY, null);
        if (!live?.started || live?.examId !== Number(examId)) return;

        // Request the global flusher to run on next app load.
        try { sessionStorage.setItem(FLUSH_FLAG, '1'); } catch { }

        const payload = buildNormalizedPayload(
            live.examId,
            live.questions.map(q => ({ id: q.id, type: q.type === 'string' ? 'essay' : 'single', options: q.options || [] })),
            live.answersMap || {}
        );

        // queue it
        queueSubmit(payload);

        // best-effort immediate POST (use YOUR correct endpoint)
        try {
            const url = `${http.defaults.baseURL}/student/exams`;
            fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...(http.defaults.headers?.common || {}) },
                body: JSON.stringify(payload),
                keepalive: true,
                credentials: 'include',
            }).catch(() => { });
        } catch { }

        e.preventDefault();
        e.returnValue = ''; // show native confirm
    };

    useEffect(() => {
        if (!started) return;
        window.addEventListener('beforeunload', beforeUnload);
        window.addEventListener('pagehide', beforeUnload);
        return () => {
            window.removeEventListener('beforeunload', beforeUnload);
            window.removeEventListener('pagehide', beforeUnload);
        };
    }, [started, examId]);

    const confirmLeave = async () => {
        const payload = buildPayload();
        try { await StudentAssignmentsService.submitExam(payload); }
        catch { queueSubmit(payload); try { sessionStorage.setItem(FLUSH_FLAG, '1'); } catch { } }
        finally { writeJSON(ATTEMPT_KEY, null); }

        const dest = pendingHrefRef.current;
        setLeaveOpen(false);
        pendingHrefRef.current = null;

        if (dest === 'BACK') {
            navigate(-1);
        } else if (dest) {
            if (/^https?:\/\//i.test(dest)) window.location.href = dest;
            else navigate(dest);
        }
    };

    const cancelLeave = () => {
        setLeaveOpen(false);
        pendingHrefRef.current = null;
    };
    // -----------------------------------------------

    const openLeaveTo = (path) => {
        pendingHrefRef.current = path;
        setLeaveOpen(true);
    };

    const goToReview = () => {
        setFinishScore(null);
        setFailScore(null);
        navigate(`/student/assignments/exams/${examId}/review`, { state: { fetchSolution: true } });
    };

    if (loading) return <div className="p-3 lg:p-6">جاري التحميل…</div>;
    if (!exam) return <div className="p-3 lg:p-6 text-red-600">تعذر تحميل الاختبار</div>;

    const mm = Math.floor(timeLeft / 60).toString().padStart(2, '0');
    const ss = Math.max(0, timeLeft % 60).toString().padStart(2, '0');

    return (
        <div className="p-3 lg:p-6 mx-auto space-y-4 lg:space-y-6 bg-white">
            <BackButton to="/student/assignments" />

            <div>
                <h1 className="text-xl sm:text-2xl font-bold">اختبار: {exam.title}</h1>
                <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500 items-center">
                    <span className="bg-[#F0F0F0] py-1 px-2 rounded-xl">
                        <ClockIcon className="w-3 h-3 sm:w-4 sm:h-4 inline" />
                        المدة: {exam.duration ?? '—'}
                    </span>
                    <span className="bg-[#F0F0F0] py-1 px-2 rounded-xl">عدد الأسئلة: {totalQuestions}</span>
                    <span className="bg-[#F0F0F0] py-1 px-2 rounded-xl">نسبة النجاح المطلوبة: {successRate}%</span>
                    {started && <span className="ml-auto bg-black text-white py-1 px-2 sm:px-3 rounded-lg font-bold text-sm sm:text-base">{mm}:{ss}</span>}
                </div>
            </div>

            {!started && (
                <div className="bg-[#FFF8E1] border border-[#FFE9A8] rounded-lg p-3 sm:p-4">
                    <p className="mb-3 text-sm sm:text-base">لن تتمكن من الإجابة حتى تضغط "ابدأ الاختبار".</p>
                    <button onClick={startExam} className="px-4 sm:px-6 py-2 bg-primary text-white rounded-lg text-sm sm:text-base">ابدأ الاختبار</button>
                </div>
            )}

            <div className={`space-y-4 lg:space-y-6 relative ${started ? '' : 'pointer-events-none select-none'}`}>
                {!started && (
                    <div className="absolute inset-0 rounded-lg bg-white/40 backdrop-blur-sm z-10 flex items-center justify-center">
                        <span className="text-gray-700 font-medium text-sm sm:text-base">ابدأ الاختبار لعرض الأسئلة</span>
                    </div>
                )}
                <div className={`${started ? '' : 'blur-sm'} space-y-4 lg:space-y-6`}>
                    {uiQuestions.map((q, idx) => (
                        <QuestionCard
                            key={q.id}
                            q={{ id: q.id, text: q.text, type: q.type, options: q.options.map(o => o.label), points: q.points }}
                            value={answers[q.id]}
                            number={idx + 1}
                            onChange={handleAnswer}
                        />
                    ))}
                </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
                <button
                    disabled={!started}
                    onClick={() => finishAndSubmit(false)}
                    className={`px-4 sm:px-6 py-2 rounded-lg text-white text-sm sm:text-base ${started ? 'bg-primary' : 'bg-gray-400 cursor-not-allowed'}`}
                >
                    إنهاء الاختبار
                </button>
                {!started && <span className="text-xs sm:text-sm text-gray-500">ابدأ الاختبار أولاً</span>}
            </div>

            {finishScore !== null && (
                <AssignmentFinishModal
                    score={finishScore}
                    onClose={() => setFinishScore(null)}
                    onReview={goToReview}
                    onLeave={() => openLeaveTo('/student/courses')}
                />
            )}
            {failScore !== null && (
                <AssignmentFailModal
                    score={failScore}
                    onClose={() => setFailScore(null)}
                    onReview={goToReview}
                    onRetry={() => setFailScore(null)}
                    onLeave={() => openLeaveTo('/student/courses')}
                />
            )}

            {awaitingModal && (
                <Modal>
                    <div className="text-center space-y-4 p-4">
                        <img src="/images/success.png" className="w-1/2 mx-auto" alt="submitted" />
                        <h2 className="text-lg sm:text-xl font-semibold">
                            تم استلام إجاباتك، وسيتم التصحيح من قبل الخبير. سنبلغك فور اكتمال التقييم.
                        </h2>
                        <button
                            className="px-3 sm:px-4 py-2 bg-primary text-white rounded-lg text-sm sm:text-base"
                            onClick={() => openLeaveTo('/student/assignments')}
                        >
                            عودة إلى المهام والاختبارات
                        </button>
                    </div>
                </Modal>
            )}

            <LeaveConfirmModal
                open={leaveOpen}
                onCancel={cancelLeave}
                onConfirm={confirmLeave}
            />
        </div>
    );
}
