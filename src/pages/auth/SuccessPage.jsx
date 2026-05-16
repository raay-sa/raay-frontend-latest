// client/src/pages/auth/SuccessPage.tsx
import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import Branding from "../../components/auth/Branding";

export default function SuccessPage() {
  const { type } = useParams();
  const navigate = useNavigate();

  const isVerify = type === "verify";
  const title = isVerify ? "تم التحقق بنجاح!" : "تم تحديث كلمة المرور بنجاح";
  const subtitle = isVerify ? "يمكنك الآن الاستمتاع بجميع خدماتنا" : "";
  const btnText = isVerify ? "متابعة" : "تسجيل الدخول";
  const btnAction = () => {
    navigate(isVerify ? "/dashboard" : `${import.meta.env.VITE_MAIN_LOGIN_ROUTE}`);
  };

  return (
    <div className="flex h-screen">
      {/* right */}
      <Branding text="" paragrapgh="" />

      {/* left */}
      <div className="w-1/2 flex items-center justify-center bg-white">
        <div className="max-w-sm w-full text-center">
          <div className="inline-block  p-4 my-6">
            <img src="/images/success.png" className="w-1/2 mx-auto" alt="" />
          </div>

          <h2 className="text-3xl font-bold my-2">{title}</h2>
          {subtitle && <p className="text-gray-600 mb-6">{subtitle}</p>}
          <button
            onClick={btnAction}
            className="w-full py-2 my-4 bg-primary text-white rounded-lg"
          >
            {btnText}
          </button>
        </div>
      </div>
    </div>
  );
}
