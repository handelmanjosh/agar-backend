import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import GameController from './utils/GameController';
import { Player } from './utils/Player';

const app = express();
app.use(cors());
const httpServer = createServer(app);
const io = new Server(httpServer, {
    //todo: lock down origin
    cors: {
        origin: "*",
        methods: ["GET", "POST", "DELETE", "UPDATE"]
    }
});
const port = 3005;

async function main() {
    const games: Map<string, GameController> = new Map<string, GameController>();
    const vMax = 10;
    const generateRandomGameId = () => String(Math.floor(Math.random() * 1000000));
    const findRoom = (socket: Socket) => {
        //const player: Player = genPlayer(socket);
        for (const game of games) {
            if (game[1].Players.length < 10) {
                game[1].sockets.push(socket);
                return game[0];
            }
        }
        const id = generateRandomGameId();
        const gameController = new GameController();
        gameController.sockets.push(socket);
        games.set(id, gameController);
        console.log("game created");
        return id;
    };
    const interval = setInterval(() => {
        for (const game of games) {
            game[1].frame();
            const gameObjects = game[1].asSerializeable();
            game[1].sockets.forEach((socket: Socket) => {
                socket.emit("gameState", game[1].getRelevantObjects(gameObjects, socket.id, 1000));
            });
            io.to(game[0]).emit("receiveLeaderboard", game[1].getLeaderboard());
            io.to(game[0]).emit("receiveMessages", game[1].getMessages());
        }
    }, 1000 / 60);
    io.on("connection", (socket: Socket) => {
        console.log("New user connected");
        let gameId: string = findRoom(socket);
        socket.on("move", (data: { pos: [number, number]; dimensions: [number, number], id: string; }) => {
            if (data.id) {
                const game = games.get(gameId)!;
                const player = game.Players.find(player => player.id == data.id);
                if (player) {
                    const [x, y] = data.pos;
                    const [width, height] = data.dimensions;
                    player.updateVelocity(x, y, width, height);
                }
            }
        });
        socket.on("spawn", () => {
            let game = games.get(gameId);
            const player = new Player(0, 0, vMax, socket.id);
            if (game) {
                game.addPlayer(player);
                console.log("player added");
            } else {
                gameId = findRoom(socket);
                game = games.get(gameId)!;
                game.addPlayer(player);
            }
        });
        socket.on("disconnect", () => {
            console.log(`${socket.id} disconnected`);
        });
    });
}
main();
httpServer.listen(port, () => {
    console.log(`Server listening on ${port}`);
})

