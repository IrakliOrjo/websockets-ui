import { httpServer } from "./src/http_server/index.js";
import { WebSocketServer } from "ws";
import { randomUUID } from "node:crypto";
import { createServer } from "node:http";
import path from "node:path";
import { readFile } from "node:fs";

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
export const wsServer = new WebSocketServer({ port: 3000 });

wsServer.on("connection", function connection(ws) {
  ws.on("error", console.error);

  ws.on("message", function message(data) {
    console.log("received: %s", JSON.parse(data));
    data = JSON.parse(data);
    let userData = (data.data && JSON.parse(data?.data)) || null;
    console.log("data TYPE: ", userData);
    let reg = {
      type: "reg",
      data: JSON.stringify({
        name: userData && userData?.name,
        index: 0,
        error: false,
        errorText: "",
      }),
      id: 0,
    };
    let updateWinners = {
      type: "update_winners",
      data: JSON.stringify([]),
      id: 0,
    };
    let updateRoom = {
      type: "update_room",
      data: JSON.stringify([]),
      id: 0,
    };
    let updateRoomNew = {
      type: "update_room",
      data: JSON.stringify([
        {
          roomId: "0",
          roomUsers: [],
        },
      ]),
      id: 0,
    };
    let updateRoomNewUser = {
      type: "update_room",
      data: JSON.stringify([
        {
          roomId: "0",
          roomUsers: [
            {
              name: userData && userData?.name,
              index: 0,
            },
          ],
        },
      ]),
      id: 0,
    };

    if (data.type === "reg") {
      ws.send(JSON.stringify(reg));
      ws.send(JSON.stringify(updateRoom));
      ws.send(JSON.stringify(updateWinners));
    } else if (data.type === "create_room") {
      ws.send(JSON.stringify(updateRoomNew));
    } else if (data.type === "add_user_to_room") {
      ws.send(JSON.stringify(updateRoomNewUser));
    }

    //console.log(answer, "answer");
  });
});

wsServer.on("request", (request) => {
  //connect
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
