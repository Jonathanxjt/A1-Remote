import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import axios from "axios";
import {
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isWithinInterval,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronUp,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Flip, toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function WorkFromHomeRequests() {
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [selectedRequests, setSelectedRequests] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [viewFilter, setViewFilter] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState(
    format(new Date(), "yyyy-MM")
  );
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [employeeCache, setEmployeeCache] = useState<{ [key: number]: string }>(
    {}
  ); // Cache to store employee names by staff_id

  // State for managing the reject/revoke modal and the selected request
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState<"reject" | "revoke">("reject");
  const [actionRequest, setActionRequest] = useState<any | null>(null);
  const [actionComment, setActionComment] = useState("");

  // Bulk reject/revoke state
  const [isBulkActionModalOpen, setIsBulkActionModalOpen] = useState(false);
  const [bulkActionType, setBulkActionType] = useState<"reject" | "revoke">(
    "reject"
  );
  const [bulkActionComment, setBulkActionComment] = useState("");

  // Fetch all employees and store in a dictionary
  const fetchAllEmployees = async () => {
    try {
      const response = await axios.get("http://localhost:5002/employee");
      if (response.data.code === 200) {
        const employees = response.data.data.employee_list;
        const employeeDict: { [key: number]: string } = {};

        // Populate the dictionary with staff_id as the key and staff_fname as the value
        employees.forEach((employee: any) => {
          employeeDict[employee.staff_id] = employee.staff_fname;
        });

        setEmployeeCache(employeeDict); // Store the dictionary in state
      } else {
        console.error("Error fetching employees: ", response.data.message);
      }
    } catch (error) {
      console.error("Error fetching employee data: ", error);
    }
  };

  // Fetch work requests from Flask backend
  const fetchRequests = async () => {
    try {
      const staffId = sessionStorage.getItem("staff_id"); // Get staff_id from session storage
      if (staffId) {
        const response = await axios.get(
          `http://localhost:5003/work_request/${staffId}/manager`
        );
        if (response.data.code === 200) {
          const pendingRequests = response.data.data.work_request.filter(
            (request: any) => request.status === "Pending"
          );
          setRequests(pendingRequests); // Store the requests
        } else {
          console.error(
            "Error fetching work requests: ",
            response.data.message
          );
        }
      } else {
        console.error("No staff_id found in sessionStorage.");
      }
    } catch (error) {
      console.error("Error fetching work requests: ", error);
    } finally {
      setLoading(false); // Loading completed
    }
  };

  // Fetch employees and work requests on component mount
  useEffect(() => {
    fetchAllEmployees(); // Fetch all employees once
    fetchRequests(); // Fetch work requests
  }, []);

  // Filter requests based on view filter (all, today, week, month)
  const filterRequests = (requests: any[]) => {
    const today = new Date();
    switch (viewFilter) {
      case "today":
        return requests.filter((request) =>
          isSameDay(new Date(request.request_date), today)
        );
      case "week":
        const weekStart = startOfWeek(today);
        const weekEnd = endOfWeek(today);
        return requests.filter((request) =>
          isWithinInterval(new Date(request.request_date), {
            start: weekStart,
            end: weekEnd,
          })
        );
      case "month":
        const [year, month] = selectedMonth.split("-");
        const monthStart = startOfMonth(
          new Date(parseInt(year), parseInt(month) - 1)
        );
        const monthEnd = endOfMonth(monthStart);
        return requests.filter((request) =>
          isWithinInterval(new Date(request.request_date), {
            start: monthStart,
            end: monthEnd,
          })
        );
      default:
        return requests;
    }
  };

  // Sort filtered requests by date
  const sortedRequests = filterRequests([...requests]).sort((a, b) => {
    if (sortOrder === "asc") {
      return (
        new Date(a.request_date).getTime() - new Date(b.request_date).getTime()
      );
    } else {
      return (
        new Date(b.request_date).getTime() - new Date(a.request_date).getTime()
      );
    }
  });

  // Paginate sorted requests
  const paginatedRequests = sortedRequests.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  // Calculate total number of pages
  const totalPages = Math.ceil(sortedRequests.length / rowsPerPage);

  useEffect(() => {
    setCurrentPage(1); // Reset page to 1 when filter or month changes
    setSelectedRequests([]); // Clear selected requests when filter or date range changes
  }, [viewFilter, selectedMonth]);

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  const toggleSelectAll = () => {
    if (selectedRequests.length === paginatedRequests.length) {
      setSelectedRequests([]); // Deselect all
    } else {
      setSelectedRequests(
        paginatedRequests.map((request) => request.request_id)
      ); // Select all
    }
  };

  const toggleSelectRequest = (id: number) => {
    setSelectedRequests((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  // Function to handle approval of a request directly without a dialog box
  const handleApproveRequest = async (requestId) => {
    try {
      // Directly call the backend API to approve the request
      await axios.put(
        `http://localhost:5005/scheduler/${requestId}/update_work_request_and_schedule`,
        {
          status: "Approved", // Set the status to 'Approved'
        }
      );
      toast.success("Approved Request!", {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
        transition: Flip,
      });

      // Remove requestId from selectedRequests upon success
      setSelectedRequests((prevSelected) =>
        prevSelected.filter((id) => id !== requestId)
      );

      // Refetch requests after successful approval to update the UI with the latest data
      fetchRequests();
    } catch (error) {
      // Log any errors that occur during the approval process
      console.error("Error approving request:", error);
      toast.error("Failed to Approve Request", {
        position: "top-right",
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
        transition: Flip,
      });
    } finally {
      // Remove requestId from selectedRequests upon failure
      setSelectedRequests((prevSelected) =>
        prevSelected.filter((id) => id !== requestId)
      );
    }
  };

  // Function to handle bulk approval of selected requests
  const handleBulkApproveRequests = async () => {
    const successRequests = [];
    const failedRequests = [];

    await Promise.all(
      selectedRequests.map(async (requestId) => {
        try {
          await axios.put(
            `http://localhost:5005/scheduler/${requestId}/update_work_request_and_schedule`,
            {
              status: "Approved",
            }
          );
          successRequests.push(requestId);
        } catch (error) {
          console.error("Error approving request:", requestId, error);
          failedRequests.push(requestId);
        }
      })
    );

    if (successRequests.length > 0) {
      toast.success(`${successRequests.length} Requests have been Approved!`, {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
        transition: Flip,
      });
    }

    if (failedRequests.length > 0) {
      toast.error(`${failedRequests.length} Requests failed to Approve.`, {
        position: "top-right",
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
        transition: Flip,
      });
    }

    // Refetch requests after processing approvals to update the UI with the latest data
    fetchRequests();
    setSelectedRequests([]); // Clear selected requests after processing
  };

// Open modal for both reject and revoke actions
const openActionModal = (request: any, type: "reject" | "revoke") => {
  console.log(`${type} request:`, request); // Log the request object
  setActionType(type); // Set the action type (reject/revoke)
  setActionRequest(request); // Store the request to display details
  setIsActionModalOpen(true); // Open the modal
};

const closeActionModal = () => {
  setActionComment(""); // Reset the comment field
  setIsActionModalOpen(false); // Close the modal
};

const handleActionWithComment = async () => {
  try {
    const statusUpdate = actionType === "reject" ? "Rejected" : "Revoked"; // Determine status based on action

    console.log(
      `${statusUpdate} request:`,
      actionRequest,
      "with comment:",
      actionComment
    );

    // Call the backend API to update the work request and schedule
    await axios.put(
      `http://localhost:5005/scheduler/${actionRequest.request_id}/update_work_request_and_schedule`,
      {
        status: statusUpdate, // Set the status as 'Rejected' or 'Revoked'
        comments: actionComment, // Pass the comment provided by the user
      }
    );
    toast.success(`${statusUpdate} Request!`, {
      position: "top-right",
      autoClose: 2000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "dark",
      transition: Flip,
    });

    // Filter out the successfully handled request from selectedRequests
    setSelectedRequests((prevSelectedRequests) =>
      prevSelectedRequests.filter((id) => id !== actionRequest.request_id)
    );

    // After successful response, close the modal
    closeActionModal();
    // Refetch requests after successful approval to update the UI with the latest data
    fetchRequests();
  } catch (error) {
    console.error(`Error ${actionType}ing request:`, error);
    const statusUpdate = actionType === "reject" ? "Rejected" : "Revoked";
    toast.error(`Failed to ${statusUpdate.slice(0, -2)} Request!`, {
      position: "top-right",
      autoClose: 2000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "dark",
      transition: Flip,
    });

    // Filter out the failed request from selectedRequests even on failure
    setSelectedRequests((prevSelectedRequests) =>
      prevSelectedRequests.filter((id) => id !== actionRequest.request_id)
    );
  }
};

  // Bulk action modal handler
  const openBulkActionModal = (type: "reject" | "revoke") => {
    setBulkActionType(type); // Set the action type for bulk (reject/revoke)
    setIsBulkActionModalOpen(true); // Open the modal
  };

  const closeBulkActionModal = () => {
    setBulkActionComment(""); // Reset comment field
    setIsBulkActionModalOpen(false); // Close the modal
  };

  const handleBulkActionWithComment = async () => {
    const statusUpdate = bulkActionType === "reject" ? "Rejected" : "Revoked";
    const successRequests = [];
    const failedRequests = [];

    await Promise.all(
      selectedRequests.map(async (requestId) => {
        try {
          await axios.put(
            `http://localhost:5005/scheduler/${requestId}/update_work_request_and_schedule`,
            {
              status: statusUpdate,
              comments: bulkActionComment,
            }
          );
          successRequests.push(requestId);
        } catch (error) {
          console.error(
            `Error ${bulkActionType}ing request:`,
            requestId,
            error
          );
          failedRequests.push(requestId);
        }
      })
    );

    if (successRequests.length > 0) {
      toast.success(
        `${successRequests.length} Requests have been ${statusUpdate}!`,
        {
          position: "top-right",
          autoClose: 2000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "dark",
          transition: Flip,
        }
      );
    }

    if (failedRequests.length > 0) {
      toast.error(
        `${failedRequests.length} Requests failed to ${statusUpdate}.`,
        {
          position: "top-right",
          autoClose: 4000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "dark",
          transition: Flip,
        }
      );
    }

    fetchRequests(); // Refetch requests after bulk action
    setSelectedRequests([]); // Clear selected requests
    closeBulkActionModal(); // Close modal
  };

  if (loading) {
    return <div>Loading...</div>; // Display loading message while fetching data
  }

  return (
    <div className="container mx-auto py-10">
      {/* Add the ToastContainer */}
      <ToastContainer />
      <h1 className="text-2xl font-bold mb-5">Work From Home Requests</h1>
      <div className="flex space-x-4 mb-4">
        <Select value={viewFilter} onValueChange={setViewFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select view" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">Month</SelectItem>
          </SelectContent>
        </Select>
        {viewFilter === "month" && (
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 - new Date().getMonth() }, (_, i) => {
                const date = new Date(
                  new Date().getFullYear(),
                  new Date().getMonth() + i,
                  1
                );
                return (
                  <SelectItem key={i} value={format(date, "yyyy-MM")}>
                    {format(date, "MMMM yyyy")}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        )}
      </div>
      {/** Display requests in a table */}
      {paginatedRequests.length === 0 ? (
        <div>No requests found.</div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={
                      selectedRequests.length === paginatedRequests.length &&
                      paginatedRequests.length > 0
                    }
                    onCheckedChange={toggleSelectAll}
                    disabled={paginatedRequests.length === 0}
                    className="translate-y-[2px]"
                  />
                </TableHead>
                <TableHead>Employee</TableHead>
                <TableHead className="cursor-pointer" onClick={toggleSortOrder}>
                  Date
                  {sortOrder === "asc" ? (
                    <ChevronUp className="ml-2 h-4 w-4 inline" />
                  ) : (
                    <ChevronDown className="ml-2 h-4 w-4 inline" />
                  )}
                </TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedRequests.map((request) => (
                <TableRow key={request.request_id}>
                  <TableCell className="w-[50px]">
                    <Checkbox
                      checked={selectedRequests.includes(request.request_id)}
                      onCheckedChange={() =>
                        toggleSelectRequest(request.request_id)
                      }
                      className="translate-y-[2px]"
                    />
                  </TableCell>
                  <TableCell>
                    {employeeCache[request.staff_id] || "Loading..."}
                  </TableCell>
                  <TableCell>
                    {format(
                      new Date(request.request_date),
                      "dd MMMM yyyy, EEEE"
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={cn({
                        "bg-blue-100 text-blue-800":
                          request.request_type === "AM",
                        "bg-green-100 text-green-800":
                          request.request_type === "PM",
                        "bg-purple-100 text-purple-800":
                          request.request_type === "Full Day",
                      })}
                    >
                      {request.request_type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className="bg-yellow-100 text-yellow-800"
                    >
                      {request.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      {/* Approve button to directly approve the request */}
                      <Button
                        size="sm"
                        onClick={() => handleApproveRequest(request.request_id)}
                      >
                        Approve
                      </Button>
                      {/* Reject button to open a modal for rejecting the request */}
                      <Button
                        size="sm"
                        onClick={() => openActionModal(request, "reject")}
                      >
                        Reject
                      </Button>
                      {/* Revoke button to open a modal for revoking the request */}
                      <Button
                        size="sm"
                        onClick={() => openActionModal(request, "revoke")}
                      >
                        Revoke
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {selectedRequests.length > 0 && (
            <div className="mt-4 flex space-x-2">
              <Button onClick={handleBulkApproveRequests}>Approve All</Button>
              <Button onClick={() => openBulkActionModal("reject")}>
                Reject All
              </Button>
              <Button onClick={() => openBulkActionModal("revoke")}>
                Revoke All
              </Button>
            </div>
          )}
        </>
      )}
      {/* Action modal */}
      <Dialog open={isActionModalOpen} onOpenChange={setIsActionModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "reject" ? "Reject Request" : "Revoke Request"}
            </DialogTitle>
            {/* Display request details */}
            {actionRequest && (
              <div className="mt-4">
                <p>
                  <strong>Employee:</strong>{" "}
                  {employeeCache[actionRequest.staff_id]}
                </p>
                <p>
                  <strong>Request Type:</strong> {actionRequest.request_type}
                </p>
                <p>
                  <strong>Request Date:</strong>{" "}
                  {format(
                    new Date(actionRequest.request_date),
                    "dd MMMM yyyy, EEEE"
                  )}
                </p>
              </div>
            )}
          </DialogHeader>
          <div className="mt-4">
            <label htmlFor="comment" className="block mb-2">
              Comment <span className="text-red-500">*</span>
            </label>
            <Textarea
              id="comment"
              className="mt-2"
              placeholder={`Please provide a reason for ${
                actionType === "reject" ? "rejection" : "revoking"
              }`}
              value={actionComment}
              onChange={(e) => setActionComment(e.target.value)}
            />
          </div>
          <DialogFooter className="mt-4">
            <Button onClick={closeActionModal} variant="outline">
              Cancel
            </Button>
            <Button
              onClick={handleActionWithComment}
              disabled={!actionComment.trim()} // Disable if comment is empty
            >
              {actionType === "reject" ? "Reject" : "Revoke"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk action modal */}
      <Dialog
        open={isBulkActionModalOpen}
        onOpenChange={setIsBulkActionModalOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {bulkActionType === "reject"
                ? `Reject ${selectedRequests.length} Requests`
                : `Revoke ${selectedRequests.length} Requests`}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <p>
              You are about to{" "}
              {bulkActionType === "reject" ? "reject" : "revoke"}{" "}
              {selectedRequests.length}{" "}
              {selectedRequests.length === 1 ? "request" : "requests"}. Please
              provide a comment below.
            </p>
            <label htmlFor="bulkComment" className="block mb-2 mt-4">
              Comment <span className="text-red-500">*</span>
            </label>
            <Textarea
              id="bulkComment"
              className="mt-2"
              placeholder={`Please provide a reason for ${
                bulkActionType === "reject" ? "rejecting" : "revoking"
              } all selected requests`}
              value={bulkActionComment}
              onChange={(e) => setBulkActionComment(e.target.value)}
            />
          </div>
          <DialogFooter className="mt-4">
            <Button onClick={closeBulkActionModal} variant="outline">
              Cancel
            </Button>
            <Button
              onClick={handleBulkActionWithComment}
              disabled={!bulkActionComment.trim()} // Disable if comment is empty
            >
              {bulkActionType === "reject"
                ? `Reject ${selectedRequests.length} Requests`
                : `Revoke ${selectedRequests.length} Requests`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="text-sm text-muted-foreground">
          {selectedRequests.length} of {sortedRequests.length} row(s) selected.
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Rows per page</p>
            <Select
              value={`${rowsPerPage}`}
              onValueChange={(value) => {
                setRowsPerPage(Number(value));
                setCurrentPage(1); // Reset to first page when rows per page changes
              }}
              disabled={sortedRequests.length === 0} // Disable when there are no requests
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder={rowsPerPage} />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 30, 40, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex w-[100px] items-center justify-center text-sm font-medium">
            Page {sortedRequests.length === 0 ? 0 : currentPage} of{" "}
            {totalPages === 0 ? 0 : totalPages}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1 || totalPages === 0}
            >
              <span className="sr-only">Go to first page</span>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1 || totalPages === 0} // Disable if on the first page or no requests
            >
              <span className="sr-only">Go to previous page</span>
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages || totalPages === 0} // Disable if on the last page or no requests
            >
              <span className="sr-only">Go to next page</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages || totalPages === 0}
            >
              <span className="sr-only">Go to last page</span>
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
