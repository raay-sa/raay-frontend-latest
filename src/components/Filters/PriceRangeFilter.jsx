// src/components/PriceRangeFilter.jsx
import React from 'react';
import { Popover } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import * as Slider from '@radix-ui/react-slider';

export default function PriceRangeFilter({ label, min, max, value, onChange }) {
    const [lo, hi] = value;

    return (
        <Popover className="relative inline-block text-start">
            <Popover.Button className="flex items-center gap-2 bg-white border border-gray-300 rounded-full px-4 py-2 text-sm shadow-sm">
                {label}
                <span className="font-medium">{`من ${lo} إلى ${hi}`}</span>
                <ChevronDownIcon className="w-4 h-4 text-gray-500" />
            </Popover.Button>

            <Popover.Panel dir='ltr' className="absolute mt-1 w-60 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4">
                {/* Display values */}
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>من: ﷼{lo}</span>
                    <span>إلى: ﷼{hi}</span>
                </div>

                {/* Radix Slider */}
                <Slider.Root
                    className="relative flex items-center select-none touch-none w-full h-5"
                    defaultValue={[lo, hi]}
                    value={[lo, hi]}
                    min={min}
                    max={max}
                    step={1}
                    onValueChange={(vals) => onChange(vals)}
                >
                    <Slider.Track className="relative bg-gray-200 flex-1 h-1 rounded-full">
                        <Slider.Range className="absolute h-full bg-primary rounded-full" />
                    </Slider.Track>
                    <Slider.Thumb className="block w-4 h-4 bg-primary rounded-full shadow-md focus:outline-none" />
                    <Slider.Thumb className="block w-4 h-4 bg-primary rounded-full shadow-md focus:outline-none" />
                </Slider.Root>
            </Popover.Panel>
        </Popover>
    );
}
