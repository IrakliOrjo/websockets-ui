import { game } from "../data/db";
import { generateRandomNumber } from "./generateRandomNumber";
import { rooms } from "../data/db";
import { User } from "../types/types";

export function createRoom() {
  let room = {
    roomId: generateRandomNumber(),
    roomUsers: [],
  };
  rooms.push(room);
  return room;
}

export function updateRoom() {}

export function addPlayer(id: number, player: User) {
  let addUser = {
    name: player.name,
    index: player.index,
  };
  //deletes room from rooms and assigns it to GAme objects room
  const room = rooms.find((room) => room.roomId === id);
  room?.roomUsers.push(addUser);
  if (room?.roomUsers.length === 2) {
    let deletedRoom = rooms.splice(rooms.indexOf(room), 1);
    game.room = deletedRoom[0];
  }
  return room;
}
