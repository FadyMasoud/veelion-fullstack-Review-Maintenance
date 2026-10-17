"use client";

import { useEffect, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type PaginationState,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import styles from "./DataTable.module.css";

type DataTableProps<TData> = {
  data: TData[];
  // TanStack's own docs use `any` for the value type here: each column has a
  // different value type, and a shared array can't name them all.
  columns: ColumnDef<TData, any>[];
  getRowId: (row: TData) => string;
  caption: string;
  emptyMessage: string;
  globalFilter?: string;
  columnFilters?: ColumnFiltersState;
  initialSorting?: SortingState;
  pageSize?: number;
};

// Reusable table. TanStack Table does the sorting, filtering and paging;
// this component only renders the result with our own markup and styles.
export function DataTable<TData>({
  data,
  columns,
  getRowId,
  caption,
  emptyMessage,
  globalFilter = "",
  columnFilters = [],
  initialSorting = [],
  pageSize = 10,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>(initialSorting);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize });

  const table = useReactTable({
    data,
    columns,
    getRowId,
    state: { sorting, pagination, globalFilter, columnFilters },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    // Don't jump back to page 1 every time the data changes (for example after
    // toggling a task). We reset it ourselves when the search or filters change.
    autoResetPageIndex: false,
  });

  // Compared as text, so a new array with the same filters doesn't reset the page.
  const filterKey = JSON.stringify(columnFilters);
  useEffect(() => {
    setPagination((previous) => ({ ...previous, pageIndex: 0 }));
  }, [globalFilter, filterKey]);

  // If rows disappear (for example a filtered task changes status), don't stay
  // on a page that no longer exists.
  const pageCount = table.getPageCount();
  useEffect(() => {
    if (pagination.pageIndex > 0 && pagination.pageIndex >= pageCount) {
      setPagination((previous) => ({ ...previous, pageIndex: Math.max(pageCount - 1, 0) }));
    }
  }, [pageCount, pagination.pageIndex]);

  const rows = table.getRowModel().rows;
  const filteredCount = table.getFilteredRowModel().rows.length;
  const firstRow = filteredCount === 0 ? 0 : pagination.pageIndex * pagination.pageSize + 1;
  const lastRow = pagination.pageIndex * pagination.pageSize + rows.length;

  return (
    <div className={styles.wrapper}>
      <div className={styles.scroll}>
        <table className={styles.table}>
          <caption className="sr-only">{caption}</caption>
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sorted = header.column.getIsSorted();
                  const ariaSort =
                    sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : canSort ? "none" : undefined;
                  const content = header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext());

                  return (
                    <th key={header.id} scope="col" aria-sort={ariaSort}>
                      {canSort ? (
                        <button
                          type="button"
                          className={styles.sortButton}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {content}
                          {sorted === "asc" ? (
                            <ArrowUp size={14} aria-hidden="true" />
                          ) : sorted === "desc" ? (
                            <ArrowDown size={14} aria-hidden="true" />
                          ) : (
                            <ArrowUpDown size={14} aria-hidden="true" className={styles.sortIdle} />
                          )}
                        </button>
                      ) : (
                        content
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={table.getVisibleLeafColumns().length} className={styles.empty}>
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className={styles.footer}>
        <p className={styles.count} aria-live="polite">
          {filteredCount === 0 ? "No results" : `Showing ${firstRow}–${lastRow} of ${filteredCount}`}
        </p>
        <div className={styles.pager}>
          <button
            type="button"
            className="button"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft size={16} aria-hidden="true" />
            Previous
          </button>
          <span className={styles.page}>
            Page {pagination.pageIndex + 1} of {Math.max(pageCount, 1)}
          </span>
          <button
            type="button"
            className="button"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
