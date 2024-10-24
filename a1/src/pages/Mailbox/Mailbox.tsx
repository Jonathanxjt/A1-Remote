import React, { useState } from "react"
import { format } from "date-fns"
import { ChevronDown, ChevronUp, Trash, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

interface Email {
  email_id: number
  sender: string
  subject: string
  date: string
  status: "read" | "unread"
}

const Mailbox: React.FC = () => {
  const [emails, setEmails] = useState<Email[]>([
    { email_id: 1, sender: "john@example.com", subject: "Meeting Tomorrow", date: "2023-10-23", status: "unread" },
    { email_id: 2, sender: "alice@example.com", subject: "Project Update", date: "2023-10-22", status: "read" },
    { email_id: 3, sender: "bob@example.com", subject: "Lunch Plans", date: "2023-10-21", status: "unread" },
    // Add more sample emails here...
  ])
  const [selectedEmails, setSelectedEmails] = useState<number[]>([])
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [viewFilter, setViewFilter] = useState("all")
  const [dateRange, setDateRange] = useState<{ from: Date | null; to: Date | null }>({ from: null, to: null })
  const [statusFilter, setStatusFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc")
  }

  const toggleSelectEmail = (id: number) => {
    setSelectedEmails((prev) =>
      prev.includes(id) ? prev.filter((emailId) => emailId !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    const filteredEmailIds = filteredEmails.map(email => email.email_id)
    if (selectedEmails.length === filteredEmailIds.length) {
      setSelectedEmails([])
    } else {
      setSelectedEmails(filteredEmailIds)
    }
  }

  const markAsRead = (ids: number[]) => {
    setEmails((prevEmails) =>
      prevEmails.map((email) =>
        ids.includes(email.email_id) ? { ...email, status: "read" } : email
      )
    )
    setSelectedEmails([])
    toast.success(`${ids.length} email(s) marked as read`)
  }

  const deleteEmails = (ids: number[]) => {
    setEmails((prevEmails) => prevEmails.filter((email) => !ids.includes(email.email_id)))
    setSelectedEmails([])
    toast.success(`${ids.length} email(s) deleted`)
  }

  const filteredEmails = emails.filter((email) => {
    const emailDate = new Date(email.date)
    const isWithinDateRange =
      (!dateRange.from || emailDate >= dateRange.from) &&
      (!dateRange.to || emailDate <= dateRange.to)
    const matchesStatusFilter =
      statusFilter === "all" || email.status === statusFilter
    return isWithinDateRange && matchesStatusFilter
  })

  const sortedEmails = [...filteredEmails].sort((a, b) => {
    if (sortOrder === "asc") {
      return new Date(a.date).getTime() - new Date(b.date).getTime()
    } else {
      return new Date(b.date).getTime() - new Date(a.date).getTime()
    }
  })

  const totalPages = Math.ceil(sortedEmails.length / rowsPerPage)
  const paginatedEmails = sortedEmails.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  )

  return (
    <div className="container mx-auto py-10">
      <ToastContainer />
      <h1 className="text-2xl font-bold mb-5">Mailbox</h1>

      {/* Display emails in a table */}
      {sortedEmails.length === 0 ? (
        <div>No emails found.</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={selectedEmails.length === sortedEmails.length && sortedEmails.length > 0}
                  onCheckedChange={() => setSelectedEmails(
                    selectedEmails.length === sortedEmails.length ? [] : sortedEmails.map((email) => email.email_id)
                  )}
                  disabled={sortedEmails.length === 0}
                  className="translate-y-[2px]"
                />
              </TableHead>
              <TableHead>Sender</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead className="cursor-pointer" onClick={toggleSortOrder}>
                Date
                {sortOrder === "asc" ? (
                  <ChevronUp className="ml-2 h-4 w-4 inline" />
                ) : (
                  <ChevronDown className="ml-2 h-4 w-4 inline" />
                )}
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedEmails.map((email) => (
              <TableRow key={email.email_id}>
                <TableCell className="w-[50px]">
                  <Checkbox
                    checked={selectedEmails.includes(email.email_id)}
                    onCheckedChange={() => toggleSelectEmail(email.email_id)}
                    className="translate-y-[2px]"
                  />
                </TableCell>
                <TableCell>{email.sender}</TableCell>
                <TableCell>{email.subject}</TableCell>
                <TableCell>{format(new Date(email.date), "dd MMM yyyy")}</TableCell>
                <TableCell>
                  {email.status === "unread" ? (
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Unread</Badge>
                  ) : (
                    "Read"
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    {/* Make the "Mark as Read" button work */}
                    {email.status === "unread" && (
                      <Button size="sm" onClick={() => markAsRead(email.email_id)}>
                        Mark as Read
                      </Button>
                    )}
                    <Button size="sm" onClick={() => deleteEmail(email.email_id)}>
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}

export default Mailbox