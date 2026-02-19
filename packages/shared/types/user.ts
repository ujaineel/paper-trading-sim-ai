export interface CreateUserDTO {
  email: string;
  password: string;
  displayName: string;
}

export interface UserDTO {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
}

export interface AuthResponseDTO {
  token: string;
  user: UserDTO;
}

export interface LoginDTO {
  email: string;
  password: string;
}
