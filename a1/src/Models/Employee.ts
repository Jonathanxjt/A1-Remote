// src/models/Employee.ts
export class Employee {
    id: number;
    fullName: string;  // Combines first_name and last_name
    email: string;
    position: string;
    status: 'In Office' | 'Full' | 'AM'| 'PM';  // Adding specific types for status
  
    constructor(id: number, firstName: string, lastName: string, email: string, position: string, status: string) {
      this.id = id;
      this.fullName = `${firstName} ${lastName}`; // Combining names
      this.email = email;
      this.position = position;
      this.status = status as 'In Office' | 'Full' | 'AM'| 'PM';  // Casting status to limited set of values
    }
  }
  