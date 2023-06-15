import { Socket } from "socket.io";
import PowerUp, { inventoryPowerUps, inventoryPowerUpsContructors } from "./PowerUp";
import { array_distance, getRandomColor } from "./utils";

export class SuperPlayer {
    players: Player[];
    canSplit: boolean;
    id: string;
    delete!: boolean;
    x: number;
    y: number;
    vx: number;
    vy: number;
    vMaxDelta: number;
    color: string;
    inventory: Map<string, PowerUp[]>;
    onCollect: (name: string) => any;
    sendEat: (n: number) => any;
    kill: () => any;
    constructor(x: number, y: number, vMax: number, id: string, onCollect: (name: string) => any, sendEat: (n: number) => any, getSocket: () => Socket) {
        //add ondeath event that sends a message to the client saying that the player died
        this.players = [];
        this.id = id;
        this.x = x;
        this.y = y;
        this.vy = 0;
        this.vx = 0;
        this.vMaxDelta = 0;
        this.color = getRandomColor();
        this.inventory = new Map<string, PowerUp[]>();
        for (const item of inventoryPowerUps) {
            this.inventory.set(item, []);
        }
        const player = new Player(x, y, vMax, id, this.color, this);
        this.players.push(player);
        this.canSplit = true;
        this.onCollect = onCollect;
        this.sendEat = sendEat;
        this.kill = () => {
            console.log(`Total radius: ${this.getTotalRadius()}`);
            getSocket().emit("dead", this.getTotalRadius());
        };
    }
    getTotalRadius() {
        //use 3.14 for simplicity
        return this.players.reduce((acc: number, current: Player) => acc + (current.radius ** 2 * 3.14), 0);
    }
    addPowerUps(powerUps: [string, number]) {
        const name = inventoryPowerUps.indexOf(powerUps[0]);
        const constructor = inventoryPowerUpsContructors[name];
        for (let i = 0; i < powerUps[1]; i++) {
            this.inventory.get(powerUps[0])!.push(new constructor(0, 0));
        }
    }
    serializeInventory() {
        return Array.from(this.inventory).map((value: [string, PowerUp[]]) => {
            return [value[0], value[1].length];
        });
    }
    usePowerUp(name: string) {
        let available = this.inventory.get(name);
        if (available && available.length > 0) {
            const powerUp = available.pop()!;
            powerUp.powerUp(this);
        }
    }
    split() {
        if (this.canSplit) {
            for (const player of this.players) {
                if (player.radius > 30) {
                    player.split(this);
                }
            }
        }
    }
    move() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0) this.x = 0;
        if (this.y < 0) this.y = 0;
        if (this.x > 10000) this.x = 10000;
        if (this.y > 10000) this.y = 10000;
        this.players.forEach((player: Player, i: number) => {
            if (player.delete) {
                this.players.splice(i, 1);
            } else {
                player.move();
            }
        });
    }
    asSerializeable() {
        return {
            x: this.x,
            y: this.y,
            id: this.id,
            players: this.players.map(player => player.asSerializeable())
        };
    }
    updateVelocity(x: number, y: number, width: number, height: number) {
        let playerPos = [width / 2, height / 2];
        // this.setAngle(x, y, width, height);
        let xDiff = x - playerPos[0];
        let yDiff = y - playerPos[1];
        const { radius } = this.players.reduce((prev, current) => (prev.radius > current.radius) ? prev : current);
        let maxDiff = radius * 3;

        let rx = xDiff / maxDiff;
        let ry = yDiff / maxDiff;

        if (rx > 1) rx = 1;
        if (rx < -1) rx = -1;
        if (ry > 1) ry = 1;
        if (ry < -1) ry = -1;
        let { vMax } = this.players.reduce((prev, current) => (prev.vMax > current.vMax) ? current : prev);
        vMax += this.vMaxDelta;
        this.vx = vMax * rx;
        this.vy = vMax * ry;
        this.players.forEach(player => {
            player.vx = this.vx;
            player.vy = this.vy;
        });
    }
}
export class Player {
    x: number;
    y: number;
    vx: number;
    vy: number;
    vMax: number;
    radius: number;
    color: string;
    id: string;
    delete!: boolean;
    parent: SuperPlayer;
    constructor(x: number, y: number, vMax: number, id: string, color: string, parent: SuperPlayer) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.vMax = vMax;
        this.radius = 10;
        this.id = id;
        this.parent = parent;
        this.color = color;
    }
    split(controller: SuperPlayer) {
        const newPlayer = new Player(this.x, this.y, this.vMax, this.id, this.parent.color, this.parent);
        newPlayer.radius = this.radius / 2;
        this.radius = this.radius / 2;
        controller.players.push(newPlayer);
    }
    eat(obj: { radius: number; }) {
        if (this.parent) {
            this.parent.sendEat(obj.radius);
        }
        const objArea = Math.PI * obj.radius ** 2;
        const newArea = Math.PI * this.radius ** 2 + objArea;

        const newRadius = Math.sqrt(newArea / Math.PI);
        const radiusDelta = (newRadius - this.radius) / 10;
        let i = 0;

        const interval = setInterval(() => {
            this.radius += radiusDelta;
            i++;
            if (i > 10) {
                clearInterval(interval);
            }
        }, 10);
    }
    move() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0) this.x = 0;
        if (this.y < 0) this.y = 0;
        if (this.x > 10000) this.x = 10000;
        if (this.y > 10000) this.y = 10000;
    }
    asSerializeable() {
        return {
            x: this.x,
            y: this.y,
            radius: this.radius,
            id: this.id,
            color: this.color
        };
    }
}

export class AIPlayer extends Player {
    target: [number, number] | undefined;
    constructor(x: number, y: number) {
        //@ts-ignore
        super(x, y, 10, undefined, undefined);
    }
    move() {
        if (this.target) {
            this.x += this.vx;
            this.y += this.vy;
            const distance = array_distance(this.target, [this.x, this.y]);
            if (distance < 5) {
                this.target = undefined;
            }
        } else {
            this.target = [Math.random() * 10000, Math.random() * 10000];
            const [dx, dy] = [this.target[0] - this.x, this.target[1] - this.y];
            const angle = Math.atan2(dy, dx);
            this.vx = this.vMax * Math.cos(angle);
            this.vy = this.vMax * Math.sin(angle);
        }
    }
}
const options = "1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVXYZ";
const generateRandomId = (): string => {
    let result = "";
    for (let i = 0; i < 10; i++) {
        result += options[Math.floor(Math.random() * options.length)];
    }
    return result;
};
