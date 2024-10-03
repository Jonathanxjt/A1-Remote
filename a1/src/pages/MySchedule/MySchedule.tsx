import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import axios from "axios"

const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
]

type WorkStatus = "AM" | "PM" | "Full Day" | "Pending" | null

interface WorkRequest {
  id: number
  date: Date
  title: string
  type: WorkStatus
  status: WorkStatus
  reportingManager: string
}

interface Employee {
  id: number
  name: string
  status: "In Office" | "WFH" | "On Leave"
  reportingManager: string
}

export default function Component() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [currentView, setCurrentView] = useState("month")
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [workRequests, setWorkRequests] = useState<WorkRequest[]>([])
  const [currentDateTime, setCurrentDateTime] = useState(new Date())
  const [employees, setEmployees] = useState<Employee[]>([])

  const parseDate = (dateStr: string): Date => {
    return new Date(dateStr)
  }

  useEffect(() => {
    const fetchWorkRequests = async () => {
      try {
        const response = await axios.get("http://localhost:5003/work_request/150318/employee")
        if (response.data.code === 200) {
          const requests = response.data.data.work_request
            .filter((request: any) => request.status === "Approved" || request.status === "Pending")
            .map((request: any) => ({
              id: request.request_id,
              date: parseDate(request.request_date),
              title: request.reason,
              type: request.request_type as WorkStatus,
              status: request.status === "Pending" ? "Pending" : request.request_type as WorkStatus,
              reportingManager: request.reporting_manager || "Unknown"
            }))
          setWorkRequests(requests)
        } else {
          console.log("No work requests found.")
        }
      } catch (error) {
        console.error("Error fetching work requests:", error)
      }
    }

    fetchWorkRequests()

    // Mock employee data - replace with actual API call
    setEmployees([
      { id: 1, name: "John Doe", status: "In Office", reportingManager: "Jane Smith" },
      { id: 2, name: "Alice Johnson", status: "WFH", reportingManager: "Bob Brown" },
      { id: 3, name: "Charlie Davis", status: "On Leave", reportingManager: "Jane Smith" },
    ])

    const timer = setInterval(() => {
      setCurrentDateTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const firstDayOfMonth = new Date(year, month, 1).getDay()
    return { daysInMonth, firstDayOfMonth }
  }

  const { daysInMonth, firstDayOfMonth } = getDaysInMonth(currentDate)

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const getStatusBadge = (status: WorkStatus) => {
    if (!status) return null
    const colorMap = {
      "AM": "bg-green-500",
      "PM": "bg-green-500",
      "Full Day": "bg-green-500",
      "Pending": "bg-yellow-500",
    }
    return (
      <Badge className={`${colorMap[status]} text-white text-xs px-1 py-0.5 rounded`}>
        {status}
      </Badge>
    )
  }

  const renderMonthView = () => {
    const days = []
    const today = new Date()
    const prevMonthDays = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0).getDate()

    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const day = prevMonthDays - i
      days.push(
        <div key={`prev-${day}`} className="p-1 sm:p-2 border border-gray-200 min-h-[60px] sm:min-h-[100px] bg-gray-100 opacity-50">
          <div className="font-semibold text-gray-400 text-sm sm:text-base">{day}</div>
        </div>
      )
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
      const dayOfWeek = date.getDay()
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
      const dayStatus = workRequests.find(
        (request) =>
          request.date.getDate() === day &&
          request.date.getMonth() === currentDate.getMonth() &&
          request.date.getFullYear() === currentDate.getFullYear()
      )

      const isSelected = selectedDate &&
        selectedDate.getDate() === day &&
        selectedDate.getMonth() === currentDate.getMonth() &&
        selectedDate.getFullYear() === currentDate.getFullYear()

      const isToday = today.getDate() === day &&
        today.getMonth() === currentDate.getMonth() &&
        today.getFullYear() === currentDate.getFullYear()

      days.push(
        <div
          key={day}
          className={`p-1 sm:p-2 border border-gray-200 min-h-[60px] sm:min-h-[100px] cursor-pointer transition-colors duration-200 
            ${isWeekend ? 'bg-gray-300 cursor-not-allowed opacity-60' : isSelected ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
          onClick={() => {
            if (!isWeekend) {
              setSelectedDate(date)
            }
          }}
        >
          <div className="flex justify-between items-start">
            <div className={`font-semibold ${isSelected ? 'text-blue-600' : ''} ${isToday ? 'rounded-full bg-zinc-950 text-white w-6 h-6 flex items-center justify-center' : ''} text-sm sm:text-base`}>
              {day}
            </div>
            {dayStatus && getStatusBadge(dayStatus.status)}
          </div>
          <div className="mt-1 space-y-1">
          </div>
        </div>
      )
    }

    const remainingDays = 7 - ((firstDayOfMonth + daysInMonth) % 7)
    if (remainingDays < 7) {
      for (let day = 1; day <= remainingDays; day++) {
        days.push(
          <div key={`next-${day}`} className="p-1 sm:p-2 border border-gray-200 min-h-[60px] sm:min-h-[100px] bg-gray-100 opacity-50">
            <div className="font-semibold text-gray-400 text-sm sm:text-base">{day}</div>
          </div>
        )
      }
    }

    return days
  }

  const renderDayView = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent>
            <h3 className="font-bold mb-2">In Office</h3>
            {employees.filter(e => e.status === "In Office").map(employee => (
              <div key={employee.id} className="mb-2">
                <p>{employee.name}</p>
                <p className="text-sm text-gray-500">Manager: {employee.reportingManager}</p>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <h3 className="font-bold mb-2">Working From Home</h3>
            {employees.filter(e => e.status === "WFH").map(employee => (
              <div key={employee.id} className="mb-2">
                <p>{employee.name}</p>
                <p className="text-sm text-gray-500">Manager: {employee.reportingManager}</p>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <h3 className="font-bold mb-2">On Leave</h3>
            {employees.filter(e => e.status === "On Leave").map(employee => (
              <div key={employee.id} className="mb-2">
                <p>{employee.name}</p>
                <p className="text-sm text-gray-500">Manager: {employee.reportingManager}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderWeekView = () => {
    const startOfWeek = new Date(currentDate)
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay())
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        {Array.from({ length: 7 }, (_, i) => {
          const date = new Date(startOfWeek)
          date.setDate(startOfWeek.getDate() + i)
          const dayEmployees = employees.filter(e => {
            // This is a simplification. In a real app, you'd check if the employee's status for this specific date matches
            return true
          })
          
          return (
            <Card key={i}>
              <CardContent>
                <h3 className="font-bold mb-2">{daysOfWeek[i]}</h3>
                <p className="text-sm mb-2">{date.toLocaleDateString()}</p>
                {dayEmployees.map(employee => (
                  <div key={employee.id} className="mb-2">
                    <p>{employee.name}</p>
                    <Badge>{employee.status}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )
        })}
      </div>
    )
  }

  return (
    <div className="bg-gray-100 min-h-screen">
      <header className="bg-white shadow-sm py-4 px-4 sm:px-6 sticky top-0 z-10">
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">My Schedule</h1>
          <p className="text-sm text-gray-600">
            {currentDateTime.toLocaleString()}
          </p>
        </div>
      </header>
      <main className="p-4 sm:p-6">
        <Card className="w-full">
          <Tabs value={currentView} onValueChange={setCurrentView} className="w-full">
            <div className="flex flex-col sm:flex-row justify-between items-center p-4 border-b space-y-2 sm:space-y-0">
              <TabsList className="mb-2 sm:mb-0">
                <TabsTrigger value="day">Day</TabsTrigger>
                <TabsTrigger value="week">Week</TabsTrigger>
                <TabsTrigger value="month">Month</TabsTrigger>
              </TabsList>
              <div className="flex items-center space-x-2 sm:space-x-4">
                <Button variant="outline" size="icon" onClick={prevMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h2 className="text-lg sm:text-xl font-semibold whitespace-nowrap">
                  {months[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h2>
                <Button variant="outline" size="icon" onClick={nextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <Select
                value={currentDate.getMonth().toString()}
                onValueChange={(value) =>
                  setCurrentDate(new Date(currentDate.getFullYear(), parseInt(value), 1))
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
              <TabsContent value="day">
                {renderDayView()}
              </TabsContent>
              <TabsContent value="week">
                {renderWeekView()}
              </TabsContent>
              {/* Month view */}
              <TabsContent value="month">
                <div className="grid grid-cols-7 gap-0">
                  {daysOfWeek.map((day) => (
                    <div key={day} className="font-semibold text-center p-1 sm:p-2 text-sm sm:text-base">
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
  )
}