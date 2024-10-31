import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import axios from "axios";
import {
  addDays,
  endOfWeek,
  format,
  isAfter,
  isSaturday,
  isSunday,
  startOfDay,
  endOfDay,
  startOfWeek,
  isWithinInterval,
} from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { Flip, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function WorkFromHomeForm() {
  const navigate = useNavigate();

  const [requests, setRequests] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [open, setOpen] = useState(false)
  const [exceed, setExceed] = useState<boolean>(false)


  const fetchRequests = async (date: Date) => {
    try {
      const staffId = sessionStorage.getItem("staff_id");
      if (staffId) {
        const response = await axios.get(
          `http://localhost:5003/work_request/${staffId}/employee`
        );

        if (response.data.code === 200) {
          const startOfSelectedWeek = startOfDay(startOfWeek(date, { weekStartsOn: 1 }));
          const endOfSelectedWeek = endOfDay(endOfWeek(date, { weekStartsOn: 1 }));
          console.log("Selected week:", startOfSelectedWeek, endOfSelectedWeek);
          const filteredRequests = response.data.data.work_request.filter(
            (request: any) => {
              const requestDate = new Date(request.request_date)
              return (
                (request.status === "Approved" || request.status === "Pending") &&
                isWithinInterval(requestDate, {
                  start: startOfSelectedWeek,
                  end: endOfSelectedWeek,
                })
              );
            }
          );

          setRequests(filteredRequests);
          console.log("Filtered work requests for the selected week:", filteredRequests);
          setExceed(filteredRequests.length >= 2);
        } else {
          console.error("Error fetching work requests:", response.data.message);
        }
      } else {
        console.error("No staff_id found in sessionStorage.");
      }
    } catch (error) {
      console.error("Error fetching work requests:", error);
    }
  };


  useEffect(() => {
    if (selectedDate) {
      fetchRequests(selectedDate);
    }
  }, [selectedDate]);

  const form = useForm({
    defaultValues: {
      date: undefined,
      timePeriod: "",
      reasons: "",
    },
    mode: "onTouched",
  });

  const onSubmit = async (data: {
    date: Date | undefined;
    timePeriod: string;
    reasons: string;
  }) => {
    if (requests.length >= 2) {
      setShowConfirmation(true);
      return;
    }

    await submitRequest(data);
  };

  const submitRequest = async (data: {
    date: Date | undefined;
    timePeriod: string;
    reasons: string;
  }) => {
    const staff_id = sessionStorage.getItem("staff_id");
    if (!staff_id) {
      toast.error("Staff ID not found. Please log in again.", {
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
      return;
    }

    const requestData = {
      staff_id,
      request_type: data.timePeriod,
      request_date: data.date ? format(data.date, "yyyy-MM-dd") : undefined,
      reason: data.reasons,
      exceed: exceed
    };

    try {
      const response = await axios.post(
        "http://localhost:5005/New_WR",
        requestData
      );

      if (response.data.code === 201) {
        toast.success("Request Submitted Successfully!", {
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
        setTimeout(() => {
          navigate("/MyRequests");
        }, 2500);
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        "Error submitting request. Please try again.";

      toast.error(`Error: ${errorMessage}`, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
        transition: Flip,
      });

      console.error("Error submitting request:", errorMessage);
    }
    finally {
      setExceed(false);
    }
  };

  // Function to disable weekends and dates less than 24 hours away
  const disabledDays = (date: Date) => {
    const today = startOfDay(new Date());
    const tomorrow = addDays(today, 1); // Only allow dates at least 24 hours from now
    return isSaturday(date) || isSunday(date) || !isAfter(date, tomorrow);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-center">
          Work from Home (WFH) Request
        </h1>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="date"
              rules={{ required: "Please select a date" }}
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <label className="text-gray-700">
                    Date of Work from Home
                  </label>
                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "calendar-btn w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                          onClick={() => setOpen(true)}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto p-0"
                      align="start"
                      side="bottom"
                    >
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => {
                          field.onChange(date);
                          setSelectedDate(date);
                          setOpen(false);

                        }}
                        disabled={disabledDays}
                        initialFocus
                        className="rounded-md border"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="timePeriod"
              rules={{ required: "Please select a time period" }} // Required validation
              render={({ field }) => (
                <FormItem>
                  <label className="text-gray-700">Type of Request</label>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="AM">AM</SelectItem>
                      <SelectItem value="PM">PM</SelectItem>
                      <SelectItem value="Full Day">Full day</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reasons"
              rules={{ required: "Please provide reasons for your request" }} // Required validation
              render={({ field }) => (
                <FormItem>
                  <label className="text-gray-700">Reason</label>
                  <FormControl>
                    <Textarea
                      placeholder="Please provide reasons for your work from home request"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full">
              Submit Request
            </Button>
          </form>
        </Form>
        {showConfirmation && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center">
            <div className="bg-white p-4 rounded shadow-md max-w-sm w-full">
              <p className="mb-4">
                You have exceeded the 2 WFH requests for this week. Do you want
                to proceed?
              </p>
              <div className="flex justify-end space-x-4">
  
                <Button variant="outline" onClick={() => setShowConfirmation(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    setShowConfirmation(false);
                    form.handleSubmit(submitRequest)();
                  }}
                >
                  Proceed
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
