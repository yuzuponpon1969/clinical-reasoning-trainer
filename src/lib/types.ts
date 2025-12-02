export type Role = 'user' | 'assistant' | 'system' | 'patient' | 'instructor';

export interface Message {
  role: Role;
  content: string;
}

export interface UserInfo {
  id: string;
  name: string;
}

export interface AIResponse {
  role: 'patient' | 'instructor';
  content: string;
}
