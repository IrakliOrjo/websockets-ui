import { generateRandomNumber } from "./generateRandomNumber.js";
export function createNewUSer(arg) {
  const newUser = {
    name: arg.name,
    password: arg.password,
    index: generateRandomNumber(),
    error: false,
    errorText: "",
  };
  return newUser;
}
