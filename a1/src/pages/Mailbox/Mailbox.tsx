import React from "react";
import {
  ChevronDown,
  ChevronUp,
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

// Define the Email type
interface Email {
  email_id: number;
  sender: string;
  subject: string;
  date: string;
  status: "read" | "unread";
}

// Define the props for Mailbox component
interface MailboxProps {
  emails: Email[];
  setEmails: React.Dispatch<React.SetStateAction<Email[]>>;
}

const Mailbox: React.FC<MailboxProps> = ({ emails, setEmails }) => {
  const [selectedEmails, setSelectedEmails] = React.useState<number[]>([]);
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("asc");

  // Handle "Mark as Read"
  const markAsRead = (id: number) => {
    setEmails((prevEmails) =>
      prevEmails.map((email) =>
        email.email_id === id ? { ...email, status: "read" } : email
      )
    );
  };

  // Handle "Delete"
  const deleteEmail = (id: number) => {
    setEmails((prevEmails) => prevEmails.filter((email) => email.email_id !== id));
  };

  // Sort emails by date
  const sortedEmails = [...emails].sort((a, b) => {
    if (sortOrder === "asc") {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    } else {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    }
  });

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  const toggleSelectEmail = (id: number) => {
    setSelectedEmails((prev) =>
      prev.includes(id) ? prev.filter((emailId) => emailId !== id) : [...prev, id]
    );
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-5">Mailbox</h1>

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
  );
};

export default Mailbox;
