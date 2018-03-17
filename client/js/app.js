(function () {
  const INPUT_REGEXP = /^\/(\w+)\s+(\w+)\s+(.*)/,
    connectButton = document.getElementById('connect-btn'),
    usernameInput = document.getElementById('username-input'),
    mainChat = document.getElementById('main-chat'),
    messageInput = document.getElementById('message-input'),
    sendBtn = document.getElementById('send-btn'),
    conn = new WebSocket(`ws://${location.host}`, 'teapchat-protocol-v1');

  let connected = false;

  function sendMessage(msg) {
    conn.send(JSON.stringify(msg));
  }

  function renderMessage(source, text) {
    const elt = document.createElement('p');
    elt.innerHTML = `<span class="from">${source}</span>${text}`;
    mainChat.appendChild(elt);
  }

  function updateInterface(connected) {
    usernameInput.disabled = connected;
    messageInput.disabled = !connected;
    sendBtn.disabled = !connected;
    connectButton.innerText = connected ? 'Disconnect' : 'Connect';
  }

  function parseRawInput(rawInput) {
    const parsedInput  = INPUT_REGEXP.exec(rawInput);

    if(!parsedInput) {
      return {
        type: 'message',
        content: rawInput,
      };
    }

    const [, action, arg, message] = parsedInput;

    switch (action) {
      case 'whisper':
        return {
          type: action,
          to: arg,
          content: message
        };
      default:
        return {
          type: 'message',
          content: rawInput
        };
    }
  }

  function handleMessageInputReturn(e) {
    e.key == 'Enter' && handleSendMessage(e);
  }

  function renderSentMessage(message) {
    switch(message.type) {
      case 'whisper':
        renderMessage(`You whispered to ${message.to}`, message.content);
        break;
      default:
        renderMessage('You', message.content);
    };
  }

  function handleSendMessage(e) {
    e.preventDefault();
    const message = parseRawInput(messageInput.value);
    sendMessage(message);
    renderSentMessage(message);
    messageInput.value = '';
  }

  const eventHandlers = {
    connected: (payload) => {
      connected = true;
      updateInterface(connected);

      sendBtn.addEventListener('click', handleSendMessage);
      messageInput.addEventListener('keyup', handleMessageInputReturn);

      renderMessage('system', 'Connected to chat !');
    },
    disconnected: (payload) => {
      connected = false;
      updateInterface(connected);

      sendBtn.removeEventListener('click', handleSendMessage);
      messageInput.removeEventListener('keyup', handleMessageInputReturn);

      renderMessage('system', 'Disconnected from chat !');
    }
  };

  conn.onopen = () => {
    renderMessage('system', 'Connected to server !');
  };

  conn.onerror = () => {
    renderMessage('system', 'Connection error, please refresh the page');
  };

  conn.onmessage = (event) => {
    const eventData = JSON.parse(event.data);

    if(!eventHandlers.hasOwnProperty(eventData.type)) {
      renderMessage('system', `Unknown event type ${eventData.type}`);
    }

    eventHandlers[eventData.type](eventData);
  };

  connectButton.addEventListener('click', (e) => {
    e.preventDefault();

    if (connected) {
      renderMessage('system', 'Disconnecting from chat...');
      sendMessage({type: 'disconnect'});
    } else {
      renderMessage('system', 'Connecting to chat...');
      sendMessage({type: 'connect'});
    }
  });
})();
