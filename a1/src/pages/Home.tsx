import { useEffect, useState } from "react";
import axios from "axios";

export default function HomePage() {
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    // Check if staff_id is set in sessionStorage
    const staff_id = sessionStorage.getItem("staff_id");

    if (staff_id) {
      // If staff_id exists, fetch employee data
      fetchEmployeeData(staff_id);
    }
  }, []);

  const fetchEmployeeData = async (staff_id) => {
    try {
      // Make the Axios request to retrieve employee data
      const response = await axios.get(`http://localhost:5002/employee/${staff_id}`);

      if (response.data.code === 200) {
        // Remove the "employee" key and directly store the data in sessionStorage
        const employeeData = response.data.data.employee;
        sessionStorage.setItem("user", JSON.stringify(employeeData));

        // Set the employee data in the state for display or further use
        setUserData(employeeData);
        console.log("Employee data fetched successfully:", employeeData);
      } else {
        // Handle the case where the API request was not successful
        console.error("Error fetching employee data:", response.data.message);
      }
    } catch (error) {
      console.error("Error fetching employee data:", error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      {/* Conditional rendering based on whether userData is available */}
      <h1 className="text-center">
        {userData ? `Welcome, ${userData.staff_fname}` : "Welcome"}
      </h1>
    </div>
  );
}
