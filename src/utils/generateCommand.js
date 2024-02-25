import { generateRandomNumber } from "./generateRandomNumber.js";
import { game, rooms } from "../data/db.js";

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

export function updateRoomCommand(roomId, currentUser) {
  const room = rooms.find((room) => room.roomId === roomId);
  let filtered = room?.roomUsers?.map((user) => {
    return Object.fromEntries(
      Object.entries(user).filter(([key]) => key !== "ws")
    );
  });
  let updateRoom = {
    type: "update_room",
    data: JSON.stringify(rooms),
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
    data: JSON.stringify({
      idGame: game.idGame,
      idPlayer: index,
    }),
    id: 0,
  };
  return gameCommand;
}

export function createGame(ws, room) {
  //game.game = {};
  let currentPlayerIndex = room.roomUsers.findIndex(
    (user) => user.index === ws.id
  );
  let secondPlayerIndex = currentPlayerIndex === 1 ? 0 : 1;
  console.log("curreeent player indexxx", currentPlayerIndex);
  let currentPlayer = room.roomUsers[currentPlayerIndex];

  game.idGame = generateRandomNumber();
  let players = [
    {
      idPlayer: 0,
      userId: currentPlayer.index,

      ships: [],
      shipsBoard: [],
      //sets first turn
      isTurn: true,
      wins: 0,
    },
    //searches for first user that created room and was added to it
    {
      idPlayer: 1,
      userId: room.roomUsers[secondPlayerIndex].index,

      ships: [],
      shipsBoard: [],
      isTurn: false,
      wins: 0,
    },
  ];
  game.players = players;
}

export function createTurnCommand(index) {
  console.log(game.players[0].userId, "ussssssssssss");
  let turn = {
    type: "turn",
    data: JSON.stringify({
      currentPlayer: game.players[0].userId,
    }),
    id: 0,
  };
  return turn;
}
