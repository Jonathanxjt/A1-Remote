// src/models/Employee.ts
export class Employee {
    id: number;
    fullName: string;  // Combines first_name and last_name
    email: string;
    position: string;
    status: 'In Office' | 'Full' | 'AM'| 'PM';  // Adding specific types for status
    staff_id: number;
    staff_fname: string;
    staff_lname: string;

  
    constructor(id: number, firstName: string, lastName: string, email: string, position: string, status: string, staff_id: number, staff_fname: string, staff_lname: string) {
      this.id = id;
      this.fullName = `${firstName} ${lastName}`; // Combining names
      this.email = email;
      this.position = position;
      this.status = status as 'In Office' | 'Full' | 'AM'| 'PM';  // Casting status to limited set of values
      this.staff_id = staff_id;
      this.staff_fname = staff_fname;
      this.staff_lname = staff_lname;
    }
  }
  