const WebSocket = require('ws');

const server = new WebSocket.Server({ port: 8080 });

const connectedClients = {}; // Online clients
const gameSessions = {}; // Active games

server.on('connection', (socket) => {
  let activeUserId = null;

  socket.on('message', async (message) => {
    const receivedData = JSON.parse(message);
    console.log('Message received:', receivedData);

    switch (receivedData.type) {
      case 'login': {
        connectedClients[receivedData.uid] = {
          socket,
          email: receivedData.email,
        };
        activeUserId = receivedData.uid;

        socket.send(
          JSON.stringify({
            type: 'loginSuccess',
            message: 'Login successful',
            currentUser: { uid: receivedData.uid, email: receivedData.email },
            users: Object.keys(connectedClients).map((uid) => ({
              uid,
              email: connectedClients[uid].email,
            })),
          })
        );
        console.log('User logged in:', receivedData.email);
        notifyAllUsers();
        break;
      }

      case 'startGame': {
        const { playerX, playerO, gridWidth, gridHeight, userX, userO } = receivedData;

        try {
          const response = await fetch('http://localhost:12380/startGame.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ playerX, playerO, gridWidth, gridHeight }),
          });

          const result = await response.json();

          if (result.success) {
            const gameId = result.gameId;

            gameSessions[gameId] = {
              playerX,
              playerO,
              gridWidth,
              gridHeight,
              board: Array(gridWidth * gridHeight).fill(null),
              turn: playerX,
            };

            [playerX, playerO].forEach((player) => {
              if (
                connectedClients[player] &&
                connectedClients[player].socket.readyState === WebSocket.OPEN
              ) {
                connectedClients[player].socket.send(
                  JSON.stringify({
                    type: 'gameInitialized',
                    gameId,
                    playerX,
                    playerO,
                    opponent: {
                      uid: player === playerX ? playerO : playerX,
                      email: connectedClients[player === playerX ? playerO : playerX]?.email,
                    },
                  })
                );
              }
            });
          } else {
            socket.send(
              JSON.stringify({
                type: 'error',
                message: result.message || 'Failed to initialize game',
              })
            );
          }
        } catch (err) {
          console.error('Error while starting game:', err);
          socket.send(
            JSON.stringify({
              type: 'error',
              message: 'Server error during game initialization',
            })
          );
        }
        break;
      }

      case 'makeMove': {
        const { gameId, x, y, player } = receivedData;
        const session = gameSessions[gameId];

        if (!session) {
          socket.send(JSON.stringify({ type: 'error', message: 'Game session not found' }));
          return;
        }

        const boardIndex = y * session.gridWidth + x;

        if (
          boardIndex < 0 ||
          boardIndex >= session.board.length ||
          session.board[boardIndex] !== null
        ) {
          socket.send(JSON.stringify({ type: 'error', message: 'Invalid move' }));
          return;
        }

        session.board[boardIndex] = player;
        session.turn = session.turn === session.playerX ? session.playerO : session.playerX;

        [session.playerX, session.playerO].forEach((userId) => {
          if (connectedClients[userId]) {
            connectedClients[userId].socket.send(
              JSON.stringify({
                type: 'boardUpdated',
                gameId,
                turn: session.turn,
                board: session.board,
              })
            );
          }
        });
        break;
      }

      case 'logout': {
        if (connectedClients[receivedData.uid]) {
          delete connectedClients[receivedData.uid];
        }
        notifyAllUsers();
        break;
      }

      default: {
        console.log('Unknown message type:', receivedData.type);
        break;
      }
    }
  });

  socket.on('close', () => {
    if (activeUserId && connectedClients[activeUserId]) {
      delete connectedClients[activeUserId];
      notifyAllUsers();
    }
  });
});

function notifyAllUsers() {
  const userList = Object.keys(connectedClients).map((uid) => ({
    uid,
    email: connectedClients[uid].email,
  }));

  Object.values(connectedClients).forEach(({ socket }) => {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(
        JSON.stringify({
          type: 'usersUpdated',
          users: userList,
        })
      );
    }
  });
}

console.log('WebSocket server is running on ws://localhost:8080');
