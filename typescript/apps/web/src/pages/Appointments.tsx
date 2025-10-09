import { useMemo, useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import { ArrowUpDown, ChevronLeft, ChevronRight, Search, Table, Calendar } from 'lucide-react'
import type { Appointment } from '@repo/types'
import { Button } from '@repo/ui'
import { mockAppointments } from '../data/appointments'
import { DayCalendarView } from '../components/DayCalendarView'

const columnHelper = createColumnHelper<Appointment>()

const columns: ColumnDef<Appointment, any>[] = [
  columnHelper.accessor('date', {
    header: ({ column }) => (
      <button
        className="flex items-center gap-2 hover:text-foreground"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Date
        <ArrowUpDown className="w-4 h-4" />
      </button>
    ),
    cell: (info) => <div className="font-medium">{info.getValue()}</div>,
  }),
  columnHelper.accessor('time', {
    header: ({ column }) => (
      <button
        className="flex items-center gap-2 hover:text-foreground"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Time
        <ArrowUpDown className="w-4 h-4" />
      </button>
    ),
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor('length', {
    header: 'Length',
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor('patientId', {
    header: ({ column }) => (
      <button
        className="flex items-center gap-2 hover:text-foreground"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Patient ID
        <ArrowUpDown className="w-4 h-4" />
      </button>
    ),
    cell: (info) => (
      <div className="flex items-center gap-1">
        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
        {info.getValue()}
      </div>
    ),
  }),
  columnHelper.accessor('patientName', {
    header: ({ column }) => (
      <button
        className="flex items-center gap-2 hover:text-foreground"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Patient Name
        <ArrowUpDown className="w-4 h-4" />
      </button>
    ),
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor('dob', {
    header: 'DOB',
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor('phone', {
    header: 'Phone',
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor('provider', {
    header: ({ column }) => (
      <button
        className="flex items-center gap-2 hover:text-foreground"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Provider
        <ArrowUpDown className="w-4 h-4" />
      </button>
    ),
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor('reasonForVisit', {
    header: 'Reason For Visit',
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor('status', {
    header: ({ column }) => (
      <button
        className="flex items-center gap-2 hover:text-foreground"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Status
        <ArrowUpDown className="w-4 h-4" />
      </button>
    ),
    cell: (info) => {
      const status = info.getValue()
      const statusColors = {
        Active: 'bg-blue-100 text-blue-800',
        Confirmed: 'bg-green-100 text-green-800',
        'Left Message': 'bg-yellow-100 text-yellow-800',
        Reschedule: 'bg-red-100 text-red-800',
      }
      return (
        <span
          className={`px-2 py-1 rounded-md text-xs font-medium ${
            statusColors[status as keyof typeof statusColors]
          }`}
        >
          {status}
        </span>
      )
    },
  }),
]

export function Appointments() {
  const [selectedDate, setSelectedDate] = useState(new Date('2025-10-01'))
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table')
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const data = useMemo(() => mockAppointments, [])

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const handlePreviousDay = () => {
    setSelectedDate((prev) => {
      const newDate = new Date(prev)
      newDate.setDate(newDate.getDate() - 1)
      return newDate
    })
  }

  const handleNextDay = () => {
    setSelectedDate((prev) => {
      const newDate = new Date(prev)
      newDate.setDate(newDate.getDate() + 1)
      return newDate
    })
  }

  const handleToday = () => {
    setSelectedDate(new Date())
  }

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  })

  return (
    <div className="flex-1 p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold">Appointments</h1>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'table' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('table')}
            >
              <Table className="w-4 h-4 mr-2" />
              Table
            </Button>
            <Button
              variant={viewMode === 'calendar' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('calendar')}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Calendar
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center border rounded-md">
              <Button variant="ghost" size="sm" onClick={handlePreviousDay} className="rounded-r-none border-r">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleNextDay} className="rounded-l-none">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <input
              type="date"
              value={selectedDate.toISOString().split('T')[0]}
              onChange={(e) => setSelectedDate(new Date(e.target.value))}
              className="px-3 py-1.5 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
            />
            <Button variant="outline" size="sm" onClick={handleToday}>
              Today
            </Button>
          </div>
        </div>
      </div>

      {viewMode === 'table' && (
        <div className="mb-4 flex justify-end">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search appointments..."
              value={globalFilter ?? ''}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
      )}

      {viewMode === 'table' ? (
        <>
          <div className="border rounded-lg bg-card">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className="px-4 py-3 text-left text-sm font-semibold text-foreground border-b"
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.length === 0 ? (
                    <tr>
                      <td colSpan={columns.length} className="px-4 py-8 text-center text-muted-foreground">
                        No appointments found
                      </td>
                    </tr>
                  ) : (
                    table.getRowModel().rows.map((row, index) => (
                      <tr
                        key={row.id}
                        className={`hover:bg-muted/50 ${
                          index % 2 === 0 ? 'bg-background' : 'bg-muted/20'
                        }`}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id} className="px-4 py-3 text-sm border-b">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
              {Math.min(
                (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                table.getFilteredRowModel().rows.length
              )}{' '}
              of {table.getFilteredRowModel().rows.length} appointments
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
              <div className="text-sm text-muted-foreground">
                Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </>
      ) : (
        <DayCalendarView appointments={data} />
      )}
    </div>
  )
}
