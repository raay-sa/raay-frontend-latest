import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { StarIcon as StarSolid } from "@heroicons/react/24/solid";
import { ClockIcon, PlayIcon } from "@heroicons/react/24/outline";
import StudentProgramsService from "../../../services/student/programsService";

const BASE_URL = import.meta.env.VITE_BASE_URL || "";
const IS_DEV = import.meta.env.DEV;
const BACKEND = (import.meta.env.VITE_BASE_URL || "").replace(/\/$/, "");

// Join a base and a (possibly relative) path
const joinUrl = (base, path) => {
    if (!path) return "";
    if (/^https?:\/\//i.test(path)) return path;
    return `${String(base).replace(/\/+$/, "")}/${String(path).replace(/^\/+/, "")}`;
};

// In dev, convert absolute backend URLs to proxied same-origin paths (so CORS is avoided)
const toDevProxyUrl = (absUrl) => {
    if (!IS_DEV || !absUrl) return absUrl;
    // Only rewrite if the URL starts with your backend origin
    if (BACKEND && absUrl.startsWith(BACKEND)) {
        const path = absUrl.slice(BACKEND.length);
        return path.startsWith("/") ? path : `/${path}`;
    }
    return absUrl;
};

const toNumber = (v, d = 0) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : d;
};

export default function CertificateViewer() {
    const { programId } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [pdfUrl, setPdfUrl] = useState("");     // object URL or (possibly proxied) absolute URL
    const [meta, setMeta] = useState(null);       // certificate meta (may include program)
    const [program, setProgram] = useState(null); // program details for left card
    const [error, setError] = useState("");

    // revoke object url on unmount
    useEffect(() => {
        return () => {
            if (pdfUrl && pdfUrl.startsWith("blob:")) URL.revokeObjectURL(pdfUrl);
        };
    }, [pdfUrl]);

    useEffect(() => {
        let alive = true;

        (async () => {
            setLoading(true);
            setError("");

            try {
                // 1) Try existing certificate
                const res = await StudentProgramsService.getProgramCertificate(programId);
                const cert = res?.data?.certificate;
                if (cert?.file_path) {
                    const abs = joinUrl(BASE_URL, cert.file_path);  // e.g. https://backend.../storage/...
                    const url = toDevProxyUrl(abs);                 // in dev -> /storage/...
                    if (!alive) return;
                    setMeta(cert);
                    setPdfUrl(url);
                } else {
                    throw new Error("No certificate file yet, generating…");
                }
            } catch {
                // 2) Generate if needed (PDF blob) — avoids CORS since responseType=blob via axios
                try {
                    const gen = await StudentProgramsService.generateCertificate(programId);
                    const blob = gen?.data;
                    const url = URL.createObjectURL(blob);
                    if (!alive) return;
                    setMeta(null);
                    setPdfUrl(url);
                } catch {
                    if (!alive) return;
                    setError("تعذر تحميل/إنشاء الشهادة الآن.");
                }
            } finally {
                if (alive) setLoading(false);
            }
        })();

        return () => { alive = false; };
    }, [programId]);

    // Hydrate program for the left card (from meta if present; otherwise fetch)
    useEffect(() => {
        let alive = true;

        (async () => {
            if (meta?.program) {
                // prefer meta program
                const p = meta.program;
                if (!alive) return;
                setProgram({
                    ...p,
                    image: joinUrl(BASE_URL, p.image),
                    teacher: p.teacher || null,
                });
                return;
            }

            try {
                const res = await StudentProgramsService.getOne(programId);
                const d = res?.data?.data || {};
                if (!alive) return;
                setProgram({
                    ...d,
                    image: joinUrl(BASE_URL, d.image),
                    teacher: d.teacher || null,
                });
            } catch {
                // ignore; card minimal
            }
        })();

        return () => { alive = false; };
    }, [meta, programId]);

    const filename = useMemo(() => {
        if (program?.title) return `certificate-${program.title}.pdf`;
        return `certificate-program-${programId}.pdf`;
    }, [program?.title, programId]);

    const ratingAvg = useMemo(() => {
        const v = program?.reviews_avg_score != null ? parseFloat(program.reviews_avg_score) : 0;
        return Number.isFinite(v) ? v : 0;
    }, [program]);

    const handleDownload = async () => {
        if (!pdfUrl) return;

        try {
            // If it's a blob URL (we just generated), download directly
            if (pdfUrl.startsWith("blob:")) {
                const a = document.createElement("a");
                a.href = pdfUrl;
                a.download = filename;
                a.click();
                return;
            }

            // If it's an absolute backend URL and we're in dev, use the proxied path to avoid CORS
            const urlForFetch = toDevProxyUrl(pdfUrl);

            // Fetch then download
            const resp = await fetch(urlForFetch);
            if (!resp.ok) throw new Error("download failed");
            const blob = await resp.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
        } catch {
            // Fallback: call the generate endpoint which returns a Blob (works both dev/prod)
            try {
                const gen = await StudentProgramsService.generateCertificate(programId);
                const blob = gen?.data;
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = filename;
                a.click();
                URL.revokeObjectURL(url);
            } catch {
                // Silent — you could toast here
            }
        }
    };

    if (loading) {
        return (
            <div className="p-3 lg:p-8 flex items-center justify-center min-h-[60vh] text-gray-600 text-sm sm:text-base">
                جاري التحميل…
            </div>
        );
    }

    if (error || !pdfUrl) {
        return (
            <div className="p-3 lg:p-8 flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <p className="text-red-600 text-sm sm:text-base">{error || "لا توجد شهادة متاحة."}</p>
                <button
                    onClick={() => navigate(-1)}
                    className="px-4 sm:px-5 py-2 bg-primary text-white rounded-lg text-sm sm:text-base"
                >
                    رجوع
                </button>
            </div>
        );
    }

    // FIGMA-like layout: left info card, right gray canvas with white PDF sheet
    return (
        <div className="p-3 sm:p-4 md:p-6 lg:p-8">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 lg:gap-6">
                {/* LEFT: Info Card */}
                <main className="md:col-span-9">
                    <div className="bg-[#F2F4F7] rounded-2xl border shadow-inner min-h-[50vh] sm:min-h-[60vh] lg:min-h-[70vh] flex items-stretch justify-center">
                        <div className="m-3 sm:m-6 bg-white rounded-xl shadow w-full">
                            <object
                                data={pdfUrl} // already proxied in dev
                                type="application/pdf"
                                className="w-full h-[45vh] sm:h-[60vh] lg:h-[78vh] rounded-xl"
                            >
                                <div className="h-[45vh] sm:h-[60vh] lg:h-[78vh] flex flex-col items-center justify-center text-gray-600 p-4">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="w-12 h-12 sm:w-16 sm:h-16 mb-3"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                    >
                                        <path d="M15 3H6a2 2 0 0 0-2 2v14l3-2 3 2 3-2 3 2V3z" />
                                        <circle cx="17.5" cy="7.5" r="2.5" />
                                        <path d="M17.5 10v4" />
                                    </svg>
                                    <p className="text-xs sm:text-sm text-center">
                                        لا يدعم المتصفح عرض ملفات PDF داخل الصفحة.
                                        {" "}
                                        <a href={pdfUrl} target="_blank" rel="noreferrer" className="text-primary underline">
                                            افتح الشهادة هنا
                                        </a>
                                    </p>
                                </div>
                            </object>
                        </div>
                    </div>
                </main>

                {/* RIGHT: PDF Canvas */}
                <aside className="md:col-span-3">
                    <div className="bg-white rounded-2xl shadow border overflow-hidden">
                        <div className="px-3 sm:px-5 pt-3 sm:pt-5 pb-2 sm:pb-3 border-b">
                            <h3 className="text-base sm:text-lg font-bold">الشهادة</h3>
                        </div>

                        <div className="px-3 sm:px-5 py-3 sm:py-4 flex items-center gap-2 sm:gap-3">
                            <img
                                src={
                                    program?.teacher?.image
                                        ? joinUrl(BASE_URL, program.teacher.image)
                                        : "/thumbnails/avatar.png"
                                }
                                alt={program?.teacher?.name || "teacher"}
                                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover"
                            />
                            <div>
                                <p className="text-xs sm:text-sm font-semibold">{program?.teacher?.name || "—"}</p>
                                <p className="text-xs text-gray-500">حول البرنامج تدريبي:</p>
                            </div>
                        </div>

                        <div className="px-3 sm:px-5">
                            <div className="rounded-xl overflow-hidden bg-gray-100">
                                {program?.image ? (
                                    <img
                                        src={program.image}
                                        alt={program?.title || "course"}
                                        className="w-full h-32 sm:h-48 object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-32 sm:h-48" />
                                )}
                            </div>
                        </div>

                        <div className="px-3 sm:px-5 pt-2 sm:pt-3">
                            <h4 className="font-bold text-xs sm:text-sm leading-5 sm:leading-6">
                                {program?.title || "—"}
                            </h4>
                            <p className="text-xs text-gray-500">
                                {program?.teacher?.name || ""}
                            </p>
                        </div>

                        <div className="px-3 sm:px-5 pt-2 text-xs text-gray-600 flex flex-wrap items-center gap-x-2 sm:gap-x-4 gap-y-1">
                            <span className="flex items-center gap-1">
                                ({toNumber(program?.reviews_count, 0)} تقييم){" "}
                                <span className="font-medium">{ratingAvg.toFixed(1)}</span>
                                <StarSolid className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400" />
                            </span>
                            <span className="flex items-center gap-1">
                                <ClockIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                                {program?.program_duration || "0:00"}
                            </span>
                            <span className="flex items-center gap-1">
                                <PlayIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                                {toNumber(program?.video_count, 0)} فيديو
                            </span>
                        </div>

                        <div className="px-3 sm:px-5 pt-1 pb-2 sm:pb-3 text-xs sm:text-sm font-bold text-gray-800 flex items-center gap-1">
                            <span className="text-sm sm:text-[15px]">﷼</span>
                            {toNumber(program?.price, 0)}
                        </div>

                        <div className="px-3 sm:px-5 pb-3 sm:pb-5">
                            <button
                                onClick={handleDownload}
                                className="w-full h-8 sm:h-10 rounded-lg bg-primary text-white text-xs sm:text-sm font-medium"
                            >
                                تحميل
                            </button>
                        </div>
                    </div>
                </aside>

            </div>
        </div>
    );
}
