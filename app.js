const chat = document.getElementById('chat');
const micBtn = document.getElementById('mic');
const callBtn = document.getElementById('call');
const mapBtn = document.getElementById('map');
const thermInner = document.getElementById('thermInner');

function addMessage(text, cls='ai') {
  const d = document.createElement('div');
  d.className = 'msg ' + (cls==='user' ? 'user' : 'ai');
  d.textContent = text;
  chat.appendChild(d);
  chat.scrollTop = chat.scrollHeight;
}

// Speech recognition
let recognition;
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SR();
  recognition.lang = 'en-IN';
  recognition.interimResults = false;
  recognition.onresult = (e) => {
    const text = e.results[0][0].transcript;
    addMessage(text, 'user');
    sendToServer(text);
  };
  recognition.onend = ()=> micBtn.textContent = '🎤 Start';
} else {
  micBtn.disabled = true;
  micBtn.textContent = 'Mic not supported';
}

micBtn.onclick = ()=> {
  if (!recognition) return;
  if (micBtn.textContent.includes('Start')) {
    recognition.start();
    micBtn.textContent = '⏹️ Stop';
  } else {
    recognition.stop();
  }
};

async function sendToServer(text) {
  addMessage('Analyzing...', 'ai');
  try {
    const res = await fetch('/api/ai', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({text})
    });
    const data = await res.json();
    const last = [...chat.querySelectorAll('.msg.ai')].pop();
    if (last) last.textContent = data.reply;
    speak(data.reply);
    setThermometer(data.riskScore);
    if (data.riskScore >= 70) {
      callBtn.style.display = 'inline-block';
      mapBtn.style.display = 'inline-block';
      callBtn.onclick = ()=> window.location = 'tel:112';
      mapBtn.onclick = ()=> window.open('https://www.google.com/maps/search/hospital+near+me');
    } else {
      callBtn.style.display = 'none';
      mapBtn.style.display = 'none';
    }
  } catch (err) {
    addMessage('Error contacting server.', 'ai');
    console.error(err);
  }
}

function speak(text) {
  if ('speechSynthesis' in window) {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-IN';
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  }
}

function setThermometer(score=0) {
  thermInner.style.width = Math.min(100,Math.max(0,score)) + '%';
  if (score < 30) thermInner.style.background = 'green';
  else if (score < 70) thermInner.style.background = 'orange';
  else thermInner.style.background = 'red';
}
