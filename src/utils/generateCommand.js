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

export function updateRoomCommand(obj) {
  let updateRoom = {
    type: "update_room",
    data: JSON.stringify([
      {
        roomId: obj.roomId,
        roomUsers: obj.roomUsers,
      },
    ]),
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
