import '@toast-ui/chart/dist/toastui-chart.min.css';
import { PieChart } from '@toast-ui/react-chart';
import React from 'react';
import { Employee } from 'src/Models/Employee'; // Importing from models

interface EmployeeStatusPieChartProps {
  employees: Employee[];
}

const EmployeeStatusPieChart: React.FC<EmployeeStatusPieChartProps> = React.memo(({ employees }) => {

  console.log("Rendering EmployeeStatusPieChart");

  // Count the number of employees for each status
  // this will need to be updated to use the actual data so instead of 'WFH' it will check full day am or pm
  const wfhCount = employees.filter(employee => ['AM', 'PM', 'Full'].includes(employee.status)).length;
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
    },
    series: {
      radiusRange: ['40%', '100%'],
      showLabel: true,
      dataLabels: {
        visible: true,  // This enables the fixed labels on the chart
        anchor: 'center',
        formatter: (value: number) => `${value}`,
      },
      colors: ['#4CAF50', '#FF9800'],
    },
    tooltip: {
      suffix: ' employees',
    },
    legend: {
      visible: false,
    },
    theme: {
      series: {
          colors: ['#757575', '#4CAF50'], // Green for WFH, Orange for In Office
      },
    },
  };

  return (
    <div>
      <PieChart data={data} options={options} />
    </div>
  );
});

export default EmployeeStatusPieChart;
