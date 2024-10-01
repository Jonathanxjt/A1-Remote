"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

const sampleEvents = [
  {
    id: 1,
    date: new Date(2023, 9, 5),
    title: "Team Meeting",
    time: "10:00 AM",
  },
  {
    id: 2,
    date: new Date(2023, 9, 10),
    title: "Project Deadline",
    time: "11:00 AM",
  },
  {
    id: 3,
    date: new Date(2023, 9, 15),
    title: "Client Presentation",
    time: "2:00 PM",
  },
  {
    id: 4,
    date: new Date(2023, 9, 20),
    title: "Conference Call",
    time: "3:30 PM",
  },
  {
    id: 5,
    date: new Date(2023, 9, 25),
    title: "Team Building",
    time: "4:00 PM",
  },
];

export default function Component() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState("month");

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    return { daysInMonth, firstDayOfMonth };
  };

  const { daysInMonth, firstDayOfMonth } = getDaysInMonth(currentDate);

  const prevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  };

  const nextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
  };

  const renderMonthView = () => {
    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(
        <div key={`empty-${i}`} className="p-2 border border-gray-200" />
      );
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        day
      );
      const events = sampleEvents.filter(
        (event) =>
          event.date.getDate() === day &&
          event.date.getMonth() === currentDate.getMonth() &&
          event.date.getFullYear() === currentDate.getFullYear()
      );
      days.push(
        <div key={day} className="p-2 border border-gray-200 min-h-[120px]">
          <div className="font-semibold">{day}</div>
          {events.map((event) => (
            <div
              key={event.id}
              className="text-xs mt-1 bg-blue-100 p-1 rounded"
            >
              <div className="font-semibold">{event.title}</div>
              <div>{event.time}</div>
            </div>
          ))}
        </div>
      );
    }
    return days;
  };

  const renderDayView = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    return (
      <div className="grid grid-cols-1 gap-1">
        {hours.map((hour) => (
          <div
            key={hour}
            className="flex items-center border-b border-gray-200 py-2"
          >
            <div className="w-16 text-right pr-2 text-sm text-gray-500">
              {hour === 0
                ? "12 AM"
                : hour < 12
                ? `${hour} AM`
                : hour === 12
                ? "12 PM"
                : `${hour - 12} PM`}
            </div>
            <div className="flex-grow h-8 relative">
              {sampleEvents
                .filter(
                  (event) =>
                    event.date.getDate() === currentDate.getDate() &&
                    event.date.getMonth() === currentDate.getMonth() &&
                    event.date.getFullYear() === currentDate.getFullYear() &&
                    parseInt(event.time.split(":")[0]) === (hour % 12 || 12)
                )
                .map((event) => (
                  <div
                    key={event.id}
                    className="absolute left-0 right-0 bg-blue-100 p-1 rounded text-xs"
                    style={{ top: "0" }}
                  >
                    {event.title} - {event.time}
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderWeekView = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      return day;
    });

    return (
      <div className="grid grid-cols-8 gap-1">
        <div className="border-b border-gray-200 p-2"></div>
        {weekDays.map((day, index) => (
          <div
            key={index}
            className="border-b border-gray-200 p-2 text-center font-semibold"
          >
            {daysOfWeek[day.getDay()]} {day.getDate()}
          </div>
        ))}
        {Array.from({ length: 24 }, (_, hour) => (
          <>
            <div
              key={`hour-${hour}`}
              className="border-b border-gray-200 p-2 text-sm text-gray-500"
            >
              {hour === 0
                ? "12 AM"
                : hour < 12
                ? `${hour} AM`
                : hour === 12
                ? "12 PM"
                : `${hour - 12} PM`}
            </div>
            {weekDays.map((day, dayIndex) => (
              <div
                key={`${hour}-${dayIndex}`}
                className="border-b border-gray-200 p-2 relative"
              >
                {sampleEvents
                  .filter(
                    (event) =>
                      event.date.getDate() === day.getDate() &&
                      event.date.getMonth() === day.getMonth() &&
                      event.date.getFullYear() === day.getFullYear() &&
                      parseInt(event.time.split(":")[0]) === (hour % 12 || 12)
                  )
                  .map((event) => (
                    <div
                      key={event.id}
                      className="absolute left-0 right-0 bg-blue-100 p-1 rounded text-xs"
                      style={{ top: "0" }}
                    >
                      {event.title}
                    </div>
                  ))}
              </div>
            ))}
          </>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <header className="bg-white shadow-sm py-4 px-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">
            Calendar Dashboard
          </h1>
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Add Event
          </Button>
        </div>
      </header>
      <main className="flex-grow p-6">
        <Card className="w-full h-full">
          <Tabs
            value={currentView}
            onValueChange={setCurrentView}
            className="w-full h-full flex flex-col"
          >
            <div className="flex justify-between items-center p-4 border-b">
              <TabsList>
                <TabsTrigger value="day">Day</TabsTrigger>
                <TabsTrigger value="week">Week</TabsTrigger>
                <TabsTrigger value="month">Month</TabsTrigger>
              </TabsList>
              <div className="flex items-center space-x-4">
                <Button variant="outline" size="icon" onClick={prevMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h2 className="text-xl font-semibold">
                  {months[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h2>
                <Button variant="outline" size="icon" onClick={nextMonth}>
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
                <SelectTrigger className="w-[180px]">
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
            <CardContent className="flex-grow overflow-auto">
              <TabsContent value="day" className="h-full">
                {renderDayView()}
              </TabsContent>
              <TabsContent value="week" className="h-full">
                {renderWeekView()}
              </TabsContent>
              <TabsContent value="month" className="h-full">
                <div className="grid grid-cols-7 gap-1">
                  {daysOfWeek.map((day) => (
                    <div key={day} className="font-semibold text-center p-2">
                      {day}
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
