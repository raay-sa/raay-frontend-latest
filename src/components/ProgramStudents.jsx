// src/components/ProgramStudents.jsx
import React, { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DataTable from "./DataTable";
import Filter from "./Filter";
import useProgramStudents from "../hooks/useProgramStudents";
import StudentActionDropdown from "./StudentActionDropdown";
import StudentActionModal from "./StudentActionModal";
import TraineesService from "../services/admin/traineesService";
import toast from "react-hot-toast";

const AR = {
    assignments: {
        completed: "مكتملة",
        not_completed: "غير مكتملة",
        not_started: "لم يبدأ",
    },
};

const badge = (text, color) => (
    <span
        className={`text-xs px-2 py-1 rounded-md ${color === "green"
            ? "bg-green-100 text-green-700"
            : color === "amber"
                ? "bg-amber-100 text-amber-700"
                : color === "gray"
                    ? "bg-gray-100 text-gray-600"
                    : "bg-red-100 text-red-700"
            }`}
    >
        {text}
    </span>
);

export default function ProgramStudents({ userType = "admin", programTitle = "" }) {
    const { id: programId } = useParams();
    const navigate = useNavigate();

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedAction, setSelectedAction] = useState(null);
    const [selectedStudent, setSelectedStudent] = useState(null);

    // Data from API
    const { data: rows, meta, loading, setPage, refetch } = useProgramStudents(
        programId,
        userType,
        1,
        { search: "" }
    );

    // Handle action selection
    const handleActionSelect = (actionType, student) => {
        setSelectedAction(actionType);
        setSelectedStudent(student);
        setModalOpen(true);
    };

    // Handle action confirmation
    const handleActionConfirm = async (actionType, message, student) => {
        try {
            const payload = {
                type: actionType,
                body: message,
                student_id: student.id,
                program_id: parseInt(programId)
            };

            await TraineesService.sendStudentWarning(payload);
            
            const actionLabels = {
                warning: 'تحذير',
                alert: 'تنبيه',
                ban: 'استبعاد'
            };
            
            toast.success(`تم إرسال ${actionLabels[actionType]} بنجاح`);
            
            // Refresh the data to get updated has_warning_before status
            await refetch();
        } catch (error) {
            console.error('Error sending warning:', error);
            toast.error('تعذر إرسال الإجراء');
            throw error;
        }
    };

    // Handle modal close
    const handleModalClose = () => {
        setModalOpen(false);
        setSelectedAction(null);
        setSelectedStudent(null);
    };


    // Table columns
    const columns = useMemo(
        () => [
            { header: "#", accessor: "idx" },
            {
                header: "صورة المتدرب",
                accessor: "image",
                Cell: (img) => (
                    <img
                        src={
                            img
                                ? `${import.meta.env.VITE_BASE_URL}/${img}`
                                : "/images/avatar.png"
                        }
                        alt=""
                        className="w-12 h-12 rounded-lg object-cover"
                    />
                ),
            },
            { header: "اسم المتدرب", accessor: "name" },
            { header: "البريد الإلكتروني", accessor: "email" },
            { header: "رقم الهاتف", accessor: "phone" },
            {
                header: "نوع المستخدم",
                accessor: "type",
                Cell: (v) => badge(v === "trainee" ? "متدرب" : v, "gray"),
            },
            {
                header: "عدد البرامج",
                accessor: "programs_count",
                Cell: (v) => v || 0,
            },
            {
                header: "نسبة الإنجاز",
                accessor: "student_progress",
                Cell: (v) => (
                    <span className={`px-2 py-1 text-xs rounded-full ${v >= 80 ? 'bg-green-100 text-green-600' :
                        v >= 60 ? 'bg-yellow-100 text-yellow-600' :
                            v >= 40 ? 'bg-orange-100 text-orange-600' :
                                'bg-red-100 text-red-600'
                        }`}>
                        {v}%
                    </span>
                ),
            },
        ],
        []
    );

    return (
        <div className="p-3 lg:p-6 space-y-4 lg:space-y-6" dir="rtl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl lg:text-2xl font-bold">طلاب البرنامج</h1>
                    {programTitle && (
                        <p className="text-sm text-gray-600 mt-1">{programTitle}</p>
                    )}
                </div>
                <button
                    onClick={() => navigate(-1)}
                    className="px-3 sm:px-4 py-2 border rounded-lg text-sm sm:text-base"
                >
                    رجوع
                </button>
            </div>

            {/* Search */}
            {/* <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <Filter
                    filterGroups={filterGroups}
                    filters={filters}
                    onFiltersChange={(next) => {
                        setFilters(prev => ({ ...prev, ...next }));
                        setPage(1);
                    }}
                    searchText={searchText}
                    onSearchChange={setSearchText}
                />
            </div> */}

            {/* Table */}
            <DataTable
                data={rows}
                columns={columns}
                loading={loading}
                selectable={false}
                showActions={userType === "admin"}
                renderRowActions={(row) => (
                    userType === "admin" ? (
                        <StudentActionDropdown
                            student={row.raw}
                            onActionSelect={handleActionSelect}
                        />
                    ) : null
                )}
                serverPagination={{
                    currentPage: meta.current_page || 1,
                    totalPages: meta.last_page || 1,
                    onPageChange: setPage,
                }}
                bulkActions={() => null}
            />

            {/* Action Modal */}
            <StudentActionModal
                isOpen={modalOpen}
                onClose={handleModalClose}
                onConfirm={handleActionConfirm}
                actionType={selectedAction}
                student={selectedStudent}
            />
        </div>
    );
}
