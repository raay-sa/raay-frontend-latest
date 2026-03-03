// src/components/Filters/RatingFilter.jsx
import React from 'react';
import { Listbox } from '@headlessui/react';
import { StarIcon, ChevronDownIcon, CheckIcon } from '@heroicons/react/24/outline';

export default function RatingFilter({ label, options, value, onChange }) {
    return (
        <Listbox value={value} onChange={onChange}>
            <div className="relative inline-block text-start">
                <Listbox.Button className="flex items-center gap-2 bg-white border border-gray-300 rounded-full px-4 py-2 text-sm shadow-sm">
                    {label}
                    <span className="font-medium">{value || 'الكل'}</span>
                    <ChevronDownIcon className="w-4 h-4 text-gray-500" />
                </Listbox.Button>
                <Listbox.Options className="absolute mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-60 overflow-auto">
                    <Listbox.Option
                        value={null}
                        className={({ active }) => `px-4 py-2 ${active ? 'bg-gray-100' : ''}`}
                    >
                        الكل
                    </Listbox.Option>

                    {options.map(r => (
                        <Listbox.Option
                            key={r}
                            value={r}
                            className={({ active }) => `px-4 py-2 ${active ? 'bg-gray-100' : ''}`}
                        >
                            {({ selected }) => (
                                <div className="flex justify-between items-center">
                                    <div className="flex -space-x-1">
                                        {Array.from({ length: r }).map((_, i) => (
                                            <StarIcon key={i} className="w-4 h-4 text-yellow-400" />
                                        ))}
                                    </div>
                                    {selected ? (
                                        <CheckIcon className="w-5 h-5 text-primary" />
                                    ) : (
                                        <span className="w-5 h-5 border border-gray-300 rounded" />
                                    )}
                                </div>
                            )}
                        </Listbox.Option>
                    ))}
                </Listbox.Options>
            </div>
        </Listbox>
    );
}
