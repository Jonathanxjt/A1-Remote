import React, { useState, useEffect } from 'react';
import { PieChart } from '@toast-ui/react-chart';
import '@toast-ui/chart/dist/toastui-chart.min.css';

const EmployeeStatusPieChart = React.memo(() => {
  // Example data (you can replace this with real data from an API or state)
  const [employees, setEmployees] = useState([
    { id: 1, name: 'Alice', status: 'WFH' },
    { id: 2, name: 'Bob', status: 'In Office' },
    { id: 3, name: 'Charlie', status: 'In Office' },
    { id: 4, name: 'David', status: 'WFH' },
    { id: 5, name: 'Eve', status: 'In Office' },
  ]);

  console.log("Rendering EmployeeStatusPieChart");

  // Count the number of employees for each status
  const wfhCount = employees.filter(employee => employee.status === 'WFH').length;
  const inOfficeCount = employees.filter(employee => employee.status === 'In Office').length;

  // Chart data for the Pie Chart
  const data = {
    categories: ['Employee Status'],
    series: [
      {
        name: 'WFH',
        data: wfhCount,
      },
      {
        name: 'In Office',
        data: inOfficeCount,
      },
    ],
  };

  // Chart options
  const options = {
    chart: {
      width: 500,
      height: 400,
      title: 'Employee Work Status',
    },
    series: {
      radiusRange: ['40%', '100%'],
      showLabel: true,
    },
    tooltip: {
      suffix: ' employees',
    },
  };

  return (
    <div>
      <PieChart data={data} options={options} />
    </div>
  );
});

export default EmployeeStatusPieChart;
