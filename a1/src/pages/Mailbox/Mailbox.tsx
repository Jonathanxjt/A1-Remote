import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import axios from "axios";
import { endOfMonth, endOfWeek, format, isSameDay, isWithinInterval, startOfMonth, startOfWeek } from "date-fns";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ChevronUp } from "lucide-react";
import { useEffect, useState } from "react";
import { Flip, toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function NotificationPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [sortOrder, setSortOrder] = useState("desc");
  const [viewFilter, setViewFilter] = useState("all");
  const [dateRange, setDateRange] = useState({ from: null, to: null });
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedMonth, setSelectedMonth] = useState(
    format(new Date(), "yyyy-MM")
  );

  const fetchNotifications = async () => {
    try {
      const staffId = sessionStorage.getItem("staff_id");
      if (staffId) {
        const response = await axios.get(
          `http://localhost:5008/notification/${staffId}`
        );
        if (response.data.code === 200) {
          setNotifications(response.data.data.Notifications);
        } else {
          console.error(
            "Error fetching notifications: ",
            response.data.message
          );
        }
      } else {
        console.error("No staff_id found in sessionStorage.");
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  const toggleSelectNotification = (id) => {
    setSelectedNotifications((prev) =>
      prev.includes(id)
        ? prev.filter((notifId) => notifId !== id)
        : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    const filteredNotificationIds = filteredNotifications.map(
      (notif) => notif.notification_id
    );
    if (selectedNotifications.length === filteredNotificationIds.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(filteredNotificationIds);
    }
  };

  const markAsRead = async (ids) => {
    try {
      await Promise.all(
        ids.map((id) =>
          axios.put(
            `http://localhost:5008/notification/read_notification/${id}`
          )
        )
      );
      setNotifications((prevNotifications) =>
        prevNotifications.map((notification) =>
          ids.includes(notification.notification_id)
            ? { ...notification, is_read: !notification.is_read } // Toggle is_read
            : notification
        )
      );
      setSelectedNotifications([]);
    } catch (error) {
      console.error("Error marking as read/unread:", error);
    }
  };

  const deleteNotifications = async (ids) => {
    try {
      await Promise.all(
        ids.map((id) =>
          axios.delete(
            `http://localhost:5008/notification/delete_notification/${id}`
          )
        )
      );

      setSelectedNotifications([]);
      fetchNotifications();
      toast.success(`${ids.length} notification(s) deleted`, {
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
    } catch (error) {
      console.error("Error deleting notifications:", error);
      toast.error("Failed to delete notifications", {
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

  const filteredNotifications = notifications.filter((notification) => {
    const notificationDate = new Date(notification.notification_date);
    const today = new Date();

    // Handle status filtering
    if (
      statusFilter !== "all" &&
      ((statusFilter === "read" && !notification.is_read) ||
        (statusFilter === "unread" && notification.is_read))
    ) {
      return false;
    }

    // Handle date range filtering based on viewFilter
    switch (viewFilter) {
      case "today":
        return isSameDay(notificationDate, today);

      case "week":
        const weekStart = startOfWeek(today);
        const weekEnd = endOfWeek(today);
        return isWithinInterval(notificationDate, {
          start: weekStart,
          end: weekEnd,
        });

      case "month":
        if (selectedMonth) {
          const [year, month] = selectedMonth.split("-");
          const monthStart = startOfMonth(
            new Date(parseInt(year), parseInt(month) - 1)
          );
          const monthEnd = endOfMonth(monthStart);
          return isWithinInterval(notificationDate, {
            start: monthStart,
            end: monthEnd,
          });
        }
        return true; // If no month is selected, return all

      case "custom":
        if (dateRange?.from && dateRange?.to) {
          return isWithinInterval(notificationDate, {
            start: dateRange.from,
            end: dateRange.to,
          });
        }
        return true; // Return all if no date range is selected

      case "all":
      default:
        return true; // Bypass filtering if "all" is selected
    }
  });

  const sortedNotifications = [...filteredNotifications].sort((a, b) => {
    if (sortOrder === "asc") {
      return (
        new Date(a.notification_date).getTime() -
        new Date(b.notification_date).getTime()
      );
    } else {
      return (
        new Date(b.notification_date).getTime() -
        new Date(a.notification_date).getTime()
      );
    }
  });

  const totalPages = Math.ceil(sortedNotifications.length / rowsPerPage);
  const paginatedNotifications = sortedNotifications.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  return (
    <div className="container mx-auto py-10">
      <ToastContainer />
      <h1 className="text-2xl font-bold mb-5">Notifications</h1>

      <div className="flex space-x-4 mb-4">
        <div className="flex flex-col">
          <label htmlFor="status" className="text-sm font-medium mb-1">
            Status
          </label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="read">Read</SelectItem>
              <SelectItem value="unread">Unread</SelectItem>
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

      {sortedNotifications.length === 0 ? (
        <div>No notifications found.</div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={
                      selectedNotifications.length ===
                        paginatedNotifications.length &&
                      paginatedNotifications.length > 0
                    }
                    onCheckedChange={toggleSelectAll}
                    disabled={paginatedNotifications.length === 0}
                    className="translate-y-[2px]"
                  />
                </TableHead>
                <TableHead>Sender</TableHead>
                <TableHead className="cursor-pointer" onClick={toggleSortOrder}>
                  Date
                  {sortOrder === "asc" ? (
                    <ChevronUp className="ml-2 h-4 w-4 inline" />
                  ) : (
                    <ChevronDown className="ml-2 h-4 w-4 inline" />
                  )}
                </TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedNotifications.map((notification) => (
                <TableRow key={notification.notification_id}>
                  <TableCell className="w-[50px]">
                    <Checkbox
                      checked={selectedNotifications.includes(
                        notification.notification_id
                      )}
                      onCheckedChange={() =>
                        toggleSelectNotification(notification.notification_id)
                      }
                      className="translate-y-[2px]"
                    />
                  </TableCell>
                  <TableCell>{notification.sender_name}</TableCell>
                  <TableCell>
                    {format(
                      new Date(notification.notification_date),
                      "dd MMM yyyy HH:mm"
                    )}
                  </TableCell>
                  <TableCell>{notification.message}</TableCell>
                  <TableCell>
                    {notification.is_read ? (
                      <Badge variant="secondary">Read</Badge>
                    ) : (
                      <Badge
                        variant="secondary"
                        className="bg-yellow-100 text-yellow-800"
                      >
                        Unread
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      {notification.is_read ? (
                        <Button
                          size="sm"
                          onClick={() =>
                            markAsRead([notification.notification_id])
                          }
                        >
                          Mark as Unread
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() =>
                            markAsRead([notification.notification_id])
                          }
                        >
                          Mark as Read
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() =>
                          deleteNotifications([notification.notification_id])
                        }
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {selectedNotifications.length > 0 && (
            <div className="mt-4 flex space-x-2">
              <Button
                onClick={() =>
                  markAsRead(
                    selectedNotifications.filter(
                      (id) =>
                        !notifications.find((n) => n.notification_id === id)
                          .is_read
                    )
                  )
                }
              >
                Mark All as Read
              </Button>

              <Button
                variant="destructive"
                onClick={() => deleteNotifications(selectedNotifications)}
              >
                Delete Selected
              </Button>
            </div>
          )}

          <div className="flex items-center justify-between space-x-2 py-4">
            <div className="text-sm text-muted-foreground">
              {selectedNotifications.length} of {sortedNotifications.length}{" "}
              row(s) selected.
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
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  className="hidden h-8 w-8 p-0 lg:flex"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                >
                  <span className="sr-only">Go to first page</span>
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="h-8 w-8 p-0"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <span className="sr-only">Go to previous page</span>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="h-8 w-8 p-0"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <span className="sr-only">Go to next page</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="hidden h-8 w-8 p-0 lg:flex"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  <span className="sr-only">Go to last page</span>
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
