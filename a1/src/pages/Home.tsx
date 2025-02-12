import api from "@/config/api";
import axios from "axios";
import { useEffect, useState } from "react";

interface EmployeeData {
	country: string;
	dept: string;
	email: string;
	position: string;
	reporting_manager: number;
	role: number;
	staff_fname: string;
	staff_id: number;
	staff_lname: string;
}

export default function HomePage() {
	const [userData, setUserData] = useState<EmployeeData | null>(null);

	useEffect(() => {
		const staff_id = sessionStorage.getItem("staff_id");

		if (staff_id) {
			// If staff_id exists, fetch employee data
			fetchEmployeeData(staff_id);
		}
	}, []);

	const fetchEmployeeData = async (staff_id: string) => {
		try {
			const response = await axios.get(
				`${api.EMPLOYEE_URL}/employee/${staff_id}`
			);

			if (response.data.code === 200) {
				// Remove the "employee" key and directly store the data in sessionStorage
				const employeeData = response.data.data.employee;
				sessionStorage.setItem("user", JSON.stringify(employeeData));

				// Set the employee data in the state for display or further use
				setUserData(employeeData);
			} else {
				console.error("Error fetching employee data:", response.data.message);
			}
		} catch (error) {
			console.error("Error fetching employee data:", error);
		}
	};

	return (
		<div className="flex flex-col items-center justify-center h-screen">
			<h1 className="text-center">
				{userData ? `Welcome, ${userData.staff_fname}` : "Welcome"}
			</h1>
		</div>
	);
}
