import { Socket } from "socket.io";
import { AIPlayer, Player } from "./Player";
import PowerUp from "./PowerUp";
import { SpawnAway, locateable_distance } from "./utils";


export default class GameController {
    Players: Player[];
    AIPlayers: AIPlayer[];
    PowerUps: PowerUp[];
    sockets: Socket[];
    constructor() {
        this.Players = [];
        this.PowerUps = [];
        this.sockets = [];
        this.AIPlayers = [];
    }
    genAIPlayer() {
        const position = SpawnAway([...this.Players, ...this.AIPlayers], 10, [10000, 10000]);
        const ai = new AIPlayer(position[0], position[1]);
        this.AIPlayers.push(ai);
    }
    addPlayer(player: Player) {
        this.Players.push(player);
    }
    frame() {
        this.Players.forEach((player: Player, i: number) => {
            if (player.delete) {
                this.Players.splice(i, 1);
            } else {
                player.move();
            }
        });
        this.AIPlayers.forEach((ai: AIPlayer, i: number) => {
            if (ai.delete) {
                this.AIPlayers.splice(i, 1);
            } else {
                ai.move();
            }
        });
        this.PowerUps.forEach((powerUp: PowerUp, i: number) => {
            if (powerUp.delete) {
                this.PowerUps.splice(i, 1);
            } else {
                powerUp.move();
            }
        });
        this.check();
    }
    check() {

    }
    asObjectList() {
        return [
            ...this.Players,
            ...this.PowerUps,
            ...this.AIPlayers,
        ];
    }
    asSerializeable() {
        const objects: any[] = [];
        [...this.Players, ...this.PowerUps, ...this.AIPlayers].forEach(object => {
            objects.push(object.asSerializeable());
        });
        return objects;
    }
    getRelevantObjects(objects: { x: number, y: number; radius: number, id?: string; (...any: any[]); }[], id: string, distance: number) {
        const me = objects.find(object => object.id && object.id === id);
        if (me) {
            const finalObjects: any = [];
            for (let i = 0; i < objects.length; i++) {
                if (locateable_distance(objects[i], me) < distance) {
                    finalObjects.push(objects[i]);
                }
            }
            return finalObjects;
        } else {
            return objects;
        }
    }
    getLeaderboard() {

    }
    getMessages() {

    }
}