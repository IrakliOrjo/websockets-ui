import { generateRandomNumber } from "./generateRandomNumber";
import { users, game } from "../data/db";
import { User, WebSocketID } from "../types/types";
export function createNewUSer(userData: User, ws: WebSocketID) {
  const newUser = {
    name: userData.name,
    password: userData.password,
    index: generateRandomNumber(),
    error: false,
    errorText: "",
    ws: ws,
    ships: [],
  };
  ws.id = newUser.index;
  if (!game.clients || game.clients === undefined) {
    game.clients = [];
  }
  game.clients.push(ws.id);
  newUser.error = users.some((user) => user.name === newUser.name);
  if (newUser.error) {
    newUser.errorText = "The user already exists";
  }
  return newUser;
}
