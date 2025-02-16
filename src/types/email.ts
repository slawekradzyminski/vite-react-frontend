export interface EmailDto {
  to: string;
  subject: string;
  message: string;
}

export interface EmailFormData extends EmailDto {}

export interface EmailResponse {
  success: boolean;
  message: string;
} 