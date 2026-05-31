export interface User {
  uid: string;
  email: string;
  displayName: string;
}

export interface Project {
  id: string;
  name: string;
  ownerId: string;
  memberIds: string[];
  memberEmails: string[];
  createdAt: number;
}

export interface DrawingStroke {
  id: string;
  points: { x: number; y: number }[];
  color: string;
  width: number;
  tool: "pen" | "eraser";
  userId: string;
  timestamp: number;
}

export interface CursorPosition {
  uid: string;
  displayName: string;
  x: number;
  y: number;
  updatedAt: number;
}