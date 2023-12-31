import { Player, SuperPlayer } from "./Player";
import { getRandomColor, randomBetween } from "./utils";
export const inventoryPowerUps: string[] = ["SpeedPowerUp", "SizePowerUp", "PlaceVirus", "Recombine"];
//CHECK END OF FILE FOR CONSTRUCTORS
export default class PowerUp {
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    color: string;
    delete!: boolean;
    name: string;
    constructor(x: number, y: number, vx: number, vy: number, radius: number, color: string, name: string) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.radius = radius;
        this.name = name;
        this.color = color;
    }
    powerUp(player: SuperPlayer | Player) { }
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
            //@ts-ignore
            square: this.square
        };
    }
}

export class FoodPowerUp extends PowerUp {
    constructor(x: number, y: number) {
        super(x, y, 0, 0, randomBetween(5, 15), getRandomColor(), "FoodPowerUp");
    }
    powerUp(player: Player) {
        player.eat(this);
        this.delete = true;
    }
    move() { }
}
export class SpeedPowerUp extends PowerUp {
    square: boolean;
    constructor(x: number, y: number) {
        super(x, y, 0, 0, 15, "blue", "SpeedPowerUp");
        this.square = true;
    }
    collect(player: SuperPlayer) {
        player.inventory.get("SpeedPowerUp")!.push(this);
    }
    powerUp(superPlayer: SuperPlayer) {
        superPlayer.players.forEach((player: Player) => {
            player.parent.vMaxDelta = 5;
            setTimeout(() => {
                player.parent.vMaxDelta = 0;
            }, 10000);
        });
    }
    move() { }
}

export class SizePowerUp extends PowerUp {
    square: boolean;
    constructor(x: number, y: number) {
        super(x, y, 0, 0, 15, "red", "SizePowerUp");
        this.square = true;
    }
    collect(player: SuperPlayer) {
        player.inventory.get("SizePowerUp")!.push(this);
    }
    powerUp(superPlayer: SuperPlayer) {
        const totalFood = 100;
        const indivFood = totalFood / superPlayer.players.length;
        superPlayer.players.forEach((player: Player) => {
            player.eat({ radius: indivFood });
        });
    }
}

export class CollectableSkin extends PowerUp {
    square: boolean;
    constructor(x: number, y: number) {
        super(x, y, 0, 0, 15, "green", "CollectableSkinPowerUp");
        this.square = true;
    }
    powerUp(player: Player) {
        //todo: implement this function
    }
}

export class Virus extends PowerUp {
    constructor(x: number, y: number) {
        super(x, y, 0, 0, 15, "black", "Virus");
    }
    powerUp(player: Player) {
        player.eat(this);
        this.delete = true;
    }
    move() { }
}
export class PlaceVirus extends PowerUp {
    square: boolean;
    constructor(x: number, y: number) {
        super(x, y, 0, 0, 15, "purple", "PlaceVirus");
        this.square = true;
    }
}

export class Recombine extends PowerUp {
    square: boolean;
    constructor(x: number, y: number) {
        super(x, y, 0, 0, 15, "orange", "Recombine");
        this.square = true;
    }
    collect(player: SuperPlayer) {
        player.inventory.get("Recombine")!.push(this);
    }
    powerUp(superPlayer: SuperPlayer) {
        let totalArea = 0;
        superPlayer.players.forEach((player: Player) => {
            totalArea += Math.PI * player.radius ** 2;
        });
        const newRadius = Math.sqrt(totalArea / Math.PI);
        const newPlayer = new Player(superPlayer.x, superPlayer.y, 10, superPlayer.id, superPlayer.color, superPlayer);
        newPlayer.radius = newRadius;
        superPlayer.players = [newPlayer];
    }
    move() { }
}

export const inventoryPowerUpsContructors = [SpeedPowerUp, SizePowerUp, PlaceVirus, Recombine]; 