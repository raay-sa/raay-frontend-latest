
// src/components/FilterDropdown.jsx
import React from 'react';
import { Listbox } from '@headlessui/react';
import { CheckIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

export default function FilterDropdown({ options, value, onChange }) {
    return (
        <Listbox value={value} onChange={onChange}>
            <div className="relative inline-block text-start">
                <Listbox.Button className="w-28 sm:w-32 lg:w-40 bg-white border border-gray-300 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 flex justify-between items-center text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
                    <span className="truncate">{value}</span>
                    <ChevronDownIcon className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 flex-shrink-0" />
                </Listbox.Button>

                <Listbox.Options className="absolute mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-20 focus:outline-none max-h-60 overflow-auto">
                    {options.map((opt) => (
                        <Listbox.Option
                            key={opt}
                            value={opt}
                            className={({ active }) =>
                                `cursor-pointer select-none px-2 sm:px-3 py-1.5 sm:py-2 flex justify-between items-center ${active ? 'bg-gray-100' : ''
                                }`
                            }
                        >
                            {({ selected }) => (
                                <>
                                    <span
                                        className={`text-xs sm:text-sm truncate ${selected ? 'font-medium text-gray-900' : 'text-gray-700'
                                            }`}
                                    >
                                        {opt}
                                    </span>
                                    {selected ? (
                                        <span className="w-4 h-4 sm:w-5 sm:h-5 border bg-primary text-center rounded-full flex-shrink-0">
                                            <CheckIcon className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                                        </span>
                                    ) : (
                                        <span className="w-4 h-4 sm:w-5 sm:h-5 border border-gray-300 rounded-full flex-shrink-0" />
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
