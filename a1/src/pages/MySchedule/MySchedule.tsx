import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import EmployeeStatusPieChart from "@/components/ui/EmployeeStatusPieChart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import axios from "axios";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Employee } from "src/Models/Employee";
import {debounce} from "lodash";

const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

type WorkStatus = "AM" | "PM" | "Full Day" | "Pending" | null;
type StatusBadgeProps = {
  status: WorkStatus;
}

interface WorkRequest {
  id: number;
  date: Date;
  title: string;
  type: WorkStatus;
  status: WorkStatus;
  reportingManager: string;
}

export default function Component() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState("month");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [workRequests, setWorkRequests] = useState<WorkRequest[]>([]);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeesAM, setEmployeesAM] = useState<Employee[]>([]);
  const [employeesPM, setEmployeesPM] = useState<Employee[]>([]);
  const [isWFHExpandedAM, setIsWFHExpandedAM] = useState(false);
  const [isInOfficeExpandedAM, setIsInOfficeExpandedAM] = useState(false);
  const [isWFHExpandedPM, setIsWFHExpandedPM] = useState(false);
  const [isInOfficeExpandedPM, setIsInOfficeExpandedPM] = useState(false);
  const [dayLoading, setDayLoading] = useState<boolean>(true); // Add loading state
  const [user, setUser] = useState(() => {
    return JSON.parse(sessionStorage.getItem("user") || "{}");
  });

  useEffect(() => {
    console.log(user);
  }, [user]);

  useEffect(() => {
    const fetchData = async () => {
      setDayLoading(true);
      await fetchEmployeesUnderManager(); // Wait for the fetch to complete
      setDayLoading(false); // Set loading state to false after fetch completes
    };

    fetchData();
  }, [currentDate]);

  const parseDate = (dateStr: string): Date => {
    return new Date(dateStr);
  };


  // Handle day selection

  const handleDateSelection = (date: Date) => {
    const dayOfWeek = date.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Skip weekends
      setSelectedDate(date);
      setCurrentDate(date);
    }
  };
  const isSameDay = (date1: Date, date2: Date): boolean => {
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    );
  };
  const fetchEmployeesUnderManager = async () => {
    try {
      const reportingManagerId = user.reporting_manager;
      const staff_id = user.staff_id;
      const role = user.role;
      let response;

      if (role === 1 || role === 3) {
        // Fetch schedules for both manager and team
        const ownScheduleResponse = await axios.get(
          `http://localhost:5004/schedule/team/${staff_id}`
        );
        const teamScheduleResponse = await axios.get(
          `http://localhost:5004/schedule/team/${reportingManagerId}`
        );

        if (
          ownScheduleResponse.data.code === 200 &&
          teamScheduleResponse.data.code === 200
        ) {
          console.log("ownScheduleResponse", ownScheduleResponse.data.data);
          console.log("teamScheduleResponse", teamScheduleResponse.data.data);
          // Combine data from both responses
          response = {
            data: {
              code: 200,
              data: [...ownScheduleResponse.data.data, ...teamScheduleResponse.data.data]
            }
          };
        } else {
          console.error("Failed to fetch schedules for manager or team.");
          response = {
            data: {
              code: 500,
              message: "Error fetching schedules"
            }
          };
        }
      } else {
        // If not a manager role, only get the team schedule
        response = await axios.get(
          `http://localhost:5004/schedule/team/${reportingManagerId}`
        );
      }

      if (response.data.code === 200) {
        const employeesAMList: Employee[] = [];
        const employeesPMList: Employee[] = [];

        response.data.data.forEach((item: any) => {
          const employee = item.employee;
          const schedule = item.schedule;

          const employeeData: Employee = {
            id: employee.staff_id,
            fullName: `${employee.staff_fname} ${employee.staff_lname}`,
            status: "In Office",
            email: employee.email,
            position: employee.position,
          };

          if (!schedule || schedule === "No schedule found.") {
            employeesAMList.push(employeeData);
            employeesPMList.push(employeeData);
          } else {
            const todaySchedule = schedule.filter((s: any) => {
              const scheduleDate = new Date(s.date);
              return isSameDay(scheduleDate, currentDate);
            });

            const hasAM = todaySchedule.some(
              (s: any) => s.request_type === "AM" && s.status === "Approved"
            );
            const hasPM = todaySchedule.some(
              (s: any) => s.request_type === "PM" && s.status === "Approved"
            );
            const isFullDay = todaySchedule.some(
              (s: any) =>
                s.request_type === "Full Day" && s.status === "Approved"
            );

            if (hasAM) {
              employeeData.status = "AM";
              employeesAMList.push(employeeData);
              employeeData.status = "In Office";
              employeesPMList.push(employeeData);
            }
            if (hasPM) {
              employeeData.status = "PM";
              employeesPMList.push(employeeData);
              employeeData.status = "In Office";
              employeesAMList.push(employeeData);
            }
            if (isFullDay) {
              employeeData.status = "Full";
              employeesAMList.push(employeeData);
              employeesPMList.push(employeeData);
            }
            if (!hasAM && !hasPM && !isFullDay) {
              employeesAMList.push(employeeData);
              employeesPMList.push(employeeData);
            }
          }
        });
        setEmployeesAM(employeesAMList);
        setEmployeesPM(employeesPMList);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const fetchEmployeesUnderManagerForDay = async (date: Date) => {
    try {
      const reportingManagerId = user.reporting_manager;
      const response = await axios.get(
        `http://localhost:5004/schedule/team/${reportingManagerId}`
      );
      if (response.data.code === 200) {
        let wfhCountAM = 0;
        let inOfficeCountAM = 0;
        let wfhCountPM = 0;
        let inOfficeCountPM = 0;

        // Format the input date to 'YYYY-MM-DD'
        const formattedDate = date.toISOString().split("T")[0];

        response.data.data.forEach((item: any) => {
          const schedule = item.schedule;
          if (!schedule || schedule === "No schedule found.") {
            inOfficeCountAM += 1;
            inOfficeCountPM += 1;
          } else {
            const todaySchedule = schedule.filter((s: any) => {
              const scheduleDate = new Date(s.date);
              return isSameDay(scheduleDate, date);
            });

            const hasAM = todaySchedule.some(
              (s: any) => s.request_type === "AM" && s.status === "Approved"
            );
            const hasPM = todaySchedule.some(
              (s: any) => s.request_type === "PM" && s.status === "Approved"
            );
            const isFullDay = todaySchedule.some(
              (s: any) =>
                s.request_type === "Full Day" && s.status === "Approved"
            );

            // Increment counters based on schedule
            if (hasAM) {
              wfhCountAM++; // Employee is WFH for AM
            } else {
              inOfficeCountAM++; // Employee is in office for AM
            }

            if (hasPM) {
              wfhCountPM++; // Employee is WFH for PM
            } else {
              inOfficeCountPM++; // Employee is in office for PM
            }

            // If they have a full day schedule, increment both counts
            if (isFullDay) {
              wfhCountAM++; // Full Day also counts for AM
              wfhCountPM++; // Full Day also counts for PM
            }
          }
        });

        // Return WFH and In Office counters for AM and PM
        return {
          wfhCountAM,
          inOfficeCountAM,
          wfhCountPM,
          inOfficeCountPM,
        };
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
      return {
        wfhCountAM: 0,
        inOfficeCountAM: 0,
        wfhCountPM: 0,
        inOfficeCountPM: 0,
      };
    }
  };

  useEffect(() => {
    const fetchWorkRequests = async () => {
      try {
        const response = await axios.get(
          `http://localhost:5004/schedule/${user.staff_id}/employee`
        );
        if (response.data.code === 200) {
          const requests = response.data.data.work_request
            .filter(
              (request: any) =>
                request.status === "Approved" || request.status === "Pending"
            )
            .map((request: any) => ({
              id: request.request_id,
              date: parseDate(request.date),
              type: request.request_type as WorkStatus,
              status:
                request.status === "Pending"
                  ? "Pending"
                  : (request.request_type as WorkStatus),
              reportingManager: request.reporting_manager || "Unknown",
            }));
          setWorkRequests(requests);
        } else {
          console.log("No work requests found.");
        }
      } catch (error) {
        console.error("Error fetching work requests:", error);
      }
    };
    fetchWorkRequests();
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, [currentDate]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    return { daysInMonth, firstDayOfMonth };
  };

  const { daysInMonth, firstDayOfMonth } = getDaysInMonth(currentDate);

  const prev = () => {
    if (currentView === "day") {
      // Go to the previous day
      let previousDate = new Date(currentDate); // Create a new Date object to avoid mutating the original
      previousDate.setDate(previousDate.getDate() - 1); // Subtract one day

      // Skip weekends (Saturday and Sunday)
      const dayOfWeek = previousDate.getDay();
      if (dayOfWeek === 0) {
        // If it's Sunday, move to Friday
        previousDate.setDate(previousDate.getDate() - 2);
      } else if (dayOfWeek === 6) {
        // If it's Saturday, move to Friday
        previousDate.setDate(previousDate.getDate() - 1);
      }

      setCurrentDate(previousDate);
    } else if (currentView === "month") {
      // Go to the previous month (first day of the month), no need to consider weekends
      const previousMonthDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - 1,
        1
      );
      setCurrentDate(previousMonthDate);
    }
  };

  const next = () => {
    if (currentView === "day") {
      // Go to the next day
      let nextDate = new Date(currentDate); // Create a new Date object to avoid mutating the original
      nextDate.setDate(nextDate.getDate() + 1); // Add one day

      // Skip weekends (Saturday and Sunday)
      const dayOfWeek = nextDate.getDay();
      if (dayOfWeek === 6) {
        // If it's Saturday, move to Monday
        nextDate.setDate(nextDate.getDate() + 2);
      } else if (dayOfWeek === 0) {
        // If it's Sunday, move to Monday
        nextDate.setDate(nextDate.getDate() + 1);
      }

      setCurrentDate(nextDate);
      setSelectedDate(nextDate);

    } else if (currentView === "month") {
      // Go to the next month (first day of the month), no need to consider weekends
      const nextMonthDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        1
      );
      setCurrentDate(nextMonthDate);
    }
  };

  const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
    const [isExpanded, setIsExpanded] = useState<boolean>(() => {
      // Set the initial state based on the current viewport width
      return window.innerWidth >= 768;
    });
  
    if (!status) return null;
  
    const colorMap = {
      AM: "bg-blue-200 text-blue-800",
      PM: "bg-pink-200 text-red-800",
      "Full Day": "bg-purple-200 text-purple-800",
      Pending: "bg-yellow-200 text-yellow-800",
    };
  
    const shortFormMap = {
      AM: "A",
      PM: "P",
      "Full Day": "F",
      Pending: "P",
    };
  
    const displayText = isExpanded ? status : shortFormMap[status];
  
    return (
      <Badge
        variant="secondary"
        className={`${colorMap[status]} 
          text-xs sm:text-sm md:text-base 
          px-1 sm:px-2 md:px-3 py-0.5 sm:py-1 
          rounded-full cursor-pointer`}
      >
        {displayText}
      </Badge>
    );
  };
  

  const renderMonthView = () => {
    const days = [];
    const today = new Date();
    const prevMonthDays = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      0
    ).getDate();
  
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const day = prevMonthDays - i;
      days.push(
        <div
          key={`prev-${day}`}
          className="p-1 sm:p-2 border border-gray-200 min-h-[60px] sm:min-h-[100px] bg-gray-100 opacity-50"
        >
          <div className="font-semibold text-gray-400 text-sm sm:text-base">
            {day}
          </div>
        </div>
      );
    }
  
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        day
      );
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const dayStatus = workRequests.find(
        (request) =>
          request.date.getDate() === day &&
          request.date.getMonth() === currentDate.getMonth() &&
          request.date.getFullYear() === currentDate.getFullYear()
      );
  
      const isSelected =
        selectedDate &&
        selectedDate.getDate() === day &&
        selectedDate.getMonth() === currentDate.getMonth() &&
        selectedDate.getFullYear() === currentDate.getFullYear();
  
      const isToday =
        today.getDate() === day &&
        today.getMonth() === currentDate.getMonth() &&
        today.getFullYear() === currentDate.getFullYear();
  
      days.push(
        <div
          key={day}
          className={`p-1 sm:p-2 border border-gray-200 min-h-[60px] sm:min-h-[100px] cursor-pointer transition-colors duration-200 
            ${isWeekend
              ? "bg-gray-300 cursor-not-allowed opacity-60"
              : isSelected
                ? "bg-blue-100"
                : "hover:bg-gray-100"
            }`}
          onClick={() => {
            if (!isWeekend) {
              handleDateSelection(date);
              console.log("Date selected:", date);
            }
          }}
        >
          {/* Use flex column to align items vertically */}
          <div className="flex flex-col items-center">
            <div
              className={`font-semibold ${isSelected ? "text-blue-600" : ""} ${
                isToday
                  ? "rounded-full bg-zinc-950 text-white w-6 h-6 flex items-center justify-center"
                  : ""
              } text-sm sm:text-base`}
            >
              {day}
            </div>
            {/* Status Badge below the date */}
            {dayStatus && (
              <div className="mt-2">
                <StatusBadge status={dayStatus.status} />
              </div>
            )}
          </div>
        </div>
      );
    }
  
    const remainingDays = 7 - ((firstDayOfMonth + daysInMonth) % 7);
    if (remainingDays < 7) {
      for (let day = 1; day <= remainingDays; day++) {
        days.push(
          <div
            key={`next-${day}`}
            className="p-1 sm:p-2 border border-gray-200 min-h-[60px] sm:min-h-[100px] bg-gray-100 opacity-50"
          >
            <div className="font-semibold text-gray-400 text-sm sm:text-base">
              {day}
            </div>
          </div>
        );
      }
    }
  
    return days;
  };
  

  const renderDayView = () => {
    const totalAMCount = employeesAM.filter(
      (employee) => employee.status === "AM" || employee.status === "Full"
    ).length;
    const totalPMCount = employeesAM.filter(
      (employee) => employee.status === "PM" || employee.status === "Full"
    ).length;
    const totalAMinOfficeCount = employeesAM.length - totalAMCount;
    const totalPMinOfficeCount = employeesPM.length - totalPMCount;
    const [searchTermAM, setSearchTermAM] = useState("");
    const [searchTermPM, setSearchTermPM] = useState("");

    const filteredEmployeesAM = employeesAM.filter((employee) =>
      employee.fullName.toLowerCase().includes(searchTermAM.toLowerCase())
    );

    const filteredEmployeesPM = employeesPM.filter((employee) =>
      employee.fullName.toLowerCase().includes(searchTermPM.toLowerCase())
    );

    if (dayLoading) {
      return <div>Loading...</div>; // Render loading indicator
    }

    return (
      <>
        <div className="mt-6 flex flex-col lg:flex-row space-y-4 lg:space-x-4 lg:space-y-0">
          <div className="w-full lg:w-1/2 pr-0 lg:pr-2 border-r lg:border-r-2 border-gray-300">
            <EmployeeStatusPieChart employees={employeesAM} />
            <h4 className="text-xl lg:text-3xl font-bold mt-4">AM Status</h4>
            <div className="mt-4 flex flex-col lg:flex-row justify-evenly items-center border border-gray-300 rounded-lg p-4">
              <div className="text-center flex-grow bg-gray-100 p-4 rounded-md">
                <h5 className="text-2xl lg:text-3xl">{totalAMCount}</h5>
                <p className="text-xs lg:text-sm text-gray-500">WFH</p>
              </div>
              <div className="hidden lg:block border-l border-gray-300 h-12 mx-4"></div>
              <div className="text-center flex-grow bg-green-100 p-4 rounded-md">
                <h5 className="text-2xl lg:text-3xl">{totalAMinOfficeCount}</h5>
                <p className="text-xs lg:text-sm text-gray-500">In Office</p>
              </div>
            </div>
            <input
              type="text"
              className="p-2 mt-4 bg-gray-100 border border-gray-300 rounded-md w-full mb-4"
              placeholder="Search employees..."
              value={searchTermAM}
              onChange={(e) => setSearchTermAM(e.target.value)}
            />

            {/* Collapsible Working From Home Section */}
            <div className="flex flex-col lg:flex-row space-y-4 lg:space-x-4 lg:space-y-0 mt-2">
              <div className="w-full lg:w-1/2">
                <button
                  className="flex items-center justify-between w-full p-2 bg-gray-100 border border-gray-300 rounded-md"
                  onClick={() => setIsWFHExpandedAM(!isWFHExpandedAM)}
                >
                  <h6 className="font-semibold">Working From Home:</h6>
                  <span>{isWFHExpandedAM ? "▲" : "▼"}</span>
                </button>
                {isWFHExpandedAM && (
                  <ul className="list-disc pl-5 mt-2">
                    {filteredEmployeesAM
                      .filter((employee) => employee.status === "AM" || employee.status === "Full")
                      .sort((a, b) => a.fullName.split(" ")[1].localeCompare(b.fullName.split(" ")[1]))
                      .map((employee) => (
                        <li key={employee.id}>{employee.fullName}</li>
                      ))}
                  </ul>
                )}
              </div>

              {/* Collapsible In Office Section */}
              <div className="w-full lg:w-1/2">
                <button
                  className="flex items-center justify-between w-full p-2 bg-gray-100 border border-gray-300 rounded-md"
                  onClick={() => setIsInOfficeExpandedAM(!isInOfficeExpandedAM)}
                >
                  <h6 className="font-semibold">In Office:</h6>
                  <span>{isInOfficeExpandedAM ? "▲" : "▼"}</span>
                </button>
                {isInOfficeExpandedAM && (
                  <ul className="list-disc pl-5 mt-2">
                    {filteredEmployeesAM
                      .filter((employee) => employee.status === "In Office")
                      .sort((a, b) => a.fullName.split(" ")[1].localeCompare(b.fullName.split(" ")[1]))
                      .map((employee) => (
                        <li key={employee.id}>{employee.fullName}</li>
                      ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          <div className="w-full lg:w-1/2">
            <EmployeeStatusPieChart employees={employeesPM} />
            <h4 className="text-xl lg:text-3xl font-bold mt-4">PM Status</h4>
            <div className="mt-4 flex flex-col lg:flex-row justify-evenly items-center border border-gray-300 rounded-lg p-4">
              <div className="text-center flex-grow bg-gray-100 p-4 rounded-md">
                <h5 className="text-2xl lg:text-3xl">{totalPMCount}</h5>
                <p className="text-xs lg:text-sm text-gray-500">WFH</p>
              </div>
              <div className="hidden lg:block border-l border-gray-300 h-12 mx-4"></div>
              <div className="text-center flex-grow bg-green-100 p-4 rounded-md">
                <h5 className="text-2xl lg:text-3xl">{totalPMinOfficeCount}</h5>
                <p className="text-xs lg:text-sm text-gray-500">In Office</p>
              </div>
            </div>
            <input
              type="text"
              className="p-2 mt-4 bg-gray-100 border border-gray-300 rounded-md w-full mb-4"
              placeholder="Search employees..."
              value={searchTermPM}
              onChange={(e) => setSearchTermPM(e.target.value)}
            />

            {/* Collapsible Working From Home Section */}
            <div className="flex flex-col lg:flex-row space-y-4 lg:space-x-4 lg:space-y-0 mt-2">
              <div className="w-full lg:w-1/2">
                <button
                  className="flex items-center justify-between w-full p-2 bg-gray-100 border border-gray-300 rounded-md"
                  onClick={() => setIsWFHExpandedPM(!isWFHExpandedPM)}
                >
                  <h6 className="font-semibold">Working From Home:</h6>
                  <span>{isWFHExpandedPM ? "▲" : "▼"}</span>
                </button>
                {isWFHExpandedPM && (
                  <ul className="list-disc pl-5 mt-2">
                    {filteredEmployeesPM
                      .filter((employee) => employee.status === "PM" || employee.status === "Full")
                      .sort((a, b) => a.fullName.split(" ")[1].localeCompare(b.fullName.split(" ")[1]))
                      .map((employee) => (
                        <li key={employee.id}>{employee.fullName}</li>
                      ))}
                  </ul>
                )}
              </div>

              {/* Collapsible In Office Section */}
              <div className="w-full lg:w-1/2">
                <button
                  className="flex items-center justify-between w-full p-2 bg-gray-100 border border-gray-300 rounded-md"
                  onClick={() => setIsInOfficeExpandedPM(!isInOfficeExpandedPM)}
                >
                  <h6 className="font-semibold">In Office:</h6>
                  <span>{isInOfficeExpandedPM ? "▲" : "▼"}</span>
                </button>
                {isInOfficeExpandedPM && (
                  <ul className="list-disc pl-5 mt-2">
                    {filteredEmployeesPM
                      .filter((employee) => employee.status === "In Office")
                      .sort((a, b) => a.fullName.split(" ")[1].localeCompare(b.fullName.split(" ")[1]))
                      .map((employee) => (
                        <li key={employee.id}>{employee.fullName}</li>
                      ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  };

  const renderWeekView = () => {
    const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri"];
    const startOfWeek = new Date(currentDate);
    const dayOfWeek = currentDate.getDay();
    const [weekData, setWeekData] = useState<
      {
        wfhCountAM: number;
        inOfficeCountAM: number;
        wfhCountPM: number;
        inOfficeCountPM: number;
      }[]
    >([]);
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const [loading, setLoading] = useState<boolean>(true);
    startOfWeek.setDate(currentDate.getDate() - daysToMonday);

    useEffect(() => {
      const fetchWeekData = async () => {
        let data = [];
        for (let i = 0; i < 5; i++) {
          const date = new Date();
          date.setDate(date.getDate() - date.getDay() + 1 + i);
          const dayData = await fetchEmployeesUnderManagerForDay(date);
          data.push(dayData);
        }
        setWeekData(data);
        setLoading(false);
      };
      fetchWeekData();
    }, []);

    if (loading) {
      return <div>Loading...</div>;
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {weekData.map((dayCount, i) => {
          // Create a new date for each day of the week
          const currentDate = new Date(startOfWeek);
          currentDate.setDate(startOfWeek.getDate() + i);

          return (
            <Card key={i} className="p-0">
              <CardContent className="p-3">
                <h3 className="font-bold text-xl mb-2">{daysOfWeek[i]}</h3>
                <p className="text-md mb-2">
                  {currentDate.toLocaleDateString()}{" "}
                </p>
                <div className="mt-4 mb-2 bg-gray-100 p-2 rounded-md">
                  {" "}
                  <h4 className="font-bold">AM:</h4>
                  <div className="flex justify-around items-center w-full pt-2">
                    {" "}
                    <div className="flex-1 border-r border-gray-300 pr-2">
                      <p className="text-sm text-center text-gray-500">WFH:</p>
                      <p className="text-xl text-center">{dayCount?.wfhCountAM}</p>
                    </div>
                    <div className="flex-1 pl-2">
                      <p className="text-sm text-center text-gray-500">Office:</p>
                      <p className="text-xl text-center">{dayCount?.inOfficeCountAM}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 mb-2 bg-gray-100 p-2 rounded-md">
                  {" "}
                  <h4 className="font-bold">PM:</h4>
                  <div className="flex justify-around items-center w-full pt-2">
                    {" "}
                    <div className="flex-1 border-r border-gray-300 pr-2">
                      <p className="text-sm text-center text-gray-500">WFH:</p>
                      <p className="text-xl text-center">{dayCount?.wfhCountPM}</p>
                    </div>
                    <div className="flex-1 pl-2">
                      <p className="text-sm text-center text-gray-500">Office:</p>
                      <p className="text-xl text-center">{dayCount?.inOfficeCountPM}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      <header className="bg-white shadow-sm py-4 px-4 sm:px-6 sticky top-0 z-10">
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
            My Schedule
          </h1>
          <p className="text-sm text-gray-600">
            {currentDateTime.toLocaleString()}
          </p>
        </div>
      </header>
      <main className="p-4 sm:p-6">
        <Card className="w-full">
          <Tabs
            value={currentView}
            onValueChange={setCurrentView}
            className="w-full"
          >
            <div className="flex flex-col sm:flex-row justify-between items-center p-4 border-b space-y-2 sm:space-y-0">
              <TabsList className="mb-2 sm:mb-0">
                <TabsTrigger value="day">Day</TabsTrigger>
                <TabsTrigger value="week">Week</TabsTrigger>
                <TabsTrigger value="month">Month</TabsTrigger>
              </TabsList>
              <div className="flex items-center space-x-2 sm:space-x-4">
                {currentView !== "week" && (
                  <Button variant="outline" size="icon" onClick={prev}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                )}

                <h2 className="text-lg sm:text-xl font-semibold whitespace-nowrap">
                  {currentView === "day"
                    ? `${currentDate.getDate()} ${months[currentDate.getMonth()]
                    }`
                    : `${months[currentDate.getMonth()]
                    } ${currentDate.getFullYear()}`}{" "}
                </h2>
                {currentView !== "week" && (
                  <Button variant="outline" size="icon" onClick={next}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <Select
                value={currentDate.getMonth().toString()}
                onValueChange={(value) =>
                  setCurrentDate(
                    new Date(currentDate.getFullYear(), parseInt(value), 1)
                  )
                }
              >
                <SelectTrigger className="w-[140px] sm:w-[180px]">
                  <SelectValue placeholder="Select a month" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <CardContent className="p-2 sm:p-4">
              <TabsContent value="day">{renderDayView()}</TabsContent>
              <TabsContent value="week">{renderWeekView()}</TabsContent>
              <TabsContent value="month">
                <div className="grid grid-cols-7 gap-0">
                  {daysOfWeek.map((day) => (
                    <div
                      key={day}
                      className="font-semibold text-center p-1 sm:p-2 text-sm sm:text-base"
                    >
                      {day.slice(0, 3)}
                    </div>
                  ))}
                  {renderMonthView()}
                </div>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </main>
    </div>
  );
}
