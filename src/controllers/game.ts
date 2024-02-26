import { game } from "../data/db";
import { WebSocket } from "ws";
import { updateGameWinners } from "../utils/generateCommand";
import { AttackUser, WebSocketID } from "../types/types";

export function attack(attackData: AttackUser, wsServer: WebSocketID) {
  attackData = JSON.parse(attackData.toString());

  let currentPlayer = game.players.find(
    (player) => player.userId === attackData.indexPlayer
  );
  let indexOfCurrentPlayer = game.players.findIndex(
    (player) => player.userId === attackData.indexPlayer
  );
  let indexOfSecondPlayer =
    indexOfCurrentPlayer !== undefined && indexOfCurrentPlayer === 0 ? 1 : 0;

  if (currentPlayer.isTurn) {
    const attackResult = attackGenerator(
      currentPlayer.shipsBoard,
      attackData.x,
      attackData.y
    );
    console.log(attackResult, "Attack result");

    if (attackResult === "miss") {
      let attackCommand = sendAttack(attackData, attackResult);
      let playersTurn = game.players.find(
        (player) => player.userId !== attackData.indexPlayer
      );

      let turnCommand = sendTurn(playersTurn.userId);
      wsServer.clients &&
        wsServer.clients.forEach(function each(client) {
          if (
            client &&
            client.readyState === WebSocket.OPEN &&
            game.clients.includes(client.id)
          ) {
            client.send(JSON.stringify(attackCommand));
            client.send(JSON.stringify(turnCommand));
          }
        });

      currentPlayer.isTurn = false;
      game.players[indexOfSecondPlayer].isTurn = true;
    }
    if (typeof attackResult === "number") {
      let status;
      attackResult === -1 ? (status = "miss") : (status = "shot");
      let attackCommand = sendAttack(attackData, status);
      let turnCommand = sendTurn(attackData.indexPlayer);
      //
      let playersTurn = game.players.find(
        (player) => player.userId !== attackData.indexPlayer
      );
      wsServer.clients &&
        wsServer.clients.forEach(function each(client) {
          if (
            client &&
            client.readyState === WebSocket.OPEN &&
            game.clients.includes(client.id)
            //game.players.find((user) => user.userId === client.id)
          ) {
            client.send(JSON.stringify(attackCommand));
            client.send(JSON.stringify(turnCommand));
          }
        });
      currentPlayer.isTurn = false;
      game.players[indexOfSecondPlayer].isTurn = true;
    }

    if (attackResult === "shot") {
      let playersTurn = game.players.find(
        (player) => player.userId !== attackData.indexPlayer
      );
      wsServer.clients &&
        wsServer.clients.forEach(function each(client) {
          if (
            client &&
            client.readyState === WebSocket.OPEN &&
            game.clients.includes(client.id)
            //game.players.find((user) => user.userId === client.id)
          ) {
            let attackCommand = sendAttack(attackData, attackResult);
            let turnCommand = sendTurn(game.players[indexOfCurrentPlayer]);
            client.send(JSON.stringify(attackCommand));
            client.send(JSON.stringify(turnCommand));
          }
        });
      game.players[indexOfCurrentPlayer].wins += 1;
    }
    if (attackResult === "killed") {
      let playersTurn = game.players.find(
        (player) => player.userId !== attackData.indexPlayer
      );
      wsServer.clients &&
        wsServer.clients.forEach(function each(client) {
          if (
            client &&
            client.readyState === WebSocket.OPEN &&
            game.clients.includes(client.id)
          ) {
            let attackCommand = sendAttack(attackData, attackResult);
            let turnCommand = sendTurn(game.players[indexOfCurrentPlayer]);
            client.send(JSON.stringify(attackCommand));
            client.send(JSON.stringify(turnCommand));
          }
        });
      let killedInfo = checkKilled(
        game.players[indexOfCurrentPlayer].shipsBoard,
        attackData.x,
        attackData.y
      );
      wsServer.clients &&
        wsServer.clients.forEach(function each(client) {
          if (
            client &&
            client.readyState === WebSocket.OPEN &&
            game.clients.includes(client.id)
            //game.players.find((user) => user.userId === client.id)
          ) {
            for (let i = 0; i < killedInfo.length; i++) {
              attackData.x = killedInfo[i].x;
              attackData.y = killedInfo[i].y;
              let attackCommand = sendAttack(attackData, "miss");
              let turnCommand = sendTurn(
                game.players[indexOfCurrentPlayer].userId
              );

              client.send(JSON.stringify(attackCommand));
              client.send(JSON.stringify(turnCommand));
            }
          }
        });
      currentPlayer.wins += 1;

      const end = endGame(
        game.players[indexOfCurrentPlayer].wins,
        game.players[indexOfCurrentPlayer].userId,
        wsServer
      );
      if (end) {
        let winner = {
          winPlayer: game.players[indexOfCurrentPlayer].userId,
        };
        const finish = {
          type: "finish",
          data: JSON.stringify(winner),
          id: 0,
        };
        wsServer.clients &&
          wsServer.clients.forEach(function each(client) {
            if (
              client &&
              client.readyState === WebSocket.OPEN &&
              game.clients.includes(client.id)
            ) {
              client.send(JSON.stringify(finish));
            }
          });
      }
    }
  }
}

export function createGameBoard(ships: any[]) {
  const board = Array.from({ length: 10 }, () => Array(10).fill(0));

  for (let ship of ships) {
    const x = ship.position.x;
    const y = ship.position.y;
    const direction = ship.direction;
    const type = ship.type;

    for (let i = 0; i < ship.length; i++) {
      const dx = direction ? 0 : i;
      const dy = direction ? i : 0;
      board[y + dy][x + dx] = ship.length;
    }
  }

  return board;
}

function attackGenerator(board: any[], x: number, y: number) {
  const value = board[y][x];

  if (value === 0) {
    board[y][x] = -5;
    return "miss";
  }

  if (value < 0) {
    return value;
  }

  if (value === 1) {
    board[y][x] = -value;
    return "killed";
  }

  board[y][x] = -value;
  let plusTurn = 1;

  for (let dx = -1; x + dx >= 0; dx--) {
    const neighbor = board[y][x + dx];
    if (neighbor === -value) {
      plusTurn++;
    }
    if (neighbor === 0 || neighbor === -5) {
      break;
    }
  }

  for (let dx = 1; x + dx < board.length; dx++) {
    const neighbor = board[y][x + dx];
    if (neighbor === -value) {
      plusTurn++;
    }
    if (neighbor === 0 || neighbor === -5) {
      break;
    }
  }

  for (let dy = -1; y + dy >= 0; dy--) {
    const neighbor = board[y + dy][x];
    if (neighbor === -value) {
      plusTurn++;
    }
    if (neighbor === 0 || neighbor === -5) {
      break;
    }
  }

  for (let dy = 1; y + dy < board.length; dy++) {
    const neighbor = board[y + dy][x];
    if (neighbor === -value) {
      plusTurn++;
    }
    if (neighbor === 0 || neighbor === -5) {
      break;
    }
  }

  return plusTurn === value ? "killed" : "shot";
}

function sendAttack(attackData: AttackUser, status: string) {
  let playerToMove = game.players.find(
    (player) => player.userId === attackData.indexPlayer
  );

  let attack = {
    position: {
      x: attackData.x,
      y: attackData.y,
    },
    currentPlayer: playerToMove.userId,
    status: status,
  };

  const attackCommand = {
    type: "attack",
    data: JSON.stringify(attack),
    id: 0,
  };
  return attackCommand;
}

function sendTurn(userId: number) {
  const turnCommand = {
    type: "turn",
    data: JSON.stringify({ currentPlayer: userId }),
    id: 0,
  };
  return turnCommand;
}

function checkKilled(
  board: any[],
  x: number,
  y: number,
  prevX?: number,
  prevY?: number
): any[] {
  const coordinates = [];
  const value = board[y][x];

  if (value < 0 && value !== -5) {
    const offsets = [-1, 0, 1];
    for (const dy of offsets) {
      for (const dx of offsets) {
        const newX = x + dx;
        const newY = y + dy;
        if (
          isValidNeighbour(newX, newY) &&
          !(newX === x && newY === y) &&
          !(newX === prevX && newY === prevY)
        ) {
          if (board[newY][newX] === 0) {
            board[newY][newX] = -5;
            coordinates.push({ x: newX, y: newY });
          } else if (board[newY][newX] === value) {
            coordinates.push(...checkKilled(board, newX, newY, x, y));
          }
        }
      }
    }
  }
  return coordinates;
}

function isValidNeighbour(x: number, y: number) {
  return x >= 0 && x < 10 && y >= 0 && y < 10;
}

function endGame(shots: number, idUser: number, wsServer: WebSocketID) {
  const gameWon = shots === 20;

  if (gameWon) {
    updateGameWinners(idUser, wsServer);
    return true;
  } else {
    return false;
  }
}
