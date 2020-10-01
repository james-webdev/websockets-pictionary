let socket;
let buttonClear;
// const urlApp = "http://localhost:8080";

function setup() {
  createCanvas(600, 600);
  background("black");
  socket = io.connect("https://damp-woodland-05737.herokuapp.com/");

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
