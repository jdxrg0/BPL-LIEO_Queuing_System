import React from 'react';
import EmployeeTable from './EmployeeTable';

export default function StaffTab({ employees, year, onEdit }) {
  return <EmployeeTable employees={employees} year={year} onEdit={onEdit} />;
}