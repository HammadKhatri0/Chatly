let io = null;

export const setIO = (instance) => {
  io = instance;
};

export const getIO = () => io;

export const userRoom = (userId) => `user:${String(userId)}`;

/** Fan an event out to every listed user's personal room. */
export const emitToUsers = (userIds = [], event, payload) => {
  if (!io) return;
  userIds.filter(Boolean).forEach((id) => io.to(userRoom(id)).emit(event, payload));
};
