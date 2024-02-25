import { httpServer } from "./src/http_server/index.js";
import { WebSocketServer, WebSocket } from "ws";
import { createNewUSer } from "./src/utils/createUser.js";
import { createServer } from "node:http";
import path from "node:path";
import { readFile } from "node:fs";
import { users, rooms, game } from "./src/data/db.js";
import {
  addUserToRoom,
  createGame,
  createGameCommand,
  createTurnCommand,
  regCommand,
  startGame,
  updateRoomCommand,
} from "./src/utils/generateCommand.js";
import { addPlayer, createRoom } from "./src/utils/manageRooms.js";
import { attack, createGameBoard } from "./src/controllers/game.js";

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

//hashmap
export const clients = {};
let newUser;
let room;
//const socketServer = createServer();
export const wsServer = new WebSocketServer({
  port: 3000,
  clientTracking: true,
});

wsServer.on("connection", function connection(ws, req) {
  const socketData = req.socket;
  console.log(
    `Client was connected on port ${socketData.remotePort}, with address ${socketData.remoteAddress} and protocol ${socketData.remoteFamily}!`
  );
  //const userId = request.session.userId;
  ws.on("error", console.error);

  ws.on("message", function message(data) {
    console.log("received: %s", JSON.parse(data));
    //console.log("userId", userId);
    data = JSON.parse(data);
    let userData = (data.data && JSON.parse(data?.data)) || null;
    //console.log("data TYPE: ", userData);
    /* let reg = {
      type: "reg",
      data: JSON.stringify({
        name: userData && userData?.name,
        index: "0",
        error: false,
        errorText: "",
      }),
      id: 0,
    }; */
    let updateWinners = {
      type: "update_winners",
      data: JSON.stringify([]),
      id: 0,
    };
    let updateRoom = {
      type: "update_room",
      data: JSON.stringify(rooms.length > 0 ? rooms[0] : []),
      id: 0,
    };

    //creates user
    if (data.type === "reg") {
      newUser = createNewUSer(userData, ws);
      let command = regCommand("reg", newUser);

      ws.send(JSON.stringify(command));
      //pushes user to users
      if (!newUser.error) {
        users.push(newUser);
        wsServer.clients.forEach(function each(client) {
          ws.send(JSON.stringify(updateRoomCommand()));
          ws.send(JSON.stringify(updateWinners));
        });
      }
    } else if (data.type === "create_room") {
      if (rooms.length < 1) {
        //creates room
        let room = createRoom();
        //adds registered user to room
        let currentUser = users.find((user) => user.ws === ws);
        room = addPlayer(room.roomId, currentUser);
        //generates update room command
        let command = updateRoomCommand(room.roomId, currentUser);
        wsServer.clients.forEach(function each(client) {
          client.send(JSON.stringify(command));
        });
      } else {
        //creates room but doesnt add user
        let room = createRoom();
        wsServer.clients.forEach(function each(client) {
          client.send(JSON.stringify(room));
        });
      }

      //addUserToRoom(rooms[rooms.length - 1].roomUsers, users[users.length - 1]);
    } else if (data.type === "add_user_to_room") {
      //finds current user and room
      let currentUser = users.find((user) => user.ws === ws);
      let currentRoom = rooms.find(
        (room) => room.roomId === userData.indexRoom
      );
      if (
        !currentRoom?.roomUsers?.find((user) => user.name === currentUser.name)
      ) {
        //if current user is not found, user is added to room
        //if 2 players in room, room is deleted from rooms and added to game object
        room = addPlayer(userData.indexRoom, currentUser);

        let command = updateRoomCommand(room, currentUser);
      }

      if (room?.roomUsers.length === 2) {
        wsServer.clients.forEach(function each(client) {
          if (
            client &&
            client.readyState === WebSocket.OPEN &&
            game.room.roomUsers.find((user) => user.index === client.id)
          ) {
            if (!game.idGame) {
              createGame(ws, room);
            }

            //room = [];
            //console.log(game.game, "gamee after");
            let currentUser = users.find((user) => user.index === client.id);
            //creates create_game command and sends to each client
            let gameCommand = createGameCommand(currentUser.index);

            client.send(JSON.stringify(gameCommand));
          }
        });
      }
    } else if (data.type === "add_ships") {
      //room = [];
      let currentPlayer = game.players.find((user) => user.userId === ws.id);
      currentPlayer.ships = userData.ships;
      let allPlayersHaveShips = game.players.every(
        (player) => player.ships.length > 0
      );

      console.log("all player have ships", allPlayersHaveShips);

      if (allPlayersHaveShips) {
        game.players[0].shipsBoard = createGameBoard(game.players[0].ships);
        game.players[1].shipsBoard = createGameBoard(game.players[1].ships);

        let gameCommand = startGame(userData.ships, currentPlayer.index);

        wsServer.clients.forEach(function each(client) {
          if (
            client &&
            client.readyState === WebSocket.OPEN &&
            game.players.find((user) => user.userId === client.id)
          ) {
            let currentUser = users.find((user) => user.index === client.id);
            let turn = createTurnCommand(currentUser.index);
            //sends start game
            //sends turn
            client.send(JSON.stringify(gameCommand));
            client.send(JSON.stringify(turn));
          }
        });
      }
    } else if (data.type === "attack") {
      attack(data.data, wsServer);
    }

    //console.log(answer, "answer");
  });
});

wsServer.on("close", function terminate(ws) {
  ws.terminate();
});

/* wsServer.on("request", (request) => {
  //connect
  console.log("requeeeeeeeeeest");
  const connection = request.accept(null, request.origin);
  connection.on("open", () => console.log("opened"));
  connection.on("close", () => console.log("closed"));
  connection.on("message", (message) => {
    const result = JSON.parse(message.utf8Data);
    //received message from client
    console.log(result);
  });

  //generate new clientID
  const clientId = randomUUID();
  clients[clientId] = {
    connection,
  };

  const payLoad = {
    method: "connect",
    clientId: clientId,
  };
  //send back the client connect
  connection.send(Buffer.from(JSON.stringify(payLoad)));
});
 */
