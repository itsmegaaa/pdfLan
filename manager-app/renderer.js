const statusIndicator = document.getElementById('status-indicator');
const statusText = document.getElementById('status-text');
const logs = document.getElementById('logs');

const btnStart = document.getElementById('btn-start');
const btnStop = document.getElementById('btn-stop');
const btnRestart = document.getElementById('btn-restart');
const btnStatus = document.getElementById('btn-status');

function log(message) {
  const time = new Date().toLocaleTimeString();
  logs.innerHTML += `<div><span class="time">[${time}]</span><span class="msg">${message}</span></div>`;
  logs.scrollTop = logs.scrollHeight;
}

async function checkStatus() {
  try {
    const response = await window.api.getServerStatus();
    if (response.status === 'online') {
      statusIndicator.className = 'status-indicator online';
      statusText.innerText = 'ONLINE';
      statusText.style.color = '#a6e3a1';
    } else {
      statusIndicator.className = 'status-indicator offline';
      statusText.innerText = 'OFFLINE';
      statusText.style.color = '#f38ba8';
    }
  } catch (error) {
    statusIndicator.className = 'status-indicator offline';
    statusText.innerText = 'UNKNOWN';
  }
}

btnStart.addEventListener('click', async () => {
  log('Starting server...');
  btnStart.disabled = true;
  const res = await window.api.startServer();
  if (res.error) {
    log(`Error: ${res.error}`);
  } else {
    log('Server started successfully.');
  }
  btnStart.disabled = false;
  await checkStatus();
});

btnStop.addEventListener('click', async () => {
  log('Stopping server...');
  btnStop.disabled = true;
  const res = await window.api.stopServer();
  if (res.error) {
    log(`Error: ${res.error}`);
  } else {
    log('Server stopped successfully.');
  }
  btnStop.disabled = false;
  await checkStatus();
});

btnRestart.addEventListener('click', async () => {
  log('Restarting server...');
  btnRestart.disabled = true;
  const res = await window.api.restartServer();
  if (res.error) {
    log(`Error: ${res.error}`);
  } else {
    log('Server restarted successfully.');
  }
  btnRestart.disabled = false;
  await checkStatus();
});

btnStatus.addEventListener('click', async () => {
  log('Memeriksa status server...');
  btnStatus.disabled = true;
  await checkStatus();
  log(`Status saat ini: ${statusText.innerText}`);
  btnStatus.disabled = false;
});

// Initial check and set interval
checkStatus();
setInterval(checkStatus, 3000); // Check status every 3 seconds
