// src/components/DataTable.jsx
import React, { useState, useMemo } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

export default function DataTable({
  data,
  columns,
  renderRowActions = () => null,
  bulkActions = () => null,
  pageSizeOptions = [10],
  loading = false,
  serverPagination = null,
  onRowClick = null,              // optional row click handler
  showActions = true,             // control actions column visibility
  selectable = true,              // NEW: show/hide selection (checkbox) column
}) {
  const [selectedRows, setSelectedRows] = useState([]);
  const [pageSize, setPageSize] = useState(pageSizeOptions[0]);
  const [currentPage, setCurrentPage] = useState(1);

  const isServer = Boolean(serverPagination);
  const total = data.length;
  const totalPages = isServer ? serverPagination.totalPages : Math.max(1, Math.ceil(total / pageSize));
  const current = isServer ? serverPagination.currentPage : currentPage;

  const pageData = useMemo(() => {
    if (isServer) return data;
    const start = (currentPage - 1) * pageSize;
    return data.slice(start, start + pageSize);
  }, [data, currentPage, pageSize, isServer]);

  const allOnPage = pageData.map(r => r.id);
  const toggleAll = () =>
    setSelectedRows(sel => (sel.length === allOnPage.length ? [] : allOnPage));
  const toggleOne = id =>
    setSelectedRows(sel => (sel.includes(id) ? sel.filter(x => x !== id) : [...sel, id]));

  const handlePageChange = (page) => {
    if (isServer) {
      serverPagination.onPageChange(page);
    } else {
      setCurrentPage(page);
    }
  };

  const actionsHeaderEnabled = showActions && typeof renderRowActions === 'function';
  const bulkNode = selectable ? bulkActions(selectedRows) : null;

  const headerColSpan = columns.length + (selectable ? 1 : 0) + (actionsHeaderEnabled ? 1 : 0);

  return (
    <div className="relative bg-white p-2 sm:p-3 lg:p-4 rounded-lg shadow">
      {selectable && selectedRows.length > 0 && bulkNode ? (
        <div className="mb-4">{bulkNode}</div>
      ) : null}

      {/* Mobile view - Card layout */}
      <div className="block lg:hidden space-y-2 sm:space-y-4">
        {loading ? (
          <div className="text-center py-6">جاري التحميل...</div>
        ) : pageData.length === 0 ? (
          <div className="text-center py-6 text-gray-500">لا توجد بيانات</div>
        ) : (
          pageData.map((row, idx) => (
            <div key={row.id} className="border border-gray-200 rounded-lg p-2 sm:p-3 lg:p-4 space-y-2">
              {selectable && (
                <div className="flex justify-end">
                  <label className="inline-flex items-center cursor-pointer" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      className="peer hidden"
                      checked={selectedRows.includes(row.id)}
                      onChange={() => toggleOne(row.id)}
                    />
                    <div className="w-5 h-5 rounded-md border border-gray-300 peer-checked:bg-secondary peer-checked:border-secondary flex items-center justify-center transition-all">
                      <svg
                        className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                  </label>
                </div>
              )}
              
              {columns.map(col => (
                <div key={col.accessor} className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm font-medium">{col.header}:</span>
                  <span className="text-sm">
                    {col.Cell ? col.Cell(row[col.accessor], row) : row[col.accessor]}
                  </span>
                </div>
              ))}
              
              {actionsHeaderEnabled && (
                <div className="flex justify-end pt-2 border-t border-gray-100">
                  {renderRowActions(row)}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Desktop view - Table layout */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full table-auto text-sm text-right">
          <thead className="bg-gray-100">
            <tr>
              {selectable && (
                <th className="px-3 py-2">
                  <label className="inline-flex items-center cursor-pointer" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      className="peer hidden"
                      checked={pageData.length > 0 && selectedRows.length === pageData.length}
                      onChange={toggleAll}
                    />
                    <div className="w-5 h-5 rounded-md border border-gray-300 peer-checked:bg-secondary peer-checked:border-secondary flex items-center justify-center transition-all">
                      <svg
                        className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                  </label>
                </th>
              )}
              {columns.map(col => (
                <th key={col.accessor} className="px-3 py-2">{col.header}</th>
              ))}
              {actionsHeaderEnabled && (
                <th className="px-3 py-2">التحكم</th>
              )}
            </tr>
          </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={headerColSpan} className="text-center py-6">
                جاري التحميل...
              </td>
            </tr>
          ) : (
            pageData.map(row => (
              <tr
                key={row.id}
                className={`border-t ${onRowClick ? 'hover:bg-gray-50 cursor-pointer' : ''}`}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {selectable && (
                  <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="peer hidden"
                        checked={selectedRows.includes(row.id)}
                        onChange={() => toggleOne(row.id)}
                      />
                      <div className="w-5 h-5 rounded-md border border-gray-300 peer-checked:bg-secondary peer-checked:border-secondary flex items-center justify-center transition-all">
                        <svg
                          className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition duration-200"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                    </label>
                  </td>
                )}
                {columns.map(col => (
                  <td key={col.accessor} className="px-3 py-2">
                    {col.Cell ? col.Cell(row[col.accessor], row) : row[col.accessor]}
                  </td>
                ))}
                {actionsHeaderEnabled && (
                  <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                    {renderRowActions(row)}
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-4">
        <div className="text-xs text-gray-600">
          {isServer
            ? `صفحة ${current} من ${totalPages}`
            : `${Math.min((current - 1) * pageSize + 1, total)}–${Math.min(current * pageSize, total)} من ${total}`}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => handlePageChange(1)} disabled={current === 1}>
            <ChevronLeftIcon className="w-4 h-4 text-gray-500 rotate-180" />
          </button>
          <button
            onClick={() => handlePageChange(current - 1)}
            disabled={current === 1}
            className="px-2 py-1 border rounded text-xs"
          >
            السابق
          </button>
          <span className="px-2 text-xs">
            {current} / {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(current + 1)}
            disabled={current === totalPages}
            className="px-2 py-1 border rounded text-xs"
          >
            التالي
          </button>
          <button
            onClick={() => handlePageChange(totalPages)}
            disabled={current === totalPages}
          >
            <ChevronRightIcon className="w-4 h-4 text-gray-500" />
          </button>

          {!isServer && (
            <select
              value={pageSize}
              onChange={e => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border text-xs rounded px-2 py-1"
            >
              {pageSizeOptions.map(s => (
                <option key={s} value={s}>
                  {s} لكل صفحة
                </option>
              ))}
            </select>
          )}
        </div>
      </div>
    </div>
  );
}
