

export default class PowerUp {
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    color: string;
    delete!: boolean;
    constructor(x: number, y: number, vx: number, vy: number, color: string) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.radius = 5;
        this.color = color;
    }
    move() {
        this.x += this.vx;
        this.y += this.vy;
    }
    asSerializeable() {
        return {
            x: this.x,
            y: this.y,
            radius: this.radius,
            color: this.color,
        };
    }
}   