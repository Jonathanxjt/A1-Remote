import axios from "axios";
import { format, addDays, isTomorrow } from "date-fns";
import { useEffect } from "react";

const AutoRejector = () => {
  // Function to automatically reject work requests
  const autoRejectRequests = async () => {
    try {
      // Get today's date and tomorrow's date for filtering
      const today = new Date();
      const tomorrow = addDays(today, 1);

      const startDate = format(today, "yyyy-MM-dd");
      const endDate = format(tomorrow, "yyyy-MM-dd");

      // Fetch work requests for the next day (tomorrow)
      const response = await axios.get("http://localhost:5003/work_request", {
        params: {
          start_date: startDate,
          end_date: endDate,
        },
      });

      if (response.data.code === 200) {
        // Filter for pending requests
        const pendingRequests = response.data.data.work_request.filter(
          (request: any) => request.status === "Pending"
        );

        // Loop through pending requests and reject them
        for (const request of pendingRequests) {
          if (isTomorrow(new Date(request.request_date))) {
            try {
              await axios.put(
                `http://localhost:5005/scheduler/${request.request_id}/update_work_request_and_schedule`,
                {
                  status: "Rejected",
                  comments:
                    "Automatically rejected by System.",
                }
              );
              console.log(`Request ID ${request.request_id} rejected.`);
            } catch (err) {
              console.error(`Error rejecting request ID ${request.request_id}:`, err);

            }
          }
        }
      } else {
        console.error("Error fetching work requests:", response.data.message);
      }
    } catch (error) {
      console.error("Error fetching work requests:", error);
    }
  };

  // Set up an interval to run the request every day (or every X hours)
  useEffect(() => {
    const interval = setInterval(() => {
      autoRejectRequests(); // Call the function at the scheduled interval
    }, 24 * 60 * 60 * 1000); // 24 hours in milliseconds

    return () => clearInterval(interval); // Cleanup interval on component unmount
  }, []);

  return null; // No need for UI output
};

export default AutoRejector;
