import React, { Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import StudentLayout from './components/Layout/StudentLayout';
import ExpertLayout from './components/Layout/ExpertLayout';
import AdminLayout from './components/Layout/AdminLayout';

// ADMIN pages
import AdminDashboard from './pages/dashboard/admin/Dashboard';
import AdminAccounts from './pages/dashboard/admin/Account_Managment/Accounts';
import CreateStudent from './pages/dashboard/admin/Account_Managment/CreateStudent';
import EditStudent from './pages/dashboard/admin/Account_Managment/EditStudent';
import CreateExpert from './pages/dashboard/admin/Account_Managment/CreateExpert';
import EditExpert from './pages/dashboard/admin/Account_Managment/EditExpert';
import AdminTraineesList from './pages/dashboard/admin/Trainees/List';
import AdminTraineeCreate from './pages/dashboard/admin/Trainees/Create';
import AdminTraineeEdit from './pages/dashboard/admin/Trainees/Edit';
import AdminPrograms from './pages/dashboard/admin/Programs/List';
import AdminProgramRequests from './pages/dashboard/admin/Programs/Requests';
import AdminProgramRequestDetails from './pages/dashboard/admin/Programs/RequestDetails';
import AdminProgramStudents from './pages/dashboard/admin/Programs/Students';
import AdminProgramReport from './pages/dashboard/admin/Programs/Report';
import AdminOrders from './pages/dashboard/admin/Orders';
import AdminReviews from './pages/dashboard/admin/Reviews/Reviews';
import AdminReports from './pages/dashboard/admin/Reports';
import AdminNotifications from './pages/dashboard/admin/Notifications/list';
import NotificationCreate from './pages/dashboard/admin/Notifications/Create';
import NotificationEdit from './pages/dashboard/admin/Notifications/Edit';
import PreviewEvaluationForm from './pages/dashboard/admin/Reviews/PreviewEvaluationForm';
import AdminSettings from './pages/dashboard/admin/Settings';
import AdminFAQ from './pages/dashboard/admin/Faqs/List';
import FaqCreate from './pages/dashboard/admin/Faqs/Create';
import FaqEdit from './pages/dashboard/admin/Faqs/Edit';
import LiveStreamingControl from './pages/dashboard/admin/LiveStreamingControl';

// STUDENT pages
import StudentDashboard from './pages/dashboard/student/Dashboard';
import Courses from './pages/dashboard/Shared/Course/Courses';
import CourseDetails from './pages/dashboard/Shared/Course/CourseDetails'
import CourseOverview from './pages/dashboard/student/CourseOverview';
import AssignmentsList from './pages/dashboard/student/Assignment/AssignmentsList';
import AssignmentDetail from './pages/dashboard/student/Assignment/AssignmentDetail';
import AssignmentSolve from './pages/dashboard/student/Assignment/AssignmentSolve';
import AssignmentReview from './pages/dashboard/student/Assignment/AssignmentReview';
import Cart from './pages/dashboard/student/Cart';
import Favorites from './pages/dashboard/student/Favourite';
import StudentSettings from './pages/dashboard/Shared/Settings';
import StudentFAQ from './pages/dashboard/Shared/Faqs';
import LoginPage from './pages/auth/LoginPage';
import QuickLoginPage from './pages/auth/QuickLoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import OTPPage from './pages/auth/OTPPage';
import SuccessPage from './pages/auth/SuccessPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// EXPERT pages
import ExpertDashboard from './pages/dashboard/expert/Dashboard';
import ExpertSettings from './pages/dashboard/Shared/Settings';
import ExpertFAQ from './pages/dashboard/Shared/Faqs';
import CreateProgramPage from './pages/dashboard/expert/Program/CreateProgramPage';
import EditProgramPage from './pages/dashboard/expert/Program/EditProgramPage';
import PageSkeleton from './components/Loaders/PageSkeleton';
import Assignments from './pages/dashboard/expert/Assignment/Assignments';
import Reports from './pages/dashboard/expert/Reports';
import Support from './pages/dashboard/Shared/Support';
import AssignmentsCreateEdit from './pages/dashboard/expert/Assignment/AssignmentsCreateEdit';
import TeacherExamShow from './pages/dashboard/expert/Assignment/ExamShow';
import TeacherAssignmentShow from './pages/dashboard/expert/Assignment/AssignmentShow';
import TeacherCourseDetails from './pages/dashboard/expert/Program/TeacherCourseDetails';
import CategoriesList from './pages/dashboard/admin/Categories/List';
import CategoryEdit from './pages/dashboard/admin/Categories/Edit';
import CategoryCreate from './pages/dashboard/admin/Categories/Create';
import ProgramsEdit from './pages/dashboard/admin/Programs/Edit';
import ProgramsList from './pages/dashboard/admin/Programs/List';
import AdminCreateProgram from './pages/dashboard/admin/Programs/Create';
import TeacherGoLive from './pages/dashboard/expert/Live/GoLive';
import StudentWatchLive from './pages/dashboard/student/Live/Watch';
import SectionsManager from './pages/dashboard/expert/Program/SectionsManager';
import TeacherProgramStudents from './pages/dashboard/expert/Programs/Students';
import TeacherAssignmentSolutionsPage from './pages/dashboard/expert/Grading/AssignmentSolutionsPage';
import TeacherExamSolutionsPage from './pages/dashboard/expert/Grading/ExamSolutionsPage';
import TeacherAssignmentSolutionEdit from './pages/dashboard/expert/Grading/AssignmentSolutionEdit';
import TeacherExamSolutionEdit from './pages/dashboard/expert/Grading/ExamSolutionEdit';
import StudentEvaluationForm from './pages/dashboard/student/StudentEvaluationForm';
import ExamAttemptFlusher from './components/ExamAttemptFlusher';
import RegisterRequests from './pages/dashboard/admin/Account_Managment/RegisterRequests';
import TokenLogin from './pages/auth/TokenLogin';
import ShowExpert from './pages/dashboard/admin/Account_Managment/ShowExpert';
import StudentCertificates from './pages/dashboard/student/Certificates';
import StudentMyCourses from './pages/dashboard/student/MyCourses';
import StudentInvoices from './pages/dashboard/admin/Invoices/List';
import StudentInvoiceShow from './pages/dashboard/admin/Invoices/Show';
import CertificateViewer from './pages/dashboard/student/CertificateViewer';
import MyInterests from './pages/dashboard/student/MyInterests';
import BannerSlider from './components/BannerSlider';
import AdminBannersList from './pages/dashboard/admin/Banners/List';
import CreateBanner from './pages/dashboard/admin/Banners/Create';
import EditBanner from './pages/dashboard/admin/Banners/Edit';
import InterestedStudents from './pages/dashboard/admin/Banners/InterestedStudents';
import CompanyRequestsList from './pages/dashboard/admin/CompanyRequests/List';
import CompanyRequestShow from './pages/dashboard/admin/CompanyRequests/Show';
import ConsultantShow from './pages/dashboard/admin/Consultants/Show';
import ConsultantsList from './pages/dashboard/admin/Consultants/List';
import SkillEdit from './pages/dashboard/admin/Skills/Edit';
import SkillShow from './pages/dashboard/admin/Skills/Show';
import SkillCreate from './pages/dashboard/admin/Skills/Create';
import SkillsList from './pages/dashboard/admin/Skills/List';
import ContactUsShow from './pages/dashboard/admin/ContactUs/Show';
import ContactUsList from './pages/dashboard/admin/ContactUs/List';
import ConsultingShow from './pages/dashboard/admin/Consulting/Show';
import ConsultingList from './pages/dashboard/admin/Consulting/List';
import WorkshopsList from './pages/dashboard/admin/Workshops/List';
import WorkshopShow from './pages/dashboard/admin/Workshops/Show';
import ManagersList from './pages/dashboard/admin/Managers/List';
import ManagerCreate from './pages/dashboard/admin/Managers/Create';
import ManagerEdit from './pages/dashboard/admin/Managers/Edit';

import { Toaster } from 'react-hot-toast';
import { PushNotificationsProvider } from './contexts/PushNotificationsContext';

function RedirectWithQuery({ to }) {
  const location = useLocation();
  const search = location.search || '';
  return <Navigate to={`${to}${search}`} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <ExamAttemptFlusher />

      <Toaster
        position="top-right"
        containerStyle={{ direction: 'rtl' }}
        toastOptions={{
          className: 'rtl text-sm',
          duration: 5000,
          success: {
            className: 'rtl bg-white text-gray-900 border border-green-200',
          },
          error: {
            className: 'rtl bg-white text-gray-900 border border-red-200',
          },
        }}
      />

      {/* Pusher-based notifications: subscribes per role & user id */}
      <PushNotificationsProvider>
        <Routes>
          <Route path="/" element={<Navigate to={import.meta.env.VITE_MAIN_LOGIN_ROUTE} replace />} />

          {/* Auth routes */}
          <Route path="login" element={<LoginPage />} />
          <Route path="quick-login" element={<QuickLoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />
          <Route path="otp" element={<OTPPage />} />
          <Route path="success" element={<SuccessPage />} />
          <Route path="reset-password" element={<ResetPasswordPage />} />
          <Route path="token-login" element={<TokenLogin />} />
          {/* Live Streaming Control */}
          <Route path="admin/live-streaming-control" element={<LiveStreamingControl />} />
          {/* Protected Admin Routes */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />

              {/* Account Management */}
              <Route path="accounts" element={<AdminAccounts />} />
              <Route path="students/create" element={<CreateStudent />} />
              <Route path="students/:id/edit" element={<EditStudent />} />
              <Route path="experts/create" element={<CreateExpert />} />
              <Route path="experts/:id/edit" element={<EditExpert />} />
              <Route path="accounts/register-requests" element={<RegisterRequests />} />
              <Route path="experts/:id" element={<ShowExpert />} />
              <Route path="consultants" element={<ConsultantsList />} />
              <Route path="consultants/:id" element={<ConsultantShow />} />

              {/* Managers Management */}
              <Route path="managers" element={<ManagersList />} />
              <Route path="managers/create" element={<ManagerCreate />} />
              <Route path="managers/:id/edit" element={<ManagerEdit />} />

              {/* Trainees Management */}
              <Route path="trainees" element={<AdminTraineesList />} />
              <Route path="trainees/create" element={<AdminTraineeCreate />} />
              <Route path="trainees/:id/edit" element={<AdminTraineeEdit />} />

              {/* Company Management */}
              <Route path="company-requests" element={<CompanyRequestsList />} />
              <Route path="company-requests/:id" element={<CompanyRequestShow />} />

              {/* Program Management */}
              <Route path="programs" element={<ProgramsList />} />
              <Route path="programs/create" element={<AdminCreateProgram />} />
              <Route path="programs/:id/edit" element={<ProgramsEdit />} />
              <Route path="programs/:id/students" element={<AdminProgramStudents />} />
              <Route path="programs/:id/report" element={<AdminProgramReport />} />

              {/* Program Requests */}
              <Route path="programs/requests" element={<AdminProgramRequests />} />
              <Route path="programs/requests/:id" element={<AdminProgramRequestDetails />} />

              {/* Banner Management */}
              <Route path="banners" element={<AdminBannersList />} />
              <Route path="banners/create" element={<CreateBanner />} />
              <Route path="banners/:id/edit" element={<EditBanner />} />
              <Route path="banners/:id/interested-students" element={<InterestedStudents />} />

              {/* Category Management */}
              <Route path="categories" element={<CategoriesList />} />
              <Route path="categories/create" element={<CategoryCreate />} />
              <Route path="categories/:id/edit" element={<CategoryEdit />} />

              {/* Order Management */}
              <Route path="orders" element={<AdminOrders />} />

              {/* Report Management */}
              <Route path="reports" element={<AdminReports />} />

              {/* Notification Management */}
              <Route path="notifications" element={<AdminNotifications />} />
              <Route path="notifications/create" element={<NotificationCreate />} />
              <Route path="notifications/:id/edit" element={<NotificationEdit />} />

              {/* Review Management */}
              <Route path="reviews" element={<AdminReviews />} />
              <Route path="evaluation-preview" element={<PreviewEvaluationForm />} />

              <Route path="consulting" element={<ConsultingList />} />
              <Route path="consulting/:id" element={<ConsultingShow />} />

              <Route path="contact-us" element={<ContactUsList />} />
              <Route path="contact-us/:id" element={<ContactUsShow />} />

              {/* Website Data: Workshops */}
              <Route path="workshops" element={<WorkshopsList />} />
              <Route path="workshops/:id" element={<WorkshopShow />} />

              {/* Settings group: Skills */}
              <Route path="skills" element={<SkillsList />} />
              <Route path="skills/create" element={<SkillCreate />} />
              <Route path="skills/:id" element={<SkillShow />} />
              <Route path="skills/:id/edit" element={<SkillEdit />} />

              {/* Settings & FAQ */}
              <Route path="settings" element={<AdminSettings role="admin" />} />
              <Route path="faq" element={<AdminFAQ />} />
              <Route path="faqs/create" element={<FaqCreate />} />
              <Route path="faqs/:id/edit" element={<FaqEdit />} />


            </Route>
          </Route>

          {/* Protected Student Routes */}
          <Route element={<ProtectedRoute allowedRoles={['student', 'trainee']} />}>
            <Route path="student" element={<StudentLayout />}>
              <Route index element={<StudentDashboard />} />
              <Route path="courses" element={<Courses />} />
              <Route path="courses/:courseId" element={<CourseDetails />} />
              <Route path="courses/:courseId/overview" element={<CourseOverview />} />
              <Route path="certificates/program/:programId" element={<CertificateViewer />} />
              <Route path="live/:programId" element={<StudentWatchLive />} />
              <Route path="my-courses" element={<StudentMyCourses />} />
              <Route path="assignments" element={<AssignmentsList />} />
              <Route path="assignments/tasks/:assignmentId" element={<AssignmentDetail />} />
              <Route path="assignments/exams/:examId" element={<AssignmentSolve />} />
              <Route path="assignments/exams/:examId/review" element={<AssignmentReview />} />
              <Route path="evaluation/forms/program/:slug" element={<StudentEvaluationForm />} />
              <Route path="invoices" element={<StudentInvoices />} />
              <Route path="invoices/:id" element={<StudentInvoiceShow />} />
              <Route path="cart" element={<Cart />} />
              <Route path="cart/*" element={<RedirectWithQuery to="/student/cart" />} />

              <Route path="favorites" element={<Favorites />} />
              <Route path="my-interests" element={<MyInterests />} />
              <Route path="settings" element={<StudentSettings />} />
              <Route path="faq" element={<StudentFAQ />} />
              <Route path="certificates" element={<StudentCertificates />} />
              <Route path='support' element={<Support role='student' />} />

            </Route>
          </Route>

          {/* Protected Expert Routes */}
          <Route element={<ProtectedRoute allowedRoles={['teacher']} />}>
            <Route path="teacher" element={<ExpertLayout />}>
              <Route index element={<ExpertDashboard />} />
              <Route path="courses" element={<Courses role="teacher" />} />
              <Route path="courses/create" element={<CreateProgramPage />} />
              <Route path="courses/:id/edit" element={<EditProgramPage />} />
              <Route path="courses/:id" element={<TeacherCourseDetails />} />
              <Route path="/teacher/courses/:id/sections" element={<SectionsManager />} />
              <Route path="programs/:id/students" element={<TeacherProgramStudents />} />
              <Route path="live/:programId" element={<TeacherGoLive />} />
              <Route path="assignments" element={<Assignments />} />
              <Route path="assignments/new" element={<AssignmentsCreateEdit />} />
              <Route path="assignments/edit" element={<AssignmentsCreateEdit />} />
              <Route path="assignments/:id" element={<TeacherAssignmentShow />} />
              <Route path="exams/:id" element={<TeacherExamShow />} />
              <Route path="assessments">
                <Route path="assignments" element={<TeacherAssignmentSolutionsPage />} />
                <Route path="exams" element={<TeacherExamSolutionsPage />} />
                <Route path="assignments/:solutionId" element={<TeacherAssignmentSolutionEdit />} />
                <Route path="exams/:solutionId" element={<TeacherExamSolutionEdit />} />
              </Route>
              <Route path="reports" element={<Reports />} />
              <Route path="settings" element={<ExpertSettings role='teacher' />} />
              <Route path="faq" element={<ExpertFAQ />} />
              <Route path='support' element={<Support role='teacher' />} />
            </Route>
          </Route>

          <Route path="*" element={<div className="flex items-center justify-center h-screen">404 Not Found</div>} />
        </Routes>
      </PushNotificationsProvider>
    </AuthProvider>
  );
}
