import { generateRandomNumber } from "./generateRandomNumber.js";
import { users } from "../data/db.js";
export function createNewUSer(arg, ws) {
  const newUser = {
    name: arg.name,
    password: arg.password,
    index: generateRandomNumber(),
    error: false,
    errorText: "",
    ws: ws,
    ships: [],
  };
  ws.id = newUser.index;
  newUser.error = users.some((user) => user.name === newUser.name);
  if (newUser.error) {
    newUser.errorText = "The user already exists";
  }
  return newUser;
}
