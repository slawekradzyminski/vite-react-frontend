export type LoginRequest = {
  username: string;
  password: string;
};

export enum Role {
  ADMIN = 'ROLE_ADMIN',
  CLIENT = 'ROLE_CLIENT',
}

export type LoginResponse = {
  token: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: Array<Role>;
};

export type RegisterRequest = {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  roles: Array<Role>;
};

export type User = {
  id: number;
  username: string;
  email: string;
  roles: Array<Role>;
  firstName: string;
  lastName: string;
};

export type UserEditDTO = {
  email: string;
  firstName: string;
  lastName: string;
}; 