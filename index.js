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
import { createRoom } from "./src/utils/manageRooms.js";

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

    if (data.type === "reg") {
      const newUser = createNewUSer(userData);
      users.push(newUser);
      let command = regCommand("reg", users[users.length - 1]);
      //console.log("USERS OBJECT: ", command);
      ws.send(JSON.stringify(command));
      ws.send(JSON.stringify(updateRoom));
      ws.send(JSON.stringify(updateWinners));
    } else if (data.type === "create_room") {
      let room = createRoom();
      rooms.push(room);
      //addUserToRoom(rooms[rooms.length - 1].roomUsers, users[users.length - 1]);
      let command = updateRoomCommand(rooms[0]);
      console.log("sent create room", command, rooms[0]);
      ws.send(JSON.stringify(command));
    } else if (data.type === "add_user_to_room") {
      // console.log("sent: ", updateRoomNewUser);
      addUserToRoom(rooms[0].roomUsers, users[users.length - 1]);
      let command = updateRoomCommand(rooms[0]);

      ws.send(JSON.stringify(command));
      if (rooms[0].roomUsers.length > 1) {
        ws.send(JSON.stringify(game));
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

wsServer.on("request", (request) => {
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
