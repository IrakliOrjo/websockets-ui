import { generateRandomNumber } from "./generateRandomNumber.js";
import { game } from "../data/db.js";

export function regCommand(command, obj) {
  let reg = {
    type: command,
    data: JSON.stringify({
      name: obj.name,
      index: obj.index,
      error: obj.error,
      errorText: obj.errorText,
    }),
    id: 0,
  };
  return reg;
}

export function updateRoomCommand(obj, currentUser) {
  let filtered = obj.roomUsers.map((user) => {
    return Object.fromEntries(
      Object.entries(user).filter(([key]) => key !== "ws")
    );
  });
  let updateRoom = {
    type: "update_room",
    data: JSON.stringify([
      {
        roomId: obj.roomId,
        roomUsers: filtered,
      },
    ]),
    id: 0,
  };
  return updateRoom;
}

export function addUserToRoom(room, user) {
  let addUser = {
    name: user.name,
    index: user.index,
  };
  room.push(addUser);
}

export function startGame(ships, playerIndex) {
  let command = {
    type: "start_game",
    data: {
      ships: ships,
      currentPlayerIndex: playerIndex,
    },
    id: 0,
  };
  return command;
}

export function createGameCommand(index) {
  let gameCommand = {
    type: "create_game",
    data: JSON.stringify([
      {
        idGame: game.idGame,
        idPlayer: index,
      },
    ]),
    id: 0,
  };
  return gameCommand;
}

export function createGame() {
  game.game = {};
  game.idGame = generateRandomNumber();
  game.players = game.room.roomUsers;
}

export function createTurnCommand(index) {
  let turn = {
    type: "turn",
    data: JSON.stringify({
      currentPlayer: index,
    }),
    id: 0,
  };
  return turn;
}
