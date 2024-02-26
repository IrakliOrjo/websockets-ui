import { httpServer } from "./src/http_server/index";
import { WebSocketServer, WebSocket } from "ws";
import { Data } from "./src/types/types";
import { createNewUSer } from "./src/utils/createUser";
import { createServer } from "node:http";
import path from "node:path";
import { readFile } from "node:fs";
import { WebSocketID, Room, User } from "./src/types/types";
import { users, rooms, game } from "./src/data/db";
import {
  createGame,
  createGameCommand,
  createTurnCommand,
  regCommand,
  startGame,
  updateRoomCommand,
  updateGameWinners,
} from "./src/utils/generateCommand";
import { addPlayer, createRoom } from "./src/utils/manageRooms";
import { attack, createGameBoard } from "./src/controllers/game";

const server = createServer(function (req, res) {
  const __dirname = path.resolve(path.dirname(""));
  const file_path =
    __dirname + (req.url === "/" ? "/front/index.html" : "/front" + req.url);
  readFile(file_path, function (err, data) {
    if (err) {
      res.writeHead(404);
      res.end(JSON.stringify(err));
      return;
    }
    res.writeHead(200);
    res.end(data);
  });
});
const HTTP_PORT = 8181;
server.listen(HTTP_PORT);

console.log(`Start static http server on the ${HTTP_PORT} port!`);

export const clients = {};
let newUser;
let room: Room;

export const wsServer = new WebSocketServer({
  port: 3000,
  clientTracking: true,
});

wsServer.on("connection", function connection(ws: WebSocketID, req) {
  const socketData = req.socket;
  console.log(
    `Client was connected on port ${socketData.remotePort}, with address ${socketData.remoteAddress} and protocol ${socketData.remoteFamily}!`
  );
  //const userId = request.session.userId;
  ws.on("error", console.error);

  ws.on("message", function message(data) {
    console.log("received: %s", JSON.parse(data.toString()));

    let parsedData = JSON.parse(data.toString());
    let userData = (parsedData.data && JSON.parse(parsedData?.data)) || null;

    let updateWinners = {
      type: "update_winners",
      parsedData: JSON.stringify([]),
      id: 0,
    };

    if (parsedData.type === "reg") {
      newUser = createNewUSer(userData, ws);
      let command = regCommand("reg", newUser);
      console.log("sent: ", command);
      ws.send(JSON.stringify(command));

      if (!newUser.error) {
        users.push(newUser);
        wsServer.clients.forEach(function each(client) {
          client.send(JSON.stringify(updateRoomCommand()));
          client.send(JSON.stringify(updateWinners));
        });
      }
    } else if (parsedData.type === "create_room") {
      if (rooms.length < 1) {
        //creates room
        let room = createRoom();
        //adds registered user to room
        let currentUser = users.find((user) => user.index === ws.id);
        room = addPlayer(room.roomId, currentUser);
        //generates update room command
        let command = updateRoomCommand(room.roomId);
        wsServer.clients.forEach(function each(client) {
          console.log("sent: ", command);
          client.send(JSON.stringify(command));
        });
      } else {
        //creates room but doesnt add user
        let room = createRoom();
        wsServer.clients.forEach(function each(client) {
          console.log("sent: ", room);
          client.send(JSON.stringify(room));
        });
      }
    } else if (parsedData.type === "add_user_to_room") {
      //finds current user and room
      let currentUser = users.find((user) => user.index === ws.id);
      let currentRoom = rooms.find(
        (room) => room.roomId === userData.indexRoom
      );
      if (
        !currentRoom?.roomUsers?.find(
          (user: User) => user.name === currentUser.name
        )
      ) {
        //if current user is not found, user is added to room
        //if 2 players in room, room is deleted from rooms and added to game object
        room = addPlayer(userData.indexRoom, currentUser);
      }

      if (room?.roomUsers.length === 2) {
        wsServer.clients.forEach(function each(client: WebSocketID) {
          if (
            client &&
            game.room &&
            client.readyState === WebSocket.OPEN &&
            (Array.isArray(game.room)
              ? game.room.find((user) => user.index === client.id)
              : game.room.roomUsers.find(
                  (user: any) => user.index === client.id
                ))
          ) {
            if (!game.idGame) {
              createGame(ws, room);
            }

            let enemy = game.players.find((user) => user.userId !== client.id);

            let gameCommand = createGameCommand(enemy.userId);
            console.log("SENT: ", gameCommand);
            client.send(JSON.stringify(gameCommand));
          }
        });
      }
    } else if (parsedData.type === "add_ships") {
      //room = [];
      let currentPlayer = game.players.find((user) => user.userId === ws.id);
      currentPlayer.ships = userData.ships;
      let allPlayersHaveShips = game.players.every(
        (player) => player.ships.length > 0
      );

      if (allPlayersHaveShips) {
        game.players[0].shipsBoard = createGameBoard(game.players[0].ships);
        game.players[1].shipsBoard = createGameBoard(game.players[1].ships);

        let gameCommand = startGame(userData.ships, currentPlayer.index);

        wsServer.clients.forEach(function each(client: WebSocketID) {
          if (
            client &&
            client.readyState === WebSocket.OPEN &&
            game.players.find((user) => user.userId === client.id)
          ) {
            let turn = createTurnCommand();
            console.log("sent: ", gameCommand);
            console.log("sent: ", turn);
            client.send(JSON.stringify(gameCommand));
            client.send(JSON.stringify(turn));
          }
        });
      }
    } else if (parsedData.type === "attack") {
      // @ts-ignore
      attack(parsedData.data, wsServer);
    }
  });
});

wsServer.on("close", () => {
  console.log("websocket server is closed");
});
