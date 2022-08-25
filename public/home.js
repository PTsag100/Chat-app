//Initializing variables
const socket = io();
const messageForm = document.querySelector(".input-container");
const messageInput = document.querySelector(".message-input");
const messageContainer = document.querySelector(".message-container");
const callBtn = document.querySelector(".call");
const logoutMenuButton = document.querySelector(".logout-menu");
const logoutMenu = document.getElementById("logout-container");
const talkingToContainer = document.querySelector(".talking-to");
const currentUserElement = document.querySelector(".current-user");
const userTalkingTo = document.querySelector(".user-talking-to");

logoutMenuButton.addEventListener("click", () => {
  logoutMenuButton.classList.toggle("rotate-arrow");
  logoutMenu.classList.toggle("slide-show");
});

//Decodes the token and gets the current user and then procceeds with the page load
const getCurrentUser = async () => {
  const { data } = await axios.get("/users/user", {
    withCredentials: true,
  });
  return data;
};

getCurrentUser()
  //If token couldn't verify go back to login page
  .then(function (thisUser) {
    if (thisUser === "error") {
      window.location.href = "./index.html";
    }

    //display all available users to chat
    showUsers();

    //Initialize varaibles
    let currentUser = thisUser.username;
    let username2 = "";
    let roomId = "";
    const friends = document.querySelector(".friends");

    currentUserElement.innerHTML = `<h3>${currentUser}</h3>`;

    //Send button functionality
    messageForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const message = messageInput.value;
      if (message != null && message != "") {
        messageInput.value = ``;
        const data = axios.post(
          "/messages/add",
          { message: message, talkingTo: username2 },
          {
            withCredentials: true,
          }
        );
        //Send message
        socket.emit("chatMessage", roomId, message, currentUser);
        const messageEl = formatMessage({
          user: currentUser,
          message: message,
        });
        messageContainer.append(messageEl);
      }
      //scroll to latest message
      messageContainer.scrollTop = messageContainer.scrollHeight;
    });
    callBtn.addEventListener("click", () => {
      if (username2) {
        socket.emit("callUser", roomId);
        // Add call to database
        const message = `isCall`;
        if (message != null && message != "") {
          const data = axios.post(
            "/messages/add",
            { message: message, talkingTo: username2 },
            {
              withCredentials: true,
            }
          );
        }
        window.location.href = "/" + roomId + `?user=${username2}`;
      }
    });

    //When receive message
    socket.on("message", (message, currentUser) => {
      let messageEl = "";
      if (message.message == "isCall") {
        messageEl = formatMessageCall(currentUser);
        messageContainer.append(messageEl);
        const button = document.querySelector(".answer-button");
        button.addEventListener("click", () => {
          window.location.href = "/" + roomId + `?user=${username2}`;
        });
      } else {
        messageEl = formatMessage({
          user: currentUser,
          message: message,
        });
        messageContainer.append(messageEl);
      }
      messageContainer.scrollTop = messageContainer.scrollHeight;
    });

    socket.on("calling", () => {
      const messageEl = formatMessageCall(username2);
      messageContainer.append(messageEl);
      messageContainer.scrollTop = messageContainer.scrollHeight;
    });

    //When called return all the users
    async function showUsers() {
      const { data } = await axios.get("/users", {});
      data.forEach((user) => {
        const friend = document.createElement("div");
        friend.innerHTML = `
    <div class="username">${user.username}</div>
        <img
          src="https://t4.ftcdn.net/jpg/02/29/75/83/360_F_229758328_7x8jwCwjtBMmC6rgFzLFhZoEpLobB6L8.jpg"
          alt=""
        />
        <h4>${user.username}</h4>`;

        friend.classList.add("friend");
        friend.addEventListener("click", async (e) => {
          messageContainer.innerHTML = ``;
          username2 = e.target.innerText;
          const { data } = await axios.post(
            "/messages",
            { talkingTo: username2 },
            {
              withCredentials: true,
            }
          );
          //For security
          // if (
          //   username2 == currentUser ||
          //   (currentUser != data.username1 && currentUser != data.username2)
          // ) {
          //   window.location.href = "index.html";
          // }
          roomId = data._id;
          socket.emit("joinRoom", roomId);

          if (data.messages) {
            const messages = data.messages;

            messages.forEach((message) => {
              let messageEl = "";
              if (message.message == "isCall") {
                messageEl = formatMessageCall(message.user);
                messageContainer.append(messageEl);
              } else {
                messageEl = formatMessage(message);
                messageContainer.append(messageEl);
              }
            });
            messageContainer.scrollTop = messageContainer.scrollHeight;

            //Add talking to in the top bar
            userTalkingTo.innerHTML = `<h3>${username2}</h3>`;
            document.getElementById("call").style.visibility = "visible";
          }
        });
        friends.append(friend);
      });
    }

    //Formats the message to display in page
    function formatMessage(message) {
      const messageEl = document.createElement("div");

      if (currentUser == message.user) {
        messageEl.innerHTML = `<p>${message.message}</p>`;
        messageEl.classList.add("my-message");
      } else {
        messageEl.innerHTML = `
        <img
          src="https://t4.ftcdn.net/jpg/02/29/75/83/360_F_229758328_7x8jwCwjtBMmC6rgFzLFhZoEpLobB6L8.jpg"
          alt=""
        />
        <h4>${message.user}:</h4>
        <p>${message.message}</p>
      `;
        messageEl.classList.add("message");
      }
      return messageEl;
    }

    function formatMessageCall(user) {
      const callNotification = document.createElement("div");
      if (user != currentUser) {
        const answerButton = document.createElement("button");
        callNotification.innerHTML = `
      <img
      src="https://t4.ftcdn.net/jpg/02/29/75/83/360_F_229758328_7x8jwCwjtBMmC6rgFzLFhZoEpLobB6L8.jpg"
      alt=""
    />
    <p>${user}: Requested a call</p>`;
        callNotification.classList.add("call-notification");

        answerButton.innerHTML = `<i class="fa-solid fa-phone"></i>`;
        answerButton.addEventListener("click", () => {
          window.location.href = "/" + roomId + `?user=${username2}`;
        });
        callNotification.append(answerButton);
      } else {
        callNotification.innerHTML = `
        <p>Requested a call <i class="fa-solid fa-phone"></i></p>`;
        callNotification.classList.add("my-call-notification");
      }
      return callNotification;
    }
  });
