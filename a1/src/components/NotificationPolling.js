import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { toast, Bounce } from "react-toastify";

export default function NotificationPolling({ staffId }) {
  const [notifications, setNotifications] = useState([]);
  const [pollingTimeout, setPollingTimeout] = useState(null); // Track the polling timeout

  // Using useRef for latestNotificationId to ensure persistence between renders
  const latestNotificationIdRef = useRef(null);

  // Function to fetch notifications
  const fetchNotifications = async () => {
    try {
      console.log('Fetching notifications...');
      const response = await axios.get(`http://localhost:5008/notification/${staffId}`);
      
      if (response.data.code === 200) {
        const newNotifications = response.data.data.Notifications;

        console.log('New notifications fetched from server:', newNotifications);

        // Check the last notification in the array (since the latest is at the end)
        const newLatestId = newNotifications[newNotifications.length - 1].notification_id;

        console.log('Current latestNotificationId (ref):', latestNotificationIdRef.current);
        console.log('New latestNotificationId from server:', newLatestId);

        // If latestNotificationId is null, this is the first run, so just set it
        if (latestNotificationIdRef.current === null) {
          console.log('First run: setting latestNotificationId without notification.');
          latestNotificationIdRef.current = newLatestId; // Use useRef to persist latestNotificationId
          setNotifications(newNotifications); // Set initial notifications without alerting the user
        } 
        // Check if there's a new notification
        else if (newLatestId !== latestNotificationIdRef.current) {
          console.log('New notification detected:', newNotifications[newNotifications.length - 1]);

          // Notify the user of the new notification
          notifyUser(newNotifications[newNotifications.length - 1]);

          // Append the new notification(s) to the end of the current list
          setNotifications((prevNotifications) => [
            ...prevNotifications,
            ...newNotifications, // Add new notifications at the end
          ]);

          // Update the latest notification ID after notifying
          latestNotificationIdRef.current = newLatestId;
        }
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  // Long polling function with unmounting support
  const startPolling = () => {
    console.log("Polling cycle started. Current latestNotificationId:", latestNotificationIdRef.current);
    const timeoutId = setTimeout(async () => {
      await fetchNotifications();
      startPolling(); // Continue polling
    }, 5000); // Poll every 10 seconds
    setPollingTimeout(timeoutId); // Save timeout ID to state
  };

  // Notify user of a new notification
  const notifyUser = (notification) => {
    console.log('Showing toast notification...');
    toast.info(`${notification.message}`, {
        position: "bottom-right",
        autoClose: 3000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
        theme: "light",
        transition: Bounce,
    });
  };

  useEffect(() => {
    if (staffId) {
      console.log('Component mounted, fetching notifications immediately...');
      fetchNotifications(); // Fetch notifications immediately on mount
      startPolling(); // Start polling when the component mounts
    }

    // Cleanup function to stop polling when the component unmounts or staffId changes
    return () => {
      if (pollingTimeout) {
        clearTimeout(pollingTimeout); // Stop the polling
      }
    };
  }, [staffId]);

  return null; // No UI needed for polling
}
