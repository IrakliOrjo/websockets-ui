import { httpServer } from "./src/http_server/index.js";
import { WebSocketServer, WebSocket } from "ws";
import { createNewUSer } from "./src/utils/createUser.js";
import { createServer } from "node:http";
import path from "node:path";
import { readFile } from "node:fs";
import { users, rooms } from "./src/data/db.js";
import {
  addUserToRoom,
  regCommand,
  updateRoomCommand,
} from "./src/utils/generateCommand.js";
import { addPlayer, createRoom } from "./src/utils/manageRooms.js";

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

wsServer.on("connection", function connection(ws, request) {
  //const userId = request.session.userId;
  ws.on("error", console.error);

  ws.on("message", function message(data) {
    console.log("received: %s", JSON.parse(data));
    //console.log("userId", userId);
    data = JSON.parse(data);
    let userData = (data.data && JSON.parse(data?.data)) || null;
    console.log("data TYPE: ", userData);
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
    let updateRoomNew = {
      type: "update_room",
      data: JSON.stringify([]),
      id: 0,
    };
    let updateRoomNewUser = {
      type: "update_room",
      data: JSON.stringify([
        {
          roomId: "0",
          roomUsers: [
            {
              name: "test1",
              index: "0",
            },
          ],
        },
      ]),
      id: 0,
    };
    let game = {
      type: "create_game",
      data: JSON.stringify([
        {
          idGame: 1,
          idPlayer: 1,
        },
      ]),
      id: 0,
    };

    console.log("sent userData", userData);
    if (data.type === "reg") {
      newUser = createNewUSer(userData, ws);
      let command = regCommand("reg", newUser);
      //console.log("USERS OBJECT: ", newUser);
      ws.send(JSON.stringify(command));
      if (!newUser.error) {
        users.push(newUser);
        ws.send(JSON.stringify(updateRoom));
        ws.send(JSON.stringify(updateWinners));
      }
    } else if (data.type === "create_room") {
      let room = createRoom();
      rooms.push(room);
      //addUserToRoom(rooms[rooms.length - 1].roomUsers, users[users.length - 1]);
      let command = updateRoomCommand(rooms[0]);
      ws.send(JSON.stringify(command));
    } else if (data.type === "add_user_to_room") {
      //need to implement that it adds approappriate player on each connection
      //also need to send game only to connected users of the room
      let currentUser = users.find((user) => user.ws === ws);
      let currentRoom = rooms.find(
        (room) => room.roomId === userData.indexRoom
      );
      if (
        !currentRoom.roomUsers.find((user) => user.name === currentUser.name)
      ) {
        room = addPlayer(userData.indexRoom, currentUser);
        let command = updateRoomCommand(room);
        ws.send(JSON.stringify(command));
      }

      if (room?.roomUsers.length === 2) {
        wsServer.clients.forEach(function each(client) {
          if (
            client &&
            client.readyState === WebSocket.OPEN &&
            room.roomUsers.find((user) => user.ws === client)
          ) {
            client.send(JSON.stringify(game));
          }
        });

        //ws.send(JSON.stringify(game));
        //console.log(wsServer.clients.server, "client server");
        /* wsServer.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            console.log(client, "clieeeeeeent");
            client.send(JSON.stringify(updateRoomNew));
          }
        }); */
        //ws.send(JSON.stringify(updateRoomNew));
      }
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
