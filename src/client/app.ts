let camera: Camera;
let ui: UI;
let world: World;

const resize = () => {
  const canvas = document.getElementById('canvas') as HTMLCanvasElement;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
  ctx.setTransform(1, 0, 0, 1, canvas.width / 2, canvas.height / 2);
  ctx.imageSmoothingEnabled = false;
  camera.render(world);
}

window.onload = () => {
  resize();
};
window.onresize = resize;

const rootElement = document.getElementById('UI'); // FIXME;
if (!rootElement) throw 'Root UI Element Missing';

rootElement.onwheel = (evt) => {
  const canvas = document.getElementById('canvas') as HTMLCanvasElement;
  const { zoom } = camera;
  if (evt.deltaY > 0) {
    const { height } = world;
    const scy2 = canvas.height / 2;
    const yStart = (Math.round((-((12.5 * height * zoom) + scy2)) / (25 * zoom)) + (height - 2));
    if (yStart > 1) {
      camera.zoom *= 0.9;
    }
  } else {
    if (zoom < 10) {
      camera.zoom *= 1.1;
    }
  }
};

let mouseX = 0;
let mouseY = 0;
let oldX = 0;
let oldY = 0;
let clickX = 0;
let clickY = 0;
let mouseDown = false;
const getMousePos = ( canvas: HTMLCanvasElement, evt: MouseEvent ): { x: number, y: number } => {
  const rect = canvas.getBoundingClientRect();
  const pos = {
        x: Math.floor( ( evt.clientX - rect.left ) / ( rect.right - rect.left ) * canvas.width ),
        y: Math.floor( ( evt.clientY - rect.top ) / ( rect.bottom - rect.top ) * canvas.height )
    };
  return pos;
};
rootElement.onmousemove = (evt: MouseEvent) => {
  const canvas = document.getElementById('canvas') as HTMLCanvasElement;
	const mousePos = getMousePos(canvas, evt);
	mouseX = mousePos.x - Math.round(canvas.width/2);
	mouseY = canvas.height - (mousePos.y + Math.round(canvas.height/2));
	// selX = x+mouseX/size;
	// selY = y+mouseY/size;
	if (mouseDown) {
		camera.x = oldX - ((mouseX-clickX) / camera.zoom);
		camera.y = oldY - ((mouseY-clickY) / camera.zoom);
	}
};
rootElement.onmousedown = function(evt) {
  const canvas = document.getElementById('canvas') as HTMLCanvasElement;
	const mousePos = getMousePos(canvas, evt);
	clickX = mousePos.x - Math.round(canvas.width/2);
	clickY = canvas.height - (mousePos.y + Math.round(canvas.height/2));
	mouseDown = true;
}
rootElement.onmouseup = function() {
	mouseDown = false;
	oldX = camera.x;
	oldY = camera.y;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const mod = (a, b) => {
  if (a >= 0) {
    return a % b;
  } else {
    return ((a % b) + b) % b;
  }
};

const main = async () => {
  // const SERVER_IP = '192.168.5.47:8080';
  // const SERVER_IP = '192.168.4.29:8080';
  // const SERVER_IP = 'hmi.dynu.net:8080';
  // const SERVER_IP = 'localhost:8080';

  camera = new Camera();
  ui = new UI();
  world = new World();

  await world.setup(camera, ui);
}

main();