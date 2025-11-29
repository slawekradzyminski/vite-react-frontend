export interface SignInRequest {
    username: string;
    password: string;
  }
  
export interface SignInResponse {
    username: string;
    roles: string[];
    firstName: string;
    lastName: string;
    token: string;
    refreshToken: string;
    email: string;
  }
  
  export interface SignInError {
    status: number;
    error: string;
    message: string;
    path: string;
  }
  
  export interface SignUpRequest {
    username: string;
    password: string;
    email: string;
    roles: string[];
  }
  
  export interface SignUpResponse {
    token: string;
  } 
