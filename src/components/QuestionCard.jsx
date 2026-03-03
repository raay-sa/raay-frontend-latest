import React from 'react';

export default function QuestionCard({ q, value, onChange, number }) {
    return (
        <div className="bg-white p-4 rounded-lg ">
            <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-black ms-4">
                    {number && <span className="me-1">{number}. </span>}
                    {q.text}
                </h2>

                <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded">
                    {typeof q.points === 'number' ? q.points : 0} نقطة
                </span>
            </div>

            {/* Single choice */}
            {q.type === 'single' &&
                q.options.map(opt => (
                    <label key={opt} className="flex items-center gap-2 mb-2">
                        <input
                            type="radio"
                            name={`q${q.id}`}
                            value={opt}
                            checked={value === opt}
                            onChange={() => onChange(q.id, opt)}
                            className="form-radio"
                        />
                        <span>{opt}</span>
                    </label>
                ))}

            {/* Multiple choice */}
            {q.type === 'multi' &&
                q.options.map(opt => (
                    <label key={opt} className="flex items-center gap-2 mb-2">
                        <input
                            type="checkbox"
                            name={`q${q.id}`}
                            value={opt}
                            checked={value?.includes(opt)}
                            onChange={e => {
                                const prev = value || [];
                                if (e.target.checked) onChange(q.id, [...prev, opt]);
                                else onChange(q.id, prev.filter(x => x !== opt));
                            }}
                            className="form-checkbox"
                        />
                        <span>{opt}</span>
                    </label>
                ))}

            {/* Essay */}
            {q.type === 'essay' && (
                <textarea
                    rows={4}
                    value={value || ''}
                    onChange={e => onChange(q.id, e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-3"
                    placeholder="اكتب إجابتك هنا..."
                />
            )}
        </div>
    );
}