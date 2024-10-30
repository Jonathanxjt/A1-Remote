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
import { Info } from "lucide-react";
import {
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isWithinInterval,
  startOfMonth,
  startOfWeek,
  compareAsc,
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
import { useNavigate } from "react-router-dom";
import { Flip, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";


export default function WorkFromHomeRequests() {
  const navigate = useNavigate();

  useEffect(() => {
    const userData = sessionStorage.getItem("user");

    if (userData) {
      const user = JSON.parse(userData);
      console.log(user);
      if (user.role !== 1 && user.role !== 3) {
        navigate("/");
        return;
      }
    } else {
      navigate("/login");
      return;
    }
  }, [navigate]);

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
  );

  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState<"reject" | "revoke">("reject");
  const [actionRequest, setActionRequest] = useState<any | null>(null);
  const [actionComment, setActionComment] = useState("");

  const [isBulkActionModalOpen, setIsBulkActionModalOpen] = useState(false);
  const [bulkActionType, setBulkActionType] = useState<"reject" | "revoke">(
    "reject"
  );
  const [bulkActionComment, setBulkActionComment] = useState("");

  const [statusFilter, setStatusFilter] = useState("Pending");
  const [dateRange, setDateRange] = useState({ from: null, to: null });

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    console.log(`Selected status: ${value}`);
  };

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

  const fetchRequests = async () => {
    try {
      const staffId = sessionStorage.getItem("staff_id");
      if (staffId) {
        const response = await axios.get(
          `http://localhost:5003/work_request/${staffId}/manager`
        );
        if (response.data.code === 200) {
          // First filter for Pending/Approved requests
          const pendingRequests = response.data.data.work_request.filter(
            (request: any) =>
              request.status === "Pending" || request.status === "Approved"
          );

          // Sort by created_date, oldest first to track order properly
          const sortedRequests = pendingRequests.sort((a: any, b: any) =>
            compareAsc(new Date(a.created_date), new Date(b.created_date))
          );

          // Create a map to track request count per week
          const weekRequests = new Map();

          // Process requests and add exceeded flag
          const processedRequests = sortedRequests.map((request: any) => {
            const weekStart = startOfWeek(new Date(request.created_date), {
              weekStartsOn: 1,
            }).getTime();

            // Get or initialize array of requests for this week
            let weekArray = weekRequests.get(weekStart) || [];
            weekArray.push(request);
            weekRequests.set(weekStart, weekArray);

            // Mark as exceeded if it's pending and comes after 2 previous requests in the same week
            if (request.status === "Pending") {
              request.exceeded = weekArray.length > 2;
            } else {
              request.exceeded = false;
            }

            return request;
          });

          setRequests(processedRequests);
          console.log("Processed requests:", processedRequests);
        } else {
          console.error("Error fetching work requests:", response.data.message);
        }
      } else {
        console.error("No staff_id found in sessionStorage.");
      }
    } catch (error) {
      console.error("Error fetching work requests:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllEmployees();
    fetchRequests();
  }, []);

  const filterRequests = (requests: any[]) => {
    const today = new Date();

    const filteredByStatus = requests.filter(
      (request) => request.status === statusFilter
    );

    const filteredRequests = filteredByStatus.filter((request) => {
      const requestDate = new Date(request.request_date);

      switch (viewFilter) {
        case "today":
          return isSameDay(requestDate, today);
        case "week":
          const weekStart = startOfWeek(today);
          const weekEnd = endOfWeek(today);
          return isWithinInterval(requestDate, {
            start: weekStart,
            end: weekEnd,
          });
        case "month":
          const [year, month] = selectedMonth.split("-");
          const monthStart = startOfMonth(
            new Date(parseInt(year), parseInt(month) - 1)
          );
          const monthEnd = endOfMonth(monthStart);
          return isWithinInterval(requestDate, {
            start: monthStart,
            end: monthEnd,
          });
        case "custom":
          if (dateRange?.from && dateRange?.to) {
            return isWithinInterval(requestDate, {
              start: dateRange.from,
              end: dateRange.to,
            });
          }
          return true;
        default:
          return true;
      }
    });

    return filteredRequests;
  };

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

  const paginatedRequests = sortedRequests.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const totalPages = Math.ceil(sortedRequests.length / rowsPerPage);

  useEffect(() => {
    setCurrentPage(1);
    setSelectedRequests([]);
  }, [viewFilter, selectedMonth, dateRange]);

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  const toggleSelectAll = () => {
    if (selectedRequests.length === paginatedRequests.length) {
      setSelectedRequests([]);
    } else {
      setSelectedRequests(
        paginatedRequests.map((request) => request.request_id)
      );
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

      setSelectedRequests((prevSelected) =>
        prevSelected.filter((id) => id !== requestId)
      );

      fetchRequests();
    } catch (error) {
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
      setSelectedRequests((prevSelected) =>
        prevSelected.filter((id) => id !== requestId)
      );
    }
  };

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
    fetchRequests();
    setSelectedRequests([]);
  };

  // Open modal for both reject and revoke actions
  const openActionModal = (request: any, type: "reject" | "revoke") => {
    console.log(`${type} request:`, request);
    setActionType(type);
    setActionRequest(request);
    setIsActionModalOpen(true);
  };

  const closeActionModal = () => {
    setActionComment("");
    setIsActionModalOpen(false);
  };

  const handleActionWithComment = async () => {
    try {
      const statusUpdate = actionType === "reject" ? "Rejected" : "Revoked";

      console.log(
        `${statusUpdate} request:`,
        actionRequest,
        "with comment:",
        actionComment
      );

      await axios.put(
        `http://localhost:5005/scheduler/${actionRequest.request_id}/update_work_request_and_schedule`,
        {
          status: statusUpdate,
          comments: actionComment,
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
      setSelectedRequests((prevSelectedRequests) =>
        prevSelectedRequests.filter((id) => id !== actionRequest.request_id)
      );

      closeActionModal();

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

      setSelectedRequests((prevSelectedRequests) =>
        prevSelectedRequests.filter((id) => id !== actionRequest.request_id)
      );
    }
  };

  const openBulkActionModal = (type: "reject" | "revoke") => {
    setBulkActionType(type);
    setIsBulkActionModalOpen(true);
  };

  const closeBulkActionModal = () => {
    setBulkActionComment("");
    setIsBulkActionModalOpen(false);
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

    fetchRequests();
    setSelectedRequests([]);
    closeBulkActionModal();
  };

  const Legend = () => (
    <div className="p-3 w-48">
      <h2 className="text-xs font-semibold mb-2">Legend</h2>
      <ul className="text-xs space-y-1">
        <li className="flex items-center">
          <Badge variant="secondary" className="w-4 h-4 mr-2 bg-yellow-100" />
          <span>Pending</span>
        </li>
        <li className="flex items-center">
          <Badge variant="secondary" className="w-4 h-4 mr-2 bg-green-100" />
          <span>Approved</span>
        </li>
        <li className="flex items-center">
          <Badge variant="secondary" className="w-4 h-4 mr-2 bg-blue-200" />
          <span>AM</span>
        </li>
        <li className="flex items-center">
          <Badge variant="secondary" className="w-4 h-4 mr-2 bg-pink-200" />
          <span>PM</span>
        </li>
        <li className="flex items-center">
          <Badge variant="secondary" className="w-4 h-4 mr-2 bg-purple-200" />
          <span>Full Day</span>
        </li>
        <li className="flex items-center">
          <div className="w-4 h-4 bg-red-300 mr-2" />
          <span>Exceeded Request limit</span>
        </li>
      </ul>
    </div>
  )

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Work From Home Requests</h1>
          <p className="text-sm text-muted-foreground">
            Pending Requests:{" "}
            <span className="font-medium"></span>
          </p>
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon">
              <Info className="h-4 w-4" />
              <span className="sr-only">Show legend</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent side="left" align="end" className="w-64">
            <Legend />
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex space-x-4 mb-4">
        <div className="flex flex-col">
          <label htmlFor="view-filter" className="text-sm font-medium mb-1">
            Filter by Date
          </label>
          <Select value={viewFilter} onValueChange={setViewFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select view" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {viewFilter === "month" && (
          <div className="flex flex-col">
            <label htmlFor="month" className="text-sm font-medium mb-1">
              Month
            </label>
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
          </div>
        )}
        {viewFilter === "custom" && (
          <div className="flex flex-col">
            <label htmlFor="date-range" className="text-sm font-medium mb-1">
              Date Range
            </label>
            <DateRangePicker
              from={dateRange?.from}
              to={dateRange?.to}
              onSelect={(range) => setDateRange(range)}
            />
          </div>
        )}

        <div className="flex flex-col">
          <label htmlFor="status" className="text-sm font-medium mb-1">
            Status
          </label>
          <Select onValueChange={handleStatusChange} value={statusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Approved">Approved</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
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
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedRequests.map((request) => (
                <TableRow
                  key={request.request_id}
                  className={cn({
                    "bg-red-300": request.exceeded,
                  })}
                >
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
                        "bg-blue-200 text-blue-800":
                          request.request_type === "AM",
                        "bg-pink-200 text-red-800":
                          request.request_type === "PM",
                        "bg-purple-200 text-purple-800":
                          request.request_type === "Full Day",
                      })}
                    >
                      {request.request_type}
                    </Badge>
                  </TableCell>
                  <TableCell
                    style={{
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      maxWidth: "200px",
                    }}
                  >
                    {request.reason || "-"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={cn({
                        "bg-yellow-200 text-yellow-800":
                          request.status === "Pending",
                        "bg-green-200 text-green-800":
                          request.status === "Approved",
                      })}
                    >
                      {request.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      {request.status === "Pending" && (
                        <>
                          <Button
                            size="sm"
                            onClick={() =>
                              handleApproveRequest(request.request_id)
                            }
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => openActionModal(request, "reject")}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                      {request.status === "Approved" && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => openActionModal(request, "revoke")}
                          >
                            Revoke
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {selectedRequests.length > 0 && (
            <div className="mt-4 flex space-x-2">
              {statusFilter === "Pending" &&
                selectedRequests.some(
                  (id) =>
                    requests.find((r) => r.request_id === id)?.status ===
                    "Pending"
                ) && (
                  <Button onClick={handleBulkApproveRequests}>
                    Approve All
                  </Button>
                )}

              {statusFilter === "Pending" &&
                selectedRequests.some(
                  (id) =>
                    requests.find((r) => r.request_id === id)?.status ===
                    "Pending"
                ) && (
                  <Button onClick={() => openBulkActionModal("reject")}>
                    Reject All
                  </Button>
                )}

              {statusFilter === "Approved" &&
                selectedRequests.some(
                  (id) =>
                    requests.find((r) => r.request_id === id)?.status ===
                    "Approved"
                ) && (
                  <Button onClick={() => openBulkActionModal("revoke")}>
                    Revoke All
                  </Button>
                )}
            </div>
          )}
        </>
      )}
      <Dialog open={isActionModalOpen} onOpenChange={setIsActionModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "reject" ? "Reject Request" : "Revoke Request"}
            </DialogTitle>
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
              placeholder={`Please provide a reason for ${actionType === "reject" ? "rejection" : "revoking"
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
              disabled={!actionComment.trim()}
            >
              {actionType === "reject" ? "Reject" : "Revoke"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
              placeholder={`Please provide a reason for ${bulkActionType === "reject" ? "rejecting" : "revoking"
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
              disabled={!bulkActionComment.trim()}
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
                setCurrentPage(1);
              }}
              disabled={sortedRequests.length === 0}
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
              disabled={currentPage === 1 || totalPages === 0}
            >
              <span className="sr-only">Go to previous page</span>
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages || totalPages === 0}
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
