import { generateRandomNumber } from "./generateRandomNumber.js";

export function createRoom() {
  let room = {
    roomId: generateRandomNumber(),
    roomUsers: [],
  };
  return room;
}

export function updateRoom() {}
