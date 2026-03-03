
// src/components/Filters/MultiSelectFilter.jsx
import React from 'react';
import { Listbox } from '@headlessui/react';
import { CheckIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

export default function MultiSelectFilter({ label, options, selected, onChange }) {
    return (
        <Listbox value={selected} onChange={onChange} multiple>
            <div className="relative inline-block text-start">
                <Listbox.Button className="flex items-center gap-2 bg-white border border-gray-300 rounded-full px-4 py-2 text-sm shadow-sm">
                    {label}
                    <span className="font-medium">
                        {selected.length === 0
                            ? 'الكل'
                            : `(${selected.length})`}
                    </span>
                    <ChevronDownIcon className="w-4 h-4 text-gray-500" />
                </Listbox.Button>
                <Listbox.Options className="absolute mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-60 overflow-auto">
                    {options.map(opt => (
                        <Listbox.Option
                            key={opt}
                            value={opt}
                            className={({ active }) =>
                                `px-4 py-2 cursor-pointer flex justify-between ${active ? 'bg-gray-100' : ''}`
                            }
                        >
                            {({ selected }) => (
                                <>
                                    <span className={`${selected ? 'font-semibold' : ''}`}>
                                        {opt}
                                    </span>
                                    {selected ? (
                                        <CheckIcon className="w-5 h-5 text-primary" />
                                    ) : (
                                        <span className="w-5 h-5 border border-gray-300 rounded" />
                                    )}
                                </>
                            )}
                        </Listbox.Option>
                    ))}
                </Listbox.Options>
            </div>
        </Listbox>
    );
}
