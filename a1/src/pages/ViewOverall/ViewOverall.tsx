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
import { useNavigate } from "react-router-dom";
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

export default function Component() {
  const navigate = useNavigate();
  useEffect(() => {
    const userData = sessionStorage.getItem("user");

    if (!userData) {
      navigate("/login");
      return; // Exit the useEffect early if no userData
    }
    const user = JSON.parse(userData);
    if (user.role !== 1) {
      navigate("/");
      return; // Exit the useEffect early if user role is not 1
    }
  }, [navigate]);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState("day");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [selectedDepartment, setSelectedDepartment] = useState("All");
  const [employeesAM, setEmployeesAM] = useState<Employee[]>([]);
  const [employeesPM, setEmployeesPM] = useState<Employee[]>([]);
  const [dayLoading, setDayLoading] = useState<boolean>(true); // Add loading state

  useEffect(() => {
    const fetchData = async () => {
      setDayLoading(true);
      await fetchEmployeesInDeptDayView(); // Wait for the fetch to complete
      setDayLoading(false); // Set loading state to false after fetch completes
    };
    fetchData();
  }, [selectedDepartment, currentDate]);

  useEffect(() => {
    const handleResize = () => {
      window.location.reload(); // Refresh page on resize
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const handleDateSelection = (date: Date) => {
    const dayOfWeek = date.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
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

  const fetchEmployeesInDeptWeekView = async (date: Date) => {
    try {
      const endpoint =
        selectedDepartment === "All"
          ? `http://localhost:5004/schedule/all` // Change to employee endpoint when 'All' is selected
          : `http://localhost:5004/schedule/dept/${selectedDepartment}`; // Default to department-specific endpoint
      const response = await axios.get(endpoint);
      if (response.data.code === 200) {
        let wfhCountAM = 0;
        let inOfficeCountAM = 0;
        let wfhCountPM = 0;
        let inOfficeCountPM = 0;

        response.data.data.forEach((item: any) => {
          const schedule = item.schedule;
          if (!schedule || schedule === "No schedule found.") {
            inOfficeCountAM++;
            inOfficeCountPM++;
          } else {
            const todaySchedule = schedule.filter((s: any) => {
              const scheduleDate = new Date(s.date);
              return isSameDay(scheduleDate, date);
            });

            if (todaySchedule.some((s: any) => s.request_type === "Full Day" && s.status === "Approved")) {
              wfhCountAM++;
              wfhCountPM++;
            } else {
              if (todaySchedule.some((s: any) => s.request_type === "AM" && s.status === "Approved")) {
                wfhCountAM++; // Employee is WFH for AM
              } else {
                inOfficeCountAM++; // Employee is in office for AM
              }
            
              if (todaySchedule.some((s: any) => s.request_type === "PM" && s.status === "Approved")) {
                wfhCountPM++; // Employee is WFH for PM
              } else {
                inOfficeCountPM++; // Employee is in office for PM
              }
            }         
          }
        });
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

  const fetchEmployeesInDeptDayView = async () => {
    try {
      const endpoint =
        selectedDepartment === "All"
          ? `http://localhost:5004/schedule/all`
          : `http://localhost:5004/schedule/dept/${selectedDepartment}`;
      const response = await axios.get(endpoint);

      if (response.data.code === 200) {
        const employeesAMList: Employee[] = [];
        const employeesPMList: Employee[] = [];

        response.data.data.forEach((item: any) => {
          const employee = item.employee;
          const schedule = item.schedule;

          const employeeData: Employee = {
            staff_id: employee.staff_id,
            staff_fname: employee.staff_fname,
            staff_lname: employee.staff_lname,
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

  useEffect(() => {
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
      let previousDate = new Date(currentDate); 
      previousDate.setDate(previousDate.getDate() - 1); 

      const dayOfWeek = previousDate.getDay();
      if (dayOfWeek === 0) {
        previousDate.setDate(previousDate.getDate() - 2);
      } else if (dayOfWeek === 6) {
        previousDate.setDate(previousDate.getDate() - 1);
      }
      setCurrentDate(previousDate);
    } else if (currentView === "month") {
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
      let nextDate = new Date(currentDate); 
      nextDate.setDate(nextDate.getDate() + 1); 
      const dayOfWeek = nextDate.getDay();
      if (dayOfWeek === 6) {
        nextDate.setDate(nextDate.getDate() + 2);
      } else if (dayOfWeek === 0) {
        nextDate.setDate(nextDate.getDate() + 1);
      }
      setCurrentDate(nextDate);
      setSelectedDate(nextDate);
    } else if (currentView === "month") {
      const nextMonthDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        1
      );
      setCurrentDate(nextMonthDate);
    }
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
              handleDateSelection(date);
              console.log("Date selected:", date);
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
    const [isWFHExpandedAM, setIsWFHExpandedAM] = useState(false);
    const [isInOfficeExpandedAM, setIsInOfficeExpandedAM] = useState(false);
    const [isWFHExpandedPM, setIsWFHExpandedPM] = useState(false);
    const [isInOfficeExpandedPM, setIsInOfficeExpandedPM] = useState(false);

    const filteredEmployeesAM = employeesAM.filter((employee) =>
      employee.fullName.toLowerCase().includes(searchTermAM.toLowerCase())
    );
    const filteredEmployeesPM = employeesPM.filter((employee) =>
      employee.fullName.toLowerCase().includes(searchTermPM.toLowerCase())
    );

    useEffect(() => {
      if (searchTermAM) {
        setIsWFHExpandedAM(true);
        setIsInOfficeExpandedAM(true);
      } else {
        setIsWFHExpandedAM(false);
        setIsInOfficeExpandedAM(false);
      }

      if (searchTermPM) {
        setIsWFHExpandedPM(true);
        setIsInOfficeExpandedPM(true);
      } else {
        setIsWFHExpandedPM(false);
        setIsInOfficeExpandedPM(false);
      }
    }, [searchTermAM, searchTermPM]);

    if (dayLoading) {
      return <div>Loading...</div>;
    }

    return (
      <>
        <div className="mt-6 flex space-x-4">
          <div className="w-1/2 pr-4 border-r border-gray-300">
            <EmployeeStatusPieChart employees={employeesAM} />
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
                      .filter(
                        (employee) =>
                          employee.status === "AM" || employee.status === "Full"
                      )
                      .sort((a, b) =>
                        a.fullName
                          .split(" ")[1]
                          .localeCompare(b.fullName.split(" ")[1])
                      )
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
                      .sort((a, b) =>
                        a.fullName
                          .split(" ")[1]
                          .localeCompare(b.fullName.split(" ")[1])
                      )
                      .map((employee) => (
                        <li key={employee.id}>{employee.fullName}</li>
                      ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          <div className="w-1/2">
            <EmployeeStatusPieChart employees={employeesPM} />
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
                      .filter(
                        (employee) =>
                          employee.status === "PM" || employee.status === "Full"
                      )
                      .sort((a, b) =>
                        a.fullName
                          .split(" ")[1]
                          .localeCompare(b.fullName.split(" ")[1])
                      )
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
                      .sort((a, b) =>
                        a.fullName
                          .split(" ")[1]
                          .localeCompare(b.fullName.split(" ")[1])
                      )
                      .map((employee) => (
                        <li key={employee.id}>{employee.fullName}</li>
                      ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4"></div>
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
        setLoading(true);
        let data = [];
        for (let i = 0; i < 5; i++) {
          const date = startOfWeek;
          date.setDate(date.getDate() - date.getDay() + 1 + i); // Get Mon-Fri dates
          const dayData = await fetchEmployeesInDeptWeekView(date);
          data.push(dayData);
        }
        setWeekData(data.filter((dayData) => dayData !== undefined));
        setLoading(false);
      };
      fetchWeekData();
    }, [selectedDepartment, currentDate]);

    if (loading) {
      return <div>Loading...</div>;
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {weekData.map((dayCount, i) => {
          const currentDate = new Date(startOfWeek);
          currentDate.setDate(startOfWeek.getDate() + i);

          return (
            <Card key={i} className="p-0">
              <CardContent className="p-3">
                <h3 className="font-bold text-xl mb-2">{daysOfWeek[i]}</h3>
                <p className="text-sm mb-2">
                  {currentDate.toLocaleDateString()}{" "}
                </p>

                <div className="mt-4 mb-2 bg-gray-100 p-2 rounded-md">
                  {" "}
                  <h4 className="font-bold">AM:</h4>
                  <div className="flex justify-around items-center w-full pt-2">
                    {" "}
                    <div className="flex-1 border-r border-gray-300 pr-2">
                      <p className="text-sm text-center text-gray-500">WFH:</p>
                      <p className="text-xl text-center">
                        {dayCount?.wfhCountAM}
                      </p>
                    </div>
                    <div className="flex-1 pl-2">
                      <p className="text-sm text-center text-gray-500">
                        Office:
                      </p>
                      <p className="text-xl text-center">
                        {dayCount?.inOfficeCountAM}
                      </p>
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
                      <p className="text-xl text-center">
                        {dayCount?.wfhCountPM}
                      </p>
                    </div>
                    <div className="flex-1 pl-2">
                      <p className="text-sm text-center text-gray-500">
                        Office:
                      </p>
                      <p className="text-xl text-center">
                        {dayCount?.inOfficeCountPM}
                      </p>
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
            Company Schedule
          </h1>
          <p className="text-sm text-gray-600">
            {currentDateTime.toLocaleString()}
          </p>
        </div>
      </header>
      <main className="p-4 sm:p-6">
        <Card className="w-full">
          <div className="mt-4">
            {" "}
            <div className="flex justify-center items-center">
              {" "}
              <label
                htmlFor="department-select"
                className="block text-xl font-medium mr-2 text-gray-700"
              >
                Department:
              </label>
              <select
                id="department-select"
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="block text-md w-1/4 pl-2 pr-2 py-2 text-base bg-gray-100 border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md" // Set width to 50%
              >
                <option value="All">All</option>
                <option value="Consultancy">Consultancy</option>
                <option value="Engineering">Engineering</option>
                <option value="HR">Human Resource</option>
                <option value="IT">IT</option>
                <option value="Sales">Sales</option>
                <option value="Solutioning">Solutioning</option>
              </select>
            </div>
          </div>

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
                    ? `${currentDate.getDate()} ${
                        months[currentDate.getMonth()]
                      }`
                    : `${
                        months[currentDate.getMonth()]
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
