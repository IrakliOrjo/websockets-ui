import { WebSocket } from "ws";

export interface Data {
  type: string;
  data: User | Room | Ships | AttackUser | RandomAttack;
  id: 0;
}

export interface User {
  name: string;
  password: string;
  index: number;
  error: boolean;
  errorText: string;
  ws: WebSocketID;
  ships: never[];
}

export interface Room {
  roomId: number;
  roomUsers: any[];
}

export interface Ships {
  gameId: number;
  ships: [];
  indexPlayer: number;
}

export interface AttackUser {
  gameId: number;
  x: number;
  y: number;
  indexPlayer: number;
}

/* export interface Coordinates {
  x: number;
  y: number;
} */

export interface RandomAttack {
  gameId: number;
  indexPlayer: number;
}

export interface Game {
  idGame: number;
  clients: any[];
  players: any[];
  room?: RoomUsers | any[] | undefined;
}
export interface RoomUsers {
  roomUsers?: any;
}

export interface WebSocketID extends WebSocket {
  id?: number;
  clients?: any[];
}
