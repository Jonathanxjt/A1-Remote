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
  format,
  isAfter,
  isSaturday,
  isSunday,
  startOfDay,
} from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { Flip, toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function WorkFromHomeForm() {
  // React Hook Form for handling form state and validation
  const form = useForm({
    defaultValues: {
      date: undefined,
      timePeriod: "",
      reasons: "",
    },
    mode: "onTouched", // Validate when the field is touched
  });

  // Handle form submission with an Axios POST request to the backend
  const onSubmit = async (data: {
    date: Date | undefined;
    timePeriod: string;
    reasons: string;
  }) => {
    const staff_id = sessionStorage.getItem("staff_id"); // Pull staff_id from sessionStorage
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
      staff_id, // Fetch staff_id from sessionStorage
      request_type: data.timePeriod,
      // Format the date as a local date before submitting
      request_date: data.date ? format(data.date, "yyyy-MM-dd") : undefined, 
      reason: data.reasons,
    };

    try {
      const response = await axios.post(
        "http://localhost:5005/New_WR", // Your API endpoint
        requestData
      );

      if (response.data.code === 201) {
        // Show success message
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
      }
    } catch (error: any) {
      // Extract error message from Axios response
      const errorMessage =
        error.response?.data?.message ||
        "Error submitting request. Please try again.";

      // Show error message in toast
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
  };

  // Function to disable weekends and dates less than 24 hours away
  const disabledDays = (date: Date) => {
    const today = startOfDay(new Date());
    const tomorrow = addDays(today, 1); // Only allow dates at least 24 hours from now
    return isSaturday(date) || isSunday(date) || !isAfter(date, tomorrow);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6">
      {/* Add the ToastContainer */}
      <ToastContainer />
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-center">
          Work from Home (WFH) Request
        </h1>

        {/* Form Structure */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Date Field */}
            <FormField
              control={form.control}
              name="date"
              rules={{ required: "Please select a date" }} // Required validation
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <label className="text-gray-700">
                    Date of Work from Home
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "calendar-btn w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
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
                          // Close the popover when a date is selected
                          document.body.click();
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

            {/* Time Period Field */}
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

            {/* Reasons Field */}
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

            {/* Submit Button */}
            <Button type="submit" className="w-full">
              Submit Request
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
