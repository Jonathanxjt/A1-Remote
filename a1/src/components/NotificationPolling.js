import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { toast, Bounce } from "react-toastify";

export default function NotificationPolling({ staffId, setNotifications }) {
  const [pollingTimeout, setPollingTimeout] = useState(null);

  // Store current notifications in a ref to compare across renders
  const currentNotificationsRef = useRef(null);

  // Add mounting ref to track component mounted state
  const isMountedRef = useRef(true);
  // Function to find new notifications by comparing arrays
  const findNewNotifications = (newNotifications, currentNotifications) => {
    if (!currentNotifications) return [];

    // Find notifications that exist in newNotifications but not in currentNotifications
    return newNotifications.filter(
      (newNotif) =>
        !currentNotifications.some(
          (currentNotif) =>
            currentNotif.notification_id === newNotif.notification_id
        )
    );
  };

  // Function to fetch notifications
  const fetchNotifications = async () => {
    if (!isMountedRef.current || !staffId) return;
    try {
      console.log("Fetching notifications...");
      const response = await axios.get(
        `http://localhost:5008/notification/${staffId}`
      );

      // Only process response if component is still mounted
      if (isMountedRef.current) {
        if (response.data.code === 200) {
          const newNotifications = response.data.data.Notifications || [];
          console.log(
            "New notifications fetched from server:",
            newNotifications
          );

          // If there are no notifications, reset the state
          if (newNotifications.length === 0) {
            console.log("No notifications found.");
            setNotifications([]);
            currentNotificationsRef.current = [];
            return;
          }

          // First run: just store the notifications without showing toast
          if (currentNotificationsRef.current === null) {
            console.log("First run: storing initial notifications");
            setNotifications(newNotifications);
            currentNotificationsRef.current = newNotifications;
          }
          // Compare current and new notifications
          else {
            // Find truly new notifications (not just different length)
            const actualNewNotifications = findNewNotifications(
              newNotifications,
              currentNotificationsRef.current
            );

            if (actualNewNotifications.length > 0) {
              console.log(
                "New notifications detected:",
                actualNewNotifications
              );

              // Show toast for each new notification
              actualNewNotifications.forEach((notification) => {
                notifyUser(notification);
              });
            }

            // Log if notifications were deleted
            if (
              newNotifications.length < currentNotificationsRef.current.length
            ) {
              console.log("Some notifications were deleted");
            }

            // Always update the state with latest notifications
            setNotifications(newNotifications);
            // Update the reference
            currentNotificationsRef.current = newNotifications;
          }
        }
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  // Long polling function with unmounting support
  const startPolling = () => {
    if (!staffId || !isMountedRef.current) return;
    console.log(
      "Polling cycle started. Current notifications count:",
      currentNotificationsRef.current?.length ?? 0
    );
    const timeoutId = setTimeout(async () => {
      await fetchNotifications();
      startPolling(); // Continue polling
    }, 5000); // Poll every 5 seconds
    setPollingTimeout(timeoutId);
  };

  // Notify user of a new notification
  const notifyUser = (notification) => {
    console.log("Showing toast notification...");
    if(notification.sender_id != notification.receiver_id) {
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
    }
    else
    {
      toast.info(`System: ${notification.message}`, {
        position: "bottom-right",
        autoClose: 3000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
        theme: "light",
        transition: Bounce,
      });
    }
  };

  useEffect(() => {
    if (staffId) {
      console.log("Component mounted, fetching notifications immediately...");
      isMountedRef.current = true;
      fetchNotifications(); // Fetch notifications immediately on mount
      startPolling(); // Start polling when the component mounts
    }

    // Cleanup function to stop polling when the component unmounts or staffId changes
    return () => {
      isMountedRef.current = false;
      if (pollingTimeout) {
        clearTimeout(pollingTimeout);
      }
      // Reset refs and state on unmount
      currentNotificationsRef.current = null;
      setNotifications([]);
    };
  }, [staffId]);

  return null; // No UI needed for polling
}
