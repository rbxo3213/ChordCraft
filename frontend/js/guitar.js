import { chordData } from "./chords.js";
import { stringFrequencies } from "./frequencies.js";

const SERVER_URL = "http://localhost:5000";

const token = localStorage.getItem("token");
if (!token) {
  alert("로그인이 필요합니다.");
  window.location.href = "index.html";
}

// 로그아웃 버튼 기능 추가
document.getElementById("logout-button").addEventListener("click", () => {
  localStorage.removeItem("token");
  localStorage.removeItem("userId");
  window.location.href = "index.html";
});

document.querySelector(".logo").addEventListener("click", () => {
  window.location.href = "guitar.html";
});

let codeKeys = ["C", "D", "E", "F", "G", "A", "B"];
let chordTypeKeys = ["1", "2", "3", "4", "5", "6"];
let stringKeys = ["u", "i", "o", "p", "[", "]"];

function loadSettings() {
  const savedCodeKeys = localStorage.getItem("codeKeys");
  const savedChordTypeKeys = localStorage.getItem("chordTypeKeys");
  const savedStringKeys = localStorage.getItem("stringKeys");

  if (savedCodeKeys) {
    codeKeys = savedCodeKeys.split(",");
    document.getElementById("code-keys").value = codeKeys.join(",");
  }

  if (savedChordTypeKeys) {
    chordTypeKeys = savedChordTypeKeys.split(",");
    document.getElementById("chord-type-keys").value = chordTypeKeys.join(",");
  }

  if (savedStringKeys) {
    stringKeys = savedStringKeys.split(",");
    document.getElementById("string-keys").value = stringKeys.join(",");
  }
}
loadSettings();

function saveSettings() {
  localStorage.setItem("codeKeys", codeKeys.join(","));
  localStorage.setItem("chordTypeKeys", chordTypeKeys.join(","));
  localStorage.setItem("stringKeys", stringKeys.join(","));
}

document
  .getElementById("keyboard-settings-form")
  .addEventListener("submit", (e) => {
    e.preventDefault();
    codeKeys = document.getElementById("code-keys").value.split(",");
    chordTypeKeys = document.getElementById("chord-type-keys").value.split(",");
    stringKeys = document.getElementById("string-keys").value.split(",");
    saveSettings();
    alert("키보드 설정이 저장되었습니다.");
  });

let currentChord = null;
let currentChordType = null;
let isRecording = false;
let mediaRecorder;
let recordedChunks = [];
let audioContext = null;
let dest = null;

const activeStrings = new Set();

document.addEventListener(
  "click",
  async () => {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }
  },
  { once: true }
);

document.addEventListener("keydown", (e) => {
  const upperKey = e.key.toUpperCase();
  const lowerKey = e.key.toLowerCase();

  if (codeKeys.includes(upperKey)) {
    currentChord = upperKey;
    updateChord();
  }

  if (chordTypeKeys.includes(lowerKey)) {
    currentChordType = lowerKey;
    updateChord();
  }

  if (stringKeys.includes(lowerKey)) {
    activeStrings.add(lowerKey);
    playString(lowerKey);
  }
});

document.addEventListener("keyup", (e) => {
  const lowerKey = e.key.toLowerCase();
  if (stringKeys.includes(lowerKey)) {
    activeStrings.delete(lowerKey);
  }
});

function updateChord() {
  displayCurrentChord();
}

function displayCurrentChord() {
  const displayElement = document.getElementById("current-chord-display");
  if (currentChord && currentChordType) {
    let chordTypeName = getChordTypeName(currentChordType);
    displayElement.textContent = `선택된 코드: ${currentChord}${chordTypeName}`;
  } else if (currentChord && !currentChordType) {
    displayElement.textContent = `선택된 코드: ${currentChord}`;
  } else {
    displayElement.textContent = "선택된 코드: 없음";
  }
}

function getChordTypeName(chordTypeKey) {
  const chordTypeNames = {
    1: "",
    2: "7",
    3: "m",
    4: "M7",
    5: "m7",
    6: " (Barre)",
  };
  return chordTypeNames[chordTypeKey] || "";
}

function playString(key) {
  if (!audioContext || audioContext.state !== "running") return;

  const index = stringKeys.indexOf(key);
  if (index === -1) return;

  const stringNumber = (6 - index).toString();

  let fretNumber = 0;
  if (currentChord && currentChordType) {
    const chord = chordData[currentChord][currentChordType];
    fretNumber = chord ? chord[6 - parseInt(stringNumber)] : 0;
  }

  if (fretNumber < 0 || fretNumber > 5) {
    fretNumber = 0;
  }

  const baseFrequency = stringFrequencies[parseInt(stringNumber)];
  if (!baseFrequency) return;

  const frequency = baseFrequency[fretNumber];
  if (!frequency) {
    animateString(stringNumber);
    return;
  }

  playGuitarSound(frequency);
  animateString(stringNumber);
}

function playGuitarSound(frequency) {
  if (!audioContext || audioContext.state !== "running") return;

  const now = audioContext.currentTime;
  const oscillator = audioContext.createOscillator();
  oscillator.type = "sawtooth";
  const filter = audioContext.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(1000, now);
  const gainNode = audioContext.createGain();
  gainNode.gain.setValueAtTime(1, now);
  gainNode.gain.exponentialRampToValueAtTime(0.001, now + 2);
  oscillator.frequency.setValueAtTime(frequency, now);
  oscillator.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(audioContext.destination);

  if (dest) {
    gainNode.connect(dest);
  }

  oscillator.start(now);
  oscillator.stop(now + 2);
}

function animateString(stringNumber) {
  const stringElement = document.querySelector(
    `.string[data-string="${stringNumber}"]`
  );
  if (!stringElement) return;
  stringElement.classList.add("active");
  setTimeout(() => {
    stringElement.classList.remove("active");
  }, 200);
}

// 녹음
document.getElementById("record-button").addEventListener("click", () => {
  isRecording = !isRecording;
  const recordButton = document.getElementById("record-button");
  recordButton.textContent = isRecording ? "녹음 중지" : "녹음 시작";

  if (isRecording) {
    startRecording();
  } else {
    stopRecording();
  }
});

async function startRecording() {
  if (!audioContext || audioContext.state !== "running") return;

  recordedChunks = [];
  dest = audioContext.createMediaStreamDestination();
  mediaRecorder = new MediaRecorder(dest.stream);
  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) {
      recordedChunks.push(e.data);
    }
  };
  mediaRecorder.start();
}

function stopRecording() {
  if (!mediaRecorder) return;
  mediaRecorder.stop();
  mediaRecorder.onstop = () => {
    const blob = new Blob(recordedChunks, { type: "audio/webm" });

    const recordingName = prompt(
      "녹음한 파일의 이름을 입력하세요(확장자 제외)",
      "myRecording"
    );
    const filename = recordingName ? recordingName + ".webm" : "recorded.webm";

    const url = URL.createObjectURL(blob);

    const playbackButton = document.createElement("button");
    playbackButton.textContent = "녹음 재생";
    playbackButton.onclick = () => {
      const audio = new Audio(url);
      audio.play();
    };

    const downloadButton = document.createElement("a");
    downloadButton.href = url;
    downloadButton.download = filename;
    downloadButton.textContent = "다운로드";

    const recordingStatus = document.getElementById("recording-status");
    recordingStatus.textContent = "";
    recordingStatus.appendChild(playbackButton);
    recordingStatus.appendChild(document.createTextNode(" "));
    recordingStatus.appendChild(downloadButton);
  };
}

// 악보 업로드
document.getElementById("sheet-upload-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const fileInput = document.getElementById("sheet-file");
  const file = fileInput.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (event) => {
    const img = document.getElementById("sheet-music");
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
});

// 악기 선택 알림
document.getElementById("instrument-select").addEventListener("change", (e) => {
  alert(e.target.value + "는 아직 구현되지 않았습니다.");
});
