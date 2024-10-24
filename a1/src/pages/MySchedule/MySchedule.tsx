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

  const parseDate = (dateStr: string): Date => {
    return new Date(dateStr);
  };

  useEffect(() => {
    const fetchWorkRequests = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5004/schedule/150318/employee"
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

    const fetchEmployeesUnderManager = async () => {
      try {
        const user = JSON.parse(sessionStorage.getItem("user") || "{}");
        const reportingManagerId = user.reporting_manager;
        const response = await axios.get(
          `http://localhost:5004/schedule/team/${reportingManagerId}`
        );

        if (response.data.code === 200) {
          const employeesAMList: Employee[] = [];
          const employeesPMList: Employee[] = [];

          const currentDateString = currentDate.toUTCString().split(",")[0]; // Format it to match "Tue, 15 Oct 2024"
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
                const scheduleDate = new Date(s.date)
                  .toUTCString()
                  .split(",")[0];
                return scheduleDate === currentDateString;
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

    fetchEmployeesUnderManager();

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
    if (currentView === "month") {
      setCurrentDate(
        new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
      );
    } else if (currentView === "day") {
      setCurrentDate(
        new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          currentDate.getDate() - 1
        )
      );
    }
  };

  const next = () => {
    if (currentView === "month") {
      setCurrentDate(
        new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
      );
    } else if (currentView === "day") {
      setCurrentDate(
        new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          currentDate.getDate() + 1
        )
      );
    }
  };

  const getStatusBadge = (status: WorkStatus) => {
    if (!status) return null;
    const colorMap = {
      AM: "bg-green-500",
      PM: "bg-green-500",
      "Full Day": "bg-green-500",
      Pending: "bg-yellow-500",
    };
    return (
      <Badge
        className={`${colorMap[status]} text-white text-xs px-1 py-0.5 rounded`}
      >
        {status}
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
            ${
              isWeekend
                ? "bg-gray-300 cursor-not-allowed opacity-60"
                : isSelected
                ? "bg-blue-100"
                : "hover:bg-gray-100"
            }`}
          onClick={() => {
            if (!isWeekend) {
              setSelectedDate(date);
            }
          }}
        >
          <div className="flex justify-between items-start">
            <div
              className={`font-semibold ${isSelected ? "text-blue-600" : ""} ${
                isToday
                  ? "rounded-full bg-zinc-950 text-white w-6 h-6 flex items-center justify-center"
                  : ""
              } text-sm sm:text-base`}
            >
              {day}
            </div>
            {dayStatus && getStatusBadge(dayStatus.status)}
          </div>
          <div className="mt-1 space-y-1"></div>
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

    return (
      <>
        <div className="mt-6 flex space-x-4">
          <div className="w-1/2 pr-2 border-r border-gray-300">
            <EmployeeStatusPieChart employees={employeesAM} />
            {/* AM Count */}
            <h4 className="text-3xl font-bold">AM Status</h4>
            <div className="mt-4 flex justify-evenly items-center border border-gray-300 rounded-lg p-4">
              <div className="text-center flex-grow bg-gray-100 p-4 rounded-md">
                <h5 className="text-3xl">{totalAMCount}</h5>
                <p className="text-sm text-gray-500">WFH</p>
              </div>
              <div className="border-l border-gray-300 h-12 mx-4"></div>
              <div className="text-center flex-grow bg-green-100 p-4 rounded-md">
                <h5 className="text-3xl">{totalAMinOfficeCount}</h5>
                <p className="text-sm text-gray-500">In Office</p>
              </div>
            </div>
            {/* Search Input */}
            <input
              type="text"
              className="p-2 mt-4 bg-gray-100 border border-gray-300 rounded-md w-full mb-4"
              placeholder="Search employees..."
              value={searchTermAM}
              onChange={(e) => setSearchTermAM(e.target.value)}
            />
            {/* AM WFH  */}
            <div className="flex space-x-4 mt-2">
              <div className="w-1/2">
                <h6 className="font-semibold">Working From Home:</h6>
                <ul className="list-disc pl-5">
                  {filteredEmployeesAM
                    .filter(
                      (employee) =>
                        employee.status === "AM" || employee.status === "Full"
                    )
                    .sort((a, b) =>
                      a.fullName
                        .split(" ")[1]
                        .localeCompare(b.fullName.split(" ")[1])
                    ) // Sorting by last name
                    .map((employee) => (
                      <li key={employee.id}>{employee.fullName}</li>
                    ))}
                </ul>
              </div>
              {/* AM in office */}
              <div className="w-1/2">
                <h6 className="font-semibold">In Office:</h6>
                <ul className="list-disc pl-5">
                  {filteredEmployeesAM
                    .filter((employee) => employee.status === "In Office")
                    .sort((a, b) =>
                      a.fullName
                        .split(" ")[1]
                        .localeCompare(b.fullName.split(" ")[1])
                    ) // Sorting by last name
                    .map((employee) => (
                      <li key={employee.id}>{employee.fullName}</li>
                    ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="w-1/2">
            <EmployeeStatusPieChart employees={employeesPM} />
            {/* PM Count */}
            <h4 className="text-3xl font-bold">PM Status</h4>
            <div className="mt-4 flex justify-evenly items-center border border-gray-300 rounded-lg p-4">
              <div className="text-center flex-grow bg-gray-100 p-4 rounded-md">
                <h5 className="text-3xl">{totalPMCount}</h5>
                <p className="text-sm text-gray-500">WFH</p>
              </div>
              <div className="border-l border-gray-300 h-12 mx-4"></div>
              <div className="text-center flex-grow bg-green-100 p-4 rounded-md">
                <h5 className="text-3xl">{totalPMinOfficeCount}</h5>
                <p className="text-sm text-gray-500">In Office</p>
              </div>
            </div>
            {/* Search Input */}
            <input
              type="text"
              className="p-2 mt-4 bg-gray-100 border border-gray-300 rounded-md w-full mb-4"
              placeholder="Search employees..."
              value={searchTermPM}
              onChange={(e) => setSearchTermPM(e.target.value)}
            />
            {/* PM WFH  */}
            <div className="flex space-x-4 mt-2">
              <div className="w-1/2">
                <h6 className="font-semibold">Working From Home:</h6>
                <ul className="list-disc pl-5">
                  {filteredEmployeesPM
                    .filter(
                      (employee) =>
                        employee.status === "PM" || employee.status === "Full"
                    )
                    .sort((a, b) =>
                      a.fullName
                        .split(" ")[1]
                        .localeCompare(b.fullName.split(" ")[1])
                    ) // Sorting by last name
                    .map((employee) => (
                      <li key={employee.id}>{employee.fullName}</li>
                    ))}
                </ul>
              </div>
              <div className="w-1/2">
                <h6 className="font-semibold">In Office:</h6>
                <ul className="list-disc pl-5">
                  {filteredEmployeesPM
                    .filter((employee) => employee.status === "In Office")
                    .sort((a, b) =>
                      a.fullName
                        .split(" ")[1]
                        .localeCompare(b.fullName.split(" ")[1])
                    ) // Sorting by last name
                    .map((employee) => (
                      <li key={employee.id}>{employee.fullName}</li>
                    ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4"></div>
      </>
    );
  };

  const renderWeekView = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

    return (
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        {Array.from({ length: 7 }, (_, i) => {
          const date = new Date(startOfWeek);
          date.setDate(startOfWeek.getDate() + i);
          
          const dayEmployees = employees.filter((e) => {
            return true;
          });

          const wfhCount = dayEmployees.filter(employee => employee.status === 'WFH').length;
          const inOfficeCount = dayEmployees.filter(employee => employee.status === 'In Office').length;

          return (
            <Card key={i}>
              <CardContent>    
                <h3 className="font-bold mb-2">{daysOfWeek[i]}</h3>
                <p className="text-sm mb-2">{date.toLocaleDateString()}</p>
                {dayEmployees.map((employee) => (
                  <div key={employee.id} className="mb-2">
                    <p>{employee.name}</p>
                    <Badge>{employee.status}</Badge>
                  </div>
                ))}
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
                <Button variant="outline" size="icon" onClick={prev}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h2 className="text-lg sm:text-xl font-semibold whitespace-nowrap">
                  {currentView === "day"
                    ? `${currentDate.getDate()} ${
                        months[currentDate.getMonth()]
                      }`
                    : `${
                        months[currentDate.getMonth()]
                      } ${currentDate.getFullYear()}`}{" "}
                </h2>
                <Button variant="outline" size="icon" onClick={next}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
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
              {/* Month view */}
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
      {selectedDate && (
        <footer className="bg-white shadow-sm py-2 sm:py-4 px-4 sm: px-6 mt-4">
          <p className="text-base sm:text-lg font-semibold">
            Selected Date: {selectedDate.toDateString()}
          </p>
        </footer>
      )}
    </div>
  );
}
