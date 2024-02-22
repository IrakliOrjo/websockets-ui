import { generateRandomNumber } from "./generateRandomNumber.js";
import { rooms } from "../data/db.js";

export function createRoom() {
  let room = {
    roomId: generateRandomNumber(),
    roomUsers: [],
  };
  return room;
}

export function updateRoom() {}

export function addPlayer(id, player) {
  let addUser = {
    name: player.name,
    index: player.index,
    ws: player.ws,
  };
  const room = rooms.find((room) => room.roomId === id);
  room?.roomUsers.push(addUser);
  if (room?.roomUsers.length === 2) {
    rooms.splice(rooms.indexOf(room), 1);
  }
  return room;
}
