class Camera {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.zoom = 1;
    this.canvas = document.getElementById('canvas');
    this.ctx = canvas.getContext('2d');
    this.textures = {
      tile: {
        plains: document.getElementById('tile_plains'),
        ocean: document.getElementById('tile_ocean'),
        river: document.getElementById('tile_coastal'),
        desert: document.getElementById('tile_desert'),
        mountain: document.getElementById('tile_mountain'),
        empty: document.getElementById('border_overlay'),
      },
      selector: document.getElementById('selector'),
      unit: {
        settler: document.getElementById('unit_settler'),
        scout: document.getElementById('unit_scout'),
      },
    };
    this.interval;
    this.mouseDownTime = 0;
  }

  start(world, FPS) {
    this.interval = setInterval(() => this.render(world), FPS);
  }

  stop() {
    clearInterval(this.interval);
  }

  clear() {
    this.ctx.clearRect(
      -this.canvas.width / 2,
      -this.canvas.height / 2,
      this.canvas.width,
      this.canvas.height
    );
  }

  renderUnit(unit, x, y) {
    const { zoom, x: camX, y: camY, textures, ctx } = this;
    const { width, height } = world;

    const UNIT_WIDTH = (74 * 0.2);
    const UNIT_HEIGHT = (88 * 0.2);
    const UNIT_RECT_HEIGHT = (51 * 0.2);

    ctx.fillStyle = '#555';

    ctx.beginPath();
    ctx.rect(
      (-camX + ((x - (width / 2)) * 19.8) + 6.5) * zoom,
      (camY - (((y - (height / 2)) * 25) + (mod(x, 2) * 12.5)) + 5) * zoom,
      UNIT_WIDTH * zoom,
      UNIT_RECT_HEIGHT * zoom
    );
    ctx.arc(
      (-camX + ((x - (width / 2)) * 19.8) + 6.5 + (UNIT_WIDTH / 2)) * zoom,
      (camY - (((y - (height / 2)) * 25) + (mod(x, 2) * 12.5)) + 5 + UNIT_RECT_HEIGHT) * zoom,
      (UNIT_WIDTH / 2) * zoom,
      0, Math.PI
    );
    ctx.fill();

    ctx.drawImage(
      textures.unit[unit.type],
      (-camX + ((x - (width / 2)) * 19.8) + 6.5) * zoom,
      (camY - (((y - (height / 2)) * 25) + (mod(x, 2) * 12.5)) + 5) * zoom,
      UNIT_WIDTH * zoom,
      UNIT_HEIGHT * zoom
    );
  }

  render(world) {
    const { zoom, x: camX, y: camY, textures, ctx } = this;
    const { width, height } = world;
    const [ wmX, wmY ] = [ camX + (mouseX / zoom), camY + (mouseY / zoom) ];
    const [ scx1, scy1, scx2, scy2 ] = [
      -this.canvas.width / 2,
      -this.canvas.height / 2,
      this.canvas.width / 2,
      this.canvas.height / 2
    ];

    if (mouseDown) {
      this.mouseDownTime++;
    } else {
      this.mouseDownTime = 0;
    }

    const yStart = (Math.round(((camY * zoom) - ((12.5 * height * zoom) + scy2)) / (25 * zoom)) + (height - 2));
    const yEnd = (Math.round(((camY * zoom) - ((12.5 * height * zoom) + scy1)) / (25 * zoom)) + (height + 3));

    const xStart = (Math.round((((camX * zoom) + (10 * width * zoom)) + scx1) / (19.8 * zoom)) - 1);
    const xEnd = (Math.round((((camX * zoom) + (10 * width * zoom)) + scx2) / (19.8 * zoom)) + 1);

    const selectedX = Math.round((wmX / 19.8) + 18.3);
    const selectedY = Math.round(((wmY + height) / 25) + (18 + (mod(selectedX, 2) / -2)));

    const TILE_SIZE = [28, 25];
    const UNIT_SCALE = [74, 88];

    this.clear();
    for (let y = Math.max(yStart, 0); y < Math.min(yEnd, height); y++) {
      for (let x = xStart; x < xEnd; x++) {

        const tile = world.getTile(x, y);
        if (tile) {

          ctx.drawImage(
            textures.tile[tile.type],
            (-camX + ((x - (width / 2)) * 19.8)) * zoom,
            (camY - (((y - (height / 2)) * 25) + (mod(x, 2) * 12.5))) * zoom,
            28 * zoom,
            25 * zoom
          );

          if (tile.unit) {
            this.renderUnit(tile.unit, x, y);
          }

          if (x === selectedX && y === selectedY) {
            ctx.drawImage(
              textures['selector'],
              (-camX + ((x - (width / 2)) * 19.8)) * zoom,
              (camY - (((y - (height / 2)) * 25) + (mod(x, 2) * 12.5))) * zoom,
              28 * zoom,
              25 * zoom
            );

            if (tile.unit && this.mouseDownTime === 1) {
              console.log(tile.unit);
            }
          }
        }


      }
    }
  }
}