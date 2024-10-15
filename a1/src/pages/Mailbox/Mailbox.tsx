import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Mailbox() {
  // Mock email data
  const [emails, setEmails] = useState([
    {
      email_id: 1,
      subject: "WFH Request for 10-11-24 Approved",
      date: "2024-10-15",
      status: "unread",
    },
    {
      email_id: 2,
      subject: "WFH Request for 11-11-24 Rejected",
      date: "2024-10-14",
      status: "read",
    },
    {
      email_id: 3,
      subject: "WFH on 13-11-24 Revoked",
      date: "2024-10-13",
      status: "unread",
    },
    {
      email_id: 4,
      subject: "WFH Request for 14-11-24 Approved",
      date: "2024-10-12",
      status: "read",
    },
  ]);

  const [selectedEmails, setSelectedEmails] = useState<number[]>([]);
  const [viewFilter, setViewFilter] = useState("all"); // Filters (all, unread, etc.)
  const [searchTerm, setSearchTerm] = useState(""); // For searching emails
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Filter emails based on view (all, unread, read)
  const filterEmails = (emails: any[]) => {
    return emails.filter((email) => {
      const matchesStatus = viewFilter === "all" || email.status === viewFilter;
      const matchesSearch =
        searchTerm === "" ||
        email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        email.sender.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  };

  // Sort emails by date
  const sortedEmails = filterEmails([...emails]).sort((a, b) => {
    if (sortOrder === "asc") {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    } else {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    }
  });

  // Handle sorting toggle
  const toggleSortOrder = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  // Handle email selection
  const toggleSelectEmail = (id: number) => {
    setSelectedEmails((prev) =>
      prev.includes(id) ? prev.filter((emailId) => emailId !== id) : [...prev, id]
    );
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-5">Mailbox</h1>
      
      <div className="flex space-x-4 mb-4">
        <Select value={viewFilter} onValueChange={setViewFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter view" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="unread">Unread</SelectItem>
            <SelectItem value="read">Read</SelectItem>
          </SelectContent>
        </Select>

      </div>

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
                    <Button size="sm" onClick={() => console.log(`Marking email ${email.email_id} as read`)}>
                      Mark as Read
                    </Button>
                    <Button size="sm" onClick={() => console.log(`Deleting email ${email.email_id}`)}>
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Pagination (Optional for larger mock data) */}
      {/* <Pagination /> */}
    </div>
  );
}
