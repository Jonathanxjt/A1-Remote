import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/ui/date-range-picker";
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
import { useNavigate } from "react-router-dom";
import { Flip, toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function MyRequests() {
  const navigate = useNavigate();

  useEffect(() => {
    const userData = sessionStorage.getItem("user");
    if (userData) {
      const user = JSON.parse(userData);
      if (!user) {
        navigate("/login");
      }
    }
  }, [navigate]);

  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [viewFilter, setViewFilter] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState(
    format(new Date(), "yyyy-MM")
  );
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [managerCache, setManagerCache] = useState<{ [key: number]: string }>(
    {}
  );

  const [dateRange, setDateRange] = useState({ from: null, to: null });
  const [statusFilter, setStatusFilter] = useState("All");

  const fetchAllManagers = async () => {
    try {
      const response = await axios.get("http://localhost:5002/employee");
      if (response.data.code === 200) {
        const managers = response.data.data.employee_list.filter(
          (emp: any) => emp.role === 1 || emp.role === 3
        );
        const managerDict: { [key: number]: string } = {};
        managers.forEach((manager: any) => {
          managerDict[manager.staff_id] = manager.staff_fname;
        });
        setManagerCache(managerDict);
        console.log(response.data);
      } else {
        console.error("Error fetching managers: ", response.data.message);
      }
    } catch (error) {
      console.error("Error fetching manager data: ", error);
    }
  };

  const fetchRequests = async () => {
    try {
      const staffId = sessionStorage.getItem("staff_id");
      if (staffId) {
        const response = await axios.get(
          `http://localhost:5003/work_request/${staffId}/employee`
        );
        if (response.data.code === 200) {
          setRequests(response.data.data.work_request);
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
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllManagers();
    fetchRequests();
  }, []);

  const filterRequests = (requests: any[]) => {
    const today = new Date();

    return requests.filter((request) => {
      const requestDate = new Date(request.request_date);

      // Apply status filter
      if (statusFilter !== "All" && request.status !== statusFilter) {
        return false;
      }

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
  }, [viewFilter, selectedMonth, dateRange, statusFilter]);

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  const handleWithdraw = async (requestId: number) => {
    try {
      const request = requests.find((r) => r.request_id === requestId);
      if (request && request.status === "Approved") {
        await axios.put(
          `http://localhost:5005/scheduler/${requestId}/update_work_request_and_schedule`,
          {
            status: "Withdrawn",
          }
        );
        toast.success("Request withdrawn successfully", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "dark",
          transition: Flip,
        });
        fetchRequests();
      } else {
        toast.error("Failed to withdraw request", {
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
    } catch (error) {
      console.error("Error withdrawing request:", error);
      toast.error("Failed to withdraw request", {
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
  };

  const handleCancel = async (requestId: number) => {
    try {
      const request = requests.find((r) => r.request_id === requestId);
      if (request && request.status === "Pending") {
        await axios.put(
          `http://localhost:5005/scheduler/${requestId}/update_work_request_and_schedule`,
          {
            status: "Cancelled",
          }
        );
        toast.success("Request cancelled successfully", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "dark",
          transition: Flip,
        });
        fetchRequests();
      } else {
        toast.error("Failed to cancel request", {
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
    } catch (error) {
      console.error("Error cancelling request:", error);
      toast.error("Failed to cancel request", {
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
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-10">
      <ToastContainer />
      <h1 className="text-2xl font-bold mb-5">My Requests</h1>
      <div className="flex space-x-4 mb-4">
        <div className="flex flex-col">
          <label htmlFor="status-filter" className="text-sm font-medium mb-1">
            Request Status
          </label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All</SelectItem>
              <SelectItem value="Approved">Approved</SelectItem>
              <SelectItem value="Withdrawn">Withdrawn</SelectItem>
              <SelectItem value="Rejected">Rejected</SelectItem>
              <SelectItem value="Revoked">Revoked</SelectItem>
              <SelectItem value="Cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
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
      </div>
      {paginatedRequests.length === 0 ? (
        <div>No requests found.</div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Manager</TableHead>
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
                <TableHead>Comments</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedRequests.map((request) => (
                <TableRow key={request.request_id}>
                  <TableCell>
                    {managerCache[request.approval_manager_id] || "Loading..."}
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
                        "bg-pink-100 text-pink-800":
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
                      className={cn({
                        "bg-yellow-100 text-yellow-800":
                          request.status === "Pending",
                        "bg-green-100 text-green-800":
                          request.status === "Approved",
                        "bg-orange-100 text-orange-800":
                          request.status === "Withdrawn",
                        "bg-orange-200 text-orange-800":
                          request.status === "Cancelled",
                        "bg-red-100 text-red-800":
                          request.status === "Rejected",
                        "bg-red-200 text-red-800": request.status === "Revoked",
                      })}
                    >
                      {request.status}
                    </Badge>
                  </TableCell>
                  <TableCell
                    style={{
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      maxWidth: "200px",
                    }}
                  >
                    {request.comments || "No comments"}
                  </TableCell>
                  <TableCell>
                    {request.status === "Pending" && (
                      <Button
                        size="sm"
                        onClick={() => handleCancel(request.request_id)}
                      >
                        Cancel
                      </Button>
                    )}
                    {request.status === "Approved" && (
                      <Button
                        size="sm"
                        onClick={() => handleWithdraw(request.request_id)}
                      >
                        Withdraw
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}

      <div className="flex justify-end items-center space-x-2 py-4">
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
