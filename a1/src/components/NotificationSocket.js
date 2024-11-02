import { useEffect, useState } from "react";
import { toast, Bounce } from "react-toastify";
import { io } from "socket.io-client";
import axios from "axios";
import api from "@/config/api";

export default function NotificationWebSocket({ staffId, setNotifications }) {
  const [socket, setSocket] = useState(null);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const MAX_RECONNECTION_ATTEMPTS = 5;
  
  useEffect(() => {
    if (!staffId) {
      console.log("No staffId provided");
      return;
    }

    if (!api.NOTIFICATION_URL) {
      console.error("Notification URL is not configured");
      return;
    }

    const fetchInitialNotifications = async () => {
      try {
        const response = await axios.get(`${api.NOTIFICATION_URL}/notification/${staffId}`);
        if (response.data?.code === 200) {
          setNotifications(response.data.data.Notifications || []);
        }
      } catch (error) {
        console.error("Error fetching initial notifications:", error);
        if (error.response?.status === 404) {
          // Handle 404 gracefully - maybe the user has no notifications yet
          setNotifications([]);
        }
      }
    };

    const initializeWebSocket = () => {
      // Ensure we have a valid URL
      const wsUrl = new URL(api.NOTIFICATION_URL);
      const protocol = wsUrl.protocol === 'https:' ? 'wss:' : 'ws:';
      const baseWsUrl = `${protocol}//${wsUrl.host}`;

      const newSocket = io(baseWsUrl, {
        reconnectionAttempts: MAX_RECONNECTION_ATTEMPTS,
        reconnectionDelay: 2000,
        transports: ['websocket'],
        path: '/socket.io/',
        autoConnect: true,
        timeout: 10000
      });

      newSocket.on('connect', () => {
        console.log('Connected to notification server');
        setConnectionAttempts(0);
        newSocket.emit('join', { staff_id: staffId });
      });

      newSocket.on('new_notification', (notification) => {
        if (!notification) return;
        
        console.log('Received notification:', notification);
        setNotifications(prev => [...(prev || []), notification]);
        notifyUser(notification);
      });

      newSocket.on('connect_error', (error) => {
        console.error("Connection error:", error);
        setConnectionAttempts(prev => {
          const newAttempts = prev + 1;
          if (newAttempts >= MAX_RECONNECTION_ATTEMPTS) {
            console.error("Max reconnection attempts reached");
            newSocket.close();
          }
          return newAttempts;
        });
      });

      newSocket.on('disconnect', (reason) => {
        console.log('Disconnected from notification server:', reason);
        if (reason === 'io server disconnect') {
          // Server disconnected us, try to reconnect
          newSocket.connect();
        }
      });

      newSocket.on('error', (error) => {
        console.error('Socket error:', error);
      });

      setSocket(newSocket);
      
      return newSocket;
    };

    // Fetch initial notifications first
    fetchInitialNotifications();
    
    // Then initialize WebSocket
    const newSocket = initializeWebSocket();

    // Cleanup function
    return () => {
      if (newSocket) {
        console.log('Cleaning up socket connection');
        newSocket.disconnect();
      }
    };
  }, [staffId, setNotifications]);

  const notifyUser = (notification) => {
    if (!notification?.message) return;
    
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