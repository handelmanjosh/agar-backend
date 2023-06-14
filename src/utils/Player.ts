import { array_distance } from "./utils";


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
    constructor(x: number, y: number, vMax: number, id: string) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.vMax = vMax;
        this.radius = 10;
        this.id = id;
        this.color = getRandomColor();
    }
    move() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0) this.x = 0;
        if (this.y < 0) this.y = 0;
        if (this.x > 10000) this.x = 10000;
        if (this.y > 10000) this.y = 10000;
    }
    updateVelocity(x: number, y: number, width: number, height: number) {
        let playerPos = [width / 2, height / 2];
        // this.setAngle(x, y, width, height);
        let xDiff = x - playerPos[0];
        let yDiff = y - playerPos[1];
        let maxDiff = this.radius * 3;

        let rx = xDiff / maxDiff;
        let ry = yDiff / maxDiff;

        if (rx > 1) rx = 1;
        if (rx < -1) rx = -1;
        if (ry > 1) ry = 1;
        if (ry < -1) ry = -1;

        this.vx = this.vMax * rx;
        this.vy = this.vMax * ry;
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
        super(x, y, 10, generateRandomId());
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
const colors = ["red", "blue", "green", "gray", "orange", "pink", "black"];
const getRandomColor = (): string => {
    return colors[Math.floor(Math.random() * colors.length)];
};