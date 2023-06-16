import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import GameController from './utils/GameController';
import { Player, SuperPlayer } from './utils/Player';
import fs from 'fs';
import path from 'path';
import { SpawnAway } from './utils/utils';

const app = express();
app.use(cors());
app.use(express.json());
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
        return id;
    };
    let i = 0;
    const interval = setInterval(() => {
        for (const game of games) {
            game[1].frame();
            const gameObjects = game[1].asSerializeable();
            game[1].sockets.forEach((socket: Socket) => {
                const obj = game[1].getRelevantObjects(gameObjects, socket.id, 1000);
                const me = game[1].Players.find(player => player.id == socket.id);
                socket.emit("gameState", obj);
                if (me) {
                    socket.emit("inventory", me.serializeInventory());
                }
            });
            io.to(game[0]).emit("receiveLeaderboard", game[1].getLeaderboard());
            io.to(game[0]).emit("receiveMessages", game[1].getMessages());
        }
        i++;
    }, 1000 / 60);
    io.on("connection", (socket: Socket) => {
        console.log("New user connected");
        let gameId: string = findRoom(socket);
        socket.join(gameId);
        socket.on("move", (data: { pos: [number, number]; dimensions: [number, number], id: string, keys: string[]; }) => {
            if (data.id) {
                const game = games.get(gameId)!;
                const player = game.Players.find(player => player.id == data.id);
                if (player) {
                    const [x, y] = data.pos;
                    const [width, height] = data.dimensions;
                    player.updateVelocity(x, y, width, height);
                    if (data.keys) {
                        for (const key of data.keys) {
                            if (key == " ") {
                                player.split();
                            }
                        }
                    }
                }

            }
        });
        socket.on("usePowerUp", (data: { powerUp: string; }) => {
            console.log(`Used power up: ${data.powerUp}`);
            const game = games.get(gameId);
            const player = game?.Players.find(player => player.id == socket.id);
            if (player) {
                player.usePowerUp(data.powerUp);
            }
        });
        socket.on("spawn", (powerUps: [string, number][]) => {
            let game = games.get(gameId);
            const [x, y] = SpawnAway(game?.allSubPlayers() || [], 10, [10000, 10000]);
            const player = new SuperPlayer(x, y, vMax, socket.id,
                (name: string) => socket.emit("collectPowerUp", name),
                //use 3.14 for simplicity
                (n: number) => socket.emit("massIncrease", n ** 2 * 3.14),
                () => socket,
            );
            for (const powerUp of powerUps) {
                player.addPowerUps(powerUp);
            }
            if (game) {
                game.addPlayer(player);
            } else {
                gameId = findRoom(socket);
                game = games.get(gameId)!;
                game.addPlayer(player);
            }
        });
        socket.on("disconnect", () => {
            const game = games.get(gameId);
            if (game) {
                game.remove(socket);
                if (game.sockets.length == 0) {
                    console.log(`Deleted game ${gameId}`);
                    games.delete(gameId);
                }
            }
            console.log(`${socket.id} disconnected`);
        });
        socket.on("quit", () => {
            const game = games.get(gameId);
            const player = game?.Players.find(player => player.id == socket.id);
            if (player) {
                player.delete = true;
            }
        });
        socket.on("loadPowerUps", (powerUps: [string, number][]) => {
            const game = games.get(gameId);
            const player = game?.Players.find(player => player.id == socket.id);
            if (player) {
                for (const powerUp of powerUps) {
                    player.addPowerUps(powerUp);
                }
            }
        });
        socket.on("loadPowerUp", (powerUp: string) => {
            console.log(powerUp);
            const game = games.get(gameId);
            const player = game?.Players.find(player => player.id == socket.id);
            if (player) {
                player.addPowerUps([powerUp, 1]);
            }
        });
        socket.on("getNFts", () => {
            const data = require("./nft.json");
            socket.emit("receiveNfts", data.nfts);
        });
    });
}

main();

// app.post("/nft", (req, res) => {
//     try {
//         console.log(req.body);
//         const { nft_address } = req.body;
//         const data = require("./nft.json");
//         console.log(data);
//         console.log(data.nfts);
//         data.nfts.push({ address: nft_address, image: "" });
//         console.log(data);
//         fs.writeFile(path.join(__dirname, 'nft.json'), JSON.stringify(data, null, 2), (err) => {
//             if (err) {
//                 res.status(500).json({ message: "Error" });
//             } else {
//                 res.status(200).json({ message: "Success" });
//             }
//         });
//     } catch (e) {
//         console.error(e);
//         res.status(500).json({ message: "Error" });
//     }
// });
httpServer.listen(port, () => {
    console.log(`Server listening on port ${port}`);
})

