import { game } from "../data/db.js";
import { WebSocket } from "ws";

export function attack(attackData, wsServer) {
  attackData = JSON.parse(attackData);

  let currentPlayer = game.players.find(
    (player) => player.userId === attackData.indexPlayer
  );
  //if its current players turn it generetes result of attack
  if (currentPlayer.isTurn) {
    const attackResult = attackGenerator(
      currentPlayer.shipsBoard,
      attackData.x,
      attackData.y
    );

    //if result is miss it creates response object
    if (attackResult === "miss") {
      let attackCommand = sendAttack(attackData, attackResult);
      let turnCommand = sendTurn(attackData);
      wsServer.clients.forEach(function each(client) {
        if (
          client &&
          client.readyState === WebSocket.OPEN &&
          attackData.indexPlayer === client.id
          //game.players.find((user) => user.userId === client.id)
        ) {
          client.send(JSON.stringify(attackCommand));
          client.send(JSON.stringify(turnCommand));
        }
      });
    }
  }
}

export function createGameBoard(ships) {
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

function attackGenerator(board, x, y) {
  //value of incoming y x shots
  const value = board[y][x];
  //value 0 is miss
  if (value === 0) {
    board[y][x] = -1;
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
    if (neighbor === 0 || neighbor === -1) {
      break;
    }
  }

  for (let dx = 1; x + dx < board.length; dx++) {
    const neighbor = board[y][x + dx];
    if (neighbor === -value) {
      plusTurn++;
    }
    if (neighbor === 0 || neighbor === -1) {
      break;
    }
  }

  for (let dy = -1; y + dy >= 0; dy--) {
    const neighbor = board[y + dy][x];
    if (neighbor === -value) {
      plusTurn++;
    }
    if (neighbor === 0 || neighbor === -1) {
      break;
    }
  }

  for (let dy = 1; y + dy < board.length; dy++) {
    const neighbor = board[y + dy][x];
    if (neighbor === -value) {
      plusTurn++;
    }
    if (neighbor === 0 || neighbor === -1) {
      break;
    }
  }

  return plusTurn === value ? "killed" : "shot";
}

function sendAttack(attackData, status) {
  let attack = {
    position: {
      x: attackData.x,
      y: attackData.y,
    },
    currentPlayer: attackData.indexPlayer,
    status: status,
  };

  const attackCommand = {
    type: "attack",
    data: JSON.stringify(attack),
    id: 0,
  };
  return attackCommand;
}

function sendTurn(attackData) {
  const turnCommand = {
    type: "turn",
    data: JSON.stringify({ currentPlayer: attackData.indexPlayer }),
    id: 0,
  };
  return turnCommand;
}
