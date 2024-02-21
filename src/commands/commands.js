import { users, rooms } from "../data/db.js";

export let reg = {
  type: "reg",
  data: JSON.stringify({
    name: users && users[users.length - 1]?.name,
    index: users && users[users.length - 1]?.index,
    error: false,
    errorText: "",
  }),
  id: 0,
};

export let updateRoom = {
  type: "update_room",
  data: JSON.stringify({
    roomId: rooms && rooms[rooms.length - 1].roomId,
    roomUsers: rooms && rooms[rooms.length - 1].roomUsers,
  }),
};
