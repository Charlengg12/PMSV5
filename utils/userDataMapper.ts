import { User } from '../types';

/**
 * Maps database field names (snake_case) to frontend field names (camelCase)
 * This ensures consistency between backend and frontend data structures
 */
export function mapUserDataFromBackend(rawUserData: any): User {
  return {
    id: rawUserData.id,
    name: rawUserData.name,
    email: rawUserData.email,
    role: rawUserData.role,
    school: rawUserData.school,
    secureId: rawUserData.secure_id, // Map secure_id to secureId
    employeeNumber: rawUserData.employee_number, // Map employee_number to employeeNumber
    phone: rawUserData.phone,
    gcashNumber: rawUserData.gcash_number, // Map gcash_number to gcashNumber
    gcashQrUrl: rawUserData.gcash_qr_url,
    clientProjectId: rawUserData.client_project_id // Map client_project_id to clientProjectId
  };
}
