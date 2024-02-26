import { generateRandomNumber } from "./generateRandomNumber";
import { game, rooms, winners } from "../data/db";
import { User, Ships, WebSocketID, Room } from "../types/types";

export function regCommand(command: string, obj: User) {
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

export function updateRoomCommand(roomId?: number) {
  const room = rooms.find((room) => room.roomId === roomId);
  /* let filtered = room?.roomUsers?.map((user) => {
    return Object.fromEntries(
      Object.entries(user).filter(([key]) => key !== "ws")
    );
  }); */
  let updateRoom = {
    type: "update_room",
    data: JSON.stringify(rooms),
    id: 0,
  };
  return updateRoom;
}

export function startGame(ships: Ships, playerIndex: number) {
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

export function createGameCommand(index: number) {
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

export function createGame(ws: WebSocketID, room: Room) {
  let currentPlayerIndex = room.roomUsers.findIndex(
    (user) => user.index === ws.id
  );
  let secondPlayerIndex = currentPlayerIndex === 1 ? 0 : 1;

  let currentPlayer = room.roomUsers[currentPlayerIndex];

  game.idGame = generateRandomNumber();
  let players = [
    {
      name: currentPlayer.name,
      userId: currentPlayer.index,

      ships: [],
      shipsBoard: [],
      //sets first turn
      isTurn: true,
      wins: 0,
    },
    //searches for first user that created room and was added to it
    {
      name: room.roomUsers[secondPlayerIndex].name,
      userId: room.roomUsers[secondPlayerIndex].index,

      ships: [],
      shipsBoard: [],
      isTurn: false,
      wins: 0,
    },
  ];
  game.players = players;
}

export function createTurnCommand() {
  let turn = {
    type: "turn",
    data: JSON.stringify({
      currentPlayer: game.players[0].userId,
    }),
    id: 0,
  };
  return turn;
}

export function updateGameWinners(userId: number, wsServer: WebSocketID) {
  const player = game?.players.find((player) => player.userId === userId);
  const checkWinners = winners.find((winner) => winner.name === player.name);
  if (checkWinners) {
    checkWinners.wins += 1;
  }
  if (!checkWinners) {
    winners.push({ name: player.name, wins: 1 });
  }
  let updateWinnersCommand = {
    type: "update_winners",
    data: JSON.stringify(winners),
    id: 0,
  };
  wsServer.clients &&
    wsServer.clients.forEach(function each(client) {
      client.send(JSON.stringify(updateWinnersCommand));
    });
  //game = [];
  return updateWinnersCommand;
}
