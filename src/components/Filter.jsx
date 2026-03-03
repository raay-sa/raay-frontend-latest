// src/components/Filter.jsx
import React, { useState } from 'react';
import { Range } from 'react-range';
import {
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
} from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';

export default function Filter({
  filterGroups,
  filters,
  isSearchEnabled = true,
  onFiltersChange,
  searchText,
  onSearchChange,
}) {
  const [open, setOpen] = useState(false);

  // reset every group back to its initial values
  const handleReset = () => {
    const reset = {};
    filterGroups.forEach((g) => {
      if (g.type === 'range') {
        reset[g.key] = [g.range.min, g.range.max];
      } else if (g.type === 'stars') {
        reset[g.key] = 0;
      } else {
        reset[g.key] = g.options[0].value;
      }
    });
    onFiltersChange(reset);
  };

  return (
    <div className="relative w-full">
      {/* Search + Filter button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 lg:gap-4">
        {isSearchEnabled && (
          <div className="relative flex-1 sm:flex-none sm:w-64 lg:w-80">
            <div className="absolute inset-y-0 left-0 pl-2 flex items-center">
              <MagnifyingGlassIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="ابحث عن..."
              value={searchText}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-8 sm:pl-10 pr-4 border border-gray-300 rounded-lg py-2 sm:py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        )}
        
        <button
          onClick={() => setOpen((o) => !o)}
          className="p-2 sm:p-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors self-start sm:self-auto"
        >
          <AdjustmentsHorizontalIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
        </button>
      </div>

      {open && (
        <div className="absolute top-full right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 sm:p-4 w-full sm:w-80 z-20">
          {filterGroups.map((group) => (
            <div key={group.key} className="mb-4 last:mb-0">
              <p className="font-semibold mb-2">{group.label}:</p>

              {/* radio */}
              {group.type === 'radio' && (
                <div className="space-y-2">
                  {group.options.map((opt) => (
                    <label key={opt.value} className="flex items-center gap-3">
                      <input
                        type="radio"
                        name={group.key}
                        checked={filters[group.key] === opt.value}
                        onChange={() =>
                          onFiltersChange({
                            ...filters,
                            [group.key]: opt.value,
                          })
                        }
                        className="form-radio h-4 w-4 text-primary"
                      />
                      <span className="text-sm">{opt.label}</span>
                    </label>
                  ))}
                </div>
              )}

              {/* stars */}
              {group.type === 'stars' && (
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name={group.key}
                      checked={filters[group.key] === 0}
                      onChange={() =>
                        onFiltersChange({
                          ...filters,
                          [group.key]: 0,
                        })
                      }
                      className="form-radio h-4 w-4 text-primary"
                    />
                    <span className="text-sm">بدون تصفية</span>
                  </div>
                  {group.options.map((opt) => (
                    <label key={opt.value} className="flex items-center gap-3">
                      <input
                        type="radio"
                        name={group.key}
                        checked={filters[group.key] === opt.value}
                        onChange={() =>
                          onFiltersChange({
                            ...filters,
                            [group.key]: opt.value,
                          })
                        }
                        className="form-radio h-4 w-4 text-primary"
                      />
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: opt.value }).map((_, i) => (
                          <StarIcon key={i} className="w-4 h-4 text-yellow-400" />
                        ))}
                      </div>
                    </label>
                  ))}
                </div>
              )}

              {/* range */}
              {group.type === 'range' && (
                <div className="space-y-3" dir="ltr">
                  <Range
                    values={filters[group.key]}
                    step={group.range.step || 1}
                    min={group.range.min}
                    max={group.range.max}
                    onChange={(vals) =>
                      onFiltersChange({ ...filters, [group.key]: vals })
                    }
                    renderTrack={({ props, children }) => (
                      <div
                        {...props}
                        className="relative h-2 w-full bg-gray-300 rounded-lg"
                      >
                        {/* filled segment */}
                        <div
                          className="absolute h-2 bg-primary rounded-lg"
                          style={{
                            left: `${
                              ((filters[group.key][0] - group.range.min) /
                                (group.range.max - group.range.min)) *
                              100
                            }%`,
                            width: `${
                              ((filters[group.key][1] - filters[group.key][0]) /
                                (group.range.max - group.range.min)) *
                              100
                            }%`,
                          }}
                        />
                        {children}
                      </div>
                    )}
                    renderThumb={({ props }) => (
                      <div
                        {...props}
                        className="h-5 w-5 bg-white border-2 border-primary rounded-full"
                      />
                    )}
                  />

                  <div className="flex gap-2">
                    <input
                      type="number"
                      className="flex-1 border rounded-lg py-2 text-sm"
                      placeholder="من:"
                      value={filters[group.key][0]}
                      onChange={(e) => {
                        const v = Number(e.target.value || group.range.min);
                        onFiltersChange({
                          ...filters,
                          [group.key]: [v, filters[group.key][1]],
                        });
                      }}
                    />
                    <input
                      type="number"
                      className="flex-1 border rounded-lg py-2 text-sm"
                      placeholder="إلى:"
                      value={filters[group.key][1]}
                      onChange={(e) => {
                        const v = Number(e.target.value || group.range.max);
                        onFiltersChange({
                          ...filters,
                          [group.key]: [filters[group.key][0], v],
                        });
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* buttons */}
          <div className="flex justify-center gap-5 mt-2">
            <button
              onClick={handleReset}
              className="px-7 py-2 text-sm border border-gray-300 rounded-lg"
            >
              إعادة تعيين
            </button>
            <button
              onClick={() => setOpen(false)}
              className="px-7 py-2 text-sm bg-primary text-white rounded-lg"
            >
              تطبيق
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
