//GUESS CHAT
socket = io.connect("http://127.0.0.1:8181");
const send = function () {
  const text = document.querySelector(".message").value;
  // console.log(text);
  socket.emit("chat message", text);
  // setTimeout(function () {
  //   text = "";
  // }, 5000);
};
const receive = function (msg) {
  const txtarea = document.querySelector(".receive");
  // console.log(txtarea);
  txtarea.value = msg;
};
socket.on("chat message", receive);
//DISPLAY A WORD
const button = document.querySelector(".newword");
//- console.log(button);
const p = document.querySelector(".para");
button.addEventListener("click", (e) => {
  console.log("you clicked me!!");
  // console.log($);
  $.ajax({
    url: "http://localhost:8181/words",
    method: "GET",
    success: function (results) {
      // console.log(results);
      const resultObj = JSON.parse(results);
      console.log(resultObj);
      // const resultsArray = [...resultObj];
      // console.log(resultsArray);
      const randomWord =
        resultObj[
          Object.keys(resultObj)[
            Math.floor(Math.random() * Object.keys(resultObj).length)
          ]
        ];
      console.log(randomWord);
      const wordDiv = document.createElement("div");
      wordDiv.innerHTML = randomWord;
      p.appendChild(wordDiv);
      setTimeout(function () {
        p.removeChild(wordDiv);
      }, 2000);
    },
  });
});
//SHOW ID
socket.on("connect", function () {
  var idUtilisateur = "#{_id}";
  socket.emit("whoAreYou", idUtilisateur);

  socket.on("questionReply", function (response) {
    const responseArray = [];
    console.log("You Are :", response);
    responseArray.push(response.name);
    responseArray.forEach(name, () => {
      const li = document.querySelector("li");
      li.innerHTML = name;
      console.log(li);
    });
    //- console.log(Object.values(response));
    //- console.log(name)
  });
});
//CLEAR
