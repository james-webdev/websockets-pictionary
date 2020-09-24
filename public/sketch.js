let socket;
let buttonClear;

function setup() {
  createCanvas(600, 600);
  background("black");
  socket = io.connect("http://127.0.0.1:8000");

  socket.on("mouse", (data) => {
    line(data.x, data.y, data.a, data.b);
  });

  buttonClear = createButton(
    "Don't forget to CLICK HERE TO CLEAR after each game!"
  );
  buttonClear.position(645, 650);
  buttonClear.mousePressed(clear);
  buttonClear.style("color", "#00ffff");
  buttonClear.style("background-color", "#202028");
  buttonClear.style("border", "1px solid #00ffff");
  buttonClear.style("border-radius", "4px");
  buttonClear.style("font-size", "17px");
}

function clear() {
  clear();
  // socket.emit("clear", clear());
}
function draw() {
  stroke("#00ffff");
  strokeWeight(4);
  if (mouseIsPressed === true) {
    line(mouseX, mouseY, pmouseX, pmouseY);
    const data = {
      x: mouseX,
      y: mouseY,
      a: pmouseX,
      b: pmouseY,
    };
    // console.log(data);
    socket.emit("mouse", data);
  }
}
