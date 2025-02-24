import { clickTile } from "./main";

export class Tile {
    constructor(x, y, div) {
        this.x = x;
        this.y = y;
        this.div = div;

        this.topTile = null;
        this.bottomTile = null;
        this.rightTile = null;
        this.leftTile = null;

        this.isNumber = true;
        this.value;

        this.div.addEventListener("click", () => {
            clickTile(this);
        });
    }

    setTile(direction, tile){
        switch(direction){
            case "right":
                this.rightTile = tile;
                tile.leftTile = this;
                break;
            case "left":
                this.leftTile = tile;
                tile.rightTile = this;
                break;
            case "top":
                this.topTile = tile;
                tile.bottomTile = this;
                break;
            case "bottom":
                this.bottomTile = tile;
                tile.topTile = this;
                break;
            default:
                console.error(`failed to set tile ${this}  ${direction}`)

        }
    }

    move

    getValue() {
    }
}