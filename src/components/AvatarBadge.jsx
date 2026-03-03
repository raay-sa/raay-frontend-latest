import React from "react";

export default function AvatarBadge({ name = "", avatarUrl = "", bottomRight = "", size = "md" }) {
    const letter = (name || "").trim()[0]?.toUpperCase() || "؟";
    
    const sizeClasses = {
        sm: "w-8 h-8 text-sm",
        md: "w-16 h-16 text-2xl",
        lg: "w-20 h-20 text-3xl"
    };
    
    return (
        <>
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                {avatarUrl ? (
                    <img
                        src={avatarUrl}
                        alt={name}
                        className={`${sizeClasses[size]} rounded-full object-cover ring-2 ring-white/60`}
                    />
                ) : (
                    <div className={`${sizeClasses[size]} rounded-full bg-white/15 text-white flex items-center justify-center font-bold`}>
                        {letter}
                    </div>
                )}
            </div>
            <div className="absolute bottom-3 right-3 bg-black/60 text-white rounded-full px-3 py-1 text-xs">
                {bottomRight || name || "—"}
            </div>
        </>
    );
}
