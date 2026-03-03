// src/pages/dashboard/components/Stars.jsx
import { StarIcon } from "@heroicons/react/24/solid";
export default function Stars({ score = 0, size = "w-4 h-4" }) {
    return (
        <div className="flex">
            {[1, 2, 3, 4, 5].map((i) => (
                <StarIcon key={i} className={`${size} ${i <= Number(score) ? "text-yellow-400" : "text-gray-300"}`} />
            ))}
        </div>
    );
}
