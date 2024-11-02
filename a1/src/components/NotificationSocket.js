import { useEffect,useState } from "react";
import { toast, Bounce } from "react-toastify";
import { io } from "socket.io-client";
import axios from "axios";
import api from "@/config/api";


export default function NotificationWebSocket({ staffId, setNotifications }) {
  const [socket, setSocket] = useState(null);
  useEffect(() => {
    if (!staffId) return;
  
    const fetchInitialNotifications = async () => {
      try {
        const response = await axios.get(`${api.NOTIFICATION_URL}/notification/${staffId}`);
        if (response.data.code === 200) {
          setNotifications(response.data.data.Notifications);
        }
      } catch (error) {
        console.error("Error fetching initial notifications:", error);
      }
    };

    const initializeWebSocket = () => {
      const newSocket = io(`${api.NOTIFICATION_URL}`, {
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
        transports: ['websocket'],
        path: '/socket.io/',
        autoConnect: true,
        timeout: 10000
      });

      newSocket.on('connect', () => {
        console.log('Connected to notification server');
        newSocket.emit('join', { staff_id: staffId });
      });

      newSocket.on('new_notification', (notification) => {
        console.log('Received notification:', notification);
        setNotifications(prev => [...prev, notification]);
        notifyUser(notification);
      });

      newSocket.on('connect_error', (error) => {
        console.error("Connection error:", error);
        if (newSocket.io._reconnectionAttempts < newSocket.io._opts.reconnectionAttempts) {
          console.log(`Attempting reconnect (${newSocket.io._reconnectionAttempts + 1}/${newSocket.io._opts.reconnectionAttempts})`);
        } else {
          console.error("Max reconnection attempts reached");
        }
      });

      newSocket.on('disconnect', (reason) => {
        console.log('Disconnected from notification server:', reason);
      });

      setSocket(newSocket);
    };

    fetchInitialNotifications();
    initializeWebSocket();

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [staffId, setNotifications]);

  const notifyUser = (notification) => {
    toast.info(
      `${notification.sender_id !== notification.receiver_id ? notification.message : `System: ${notification.message}`}`,
      {
        position: "bottom-right",
        autoClose: 3000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
        theme: "light",
        transition: Bounce,
      }
    );
  };

  return null;
}