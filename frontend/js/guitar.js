import { chordData } from "./chords.js";
import { stringFrequencies } from "./frequencies.js";

const SERVER_URL = "http://localhost:5000";

const token = localStorage.getItem("token");
if (!token) {
  alert("로그인이 필요합니다.");
  window.location.href = "index.html";
}

// 로고 클릭 시 메인페이지(guitar.html)로
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

// 키보드 설정 저장
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

// 코드/현 상태
let currentChord = null;
let currentChordType = null;
let isRecording = false;
let mediaRecorder;
let recordedChunks = [];
let audioContext = null; // AudioContext를 아직 생성하지 않음
let dest = null; // 녹음용 MediaStreamDestination

const activeStrings = new Set();

// 사용자 인터랙션 시 AudioContext 생성 및 resume
document.addEventListener(
  "click",
  async () => {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioContext.state === "suspended") {
      await audioContext.resume();
      console.log("AudioContext resumed after user interaction.");
    }
  },
  { once: true }
);

document.addEventListener("keydown", (e) => {
  const upperKey = e.key.toUpperCase();
  const lowerKey = e.key.toLowerCase();

  // 코드 키 처리: 바로 currentChord에 반영
  if (codeKeys.includes(upperKey)) {
    currentChord = upperKey;
    updateChord();
  }

  // 코드 모드 키 처리: 바로 currentChordType에 반영
  if (chordTypeKeys.includes(lowerKey)) {
    currentChordType = lowerKey;
    updateChord();
  }

  // 현 연주 키 처리
  if (stringKeys.includes(lowerKey)) {
    activeStrings.add(lowerKey);
    console.log(`KeyDown: ${lowerKey} (stringKeys)`);
    playString(lowerKey);
  }
});

document.addEventListener("keyup", (e) => {
  const lowerKey = e.key.toLowerCase();

  // 현 키는 뗄 때 제거
  if (stringKeys.includes(lowerKey)) {
    activeStrings.delete(lowerKey);
  }
});

function updateChord() {
  console.log("updateChord:", { currentChord, currentChordType });
  displayCurrentChord();
}

function displayCurrentChord() {
  const displayElement = document.getElementById("current-chord-display");
  if (currentChord && currentChordType) {
    let chordTypeName = getChordTypeName(currentChordType);
    displayElement.textContent = `선택된 코드: ${currentChord}${chordTypeName}`;
  } else if (currentChord && !currentChordType) {
    // 코드만 있고 코드 타입이 없을 수도 있으므로 처리
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
  if (!audioContext || audioContext.state !== "running") {
    console.log("AudioContext not running, cannot play");
    return;
  }

  const index = stringKeys.indexOf(key);
  if (index === -1) {
    console.log(`Invalid key: ${key}, no stringNumber found in stringKeys`);
    return;
  }

  // stringKeys[0] -> 6번 현, stringKeys[1] -> 5번 현 ... stringKeys[5] -> 1번 현
  const stringNumber = (6 - index).toString();

  let fretNumber = 0;
  if (currentChord && currentChordType) {
    const chord = chordData[currentChord][currentChordType];
    if (chord) {
      fretNumber = chord[6 - parseInt(stringNumber)];
    } else {
      fretNumber = 0;
    }
  } else {
    fretNumber = 0;
  }

  // fretNumber 범위 확인 (0~5 범위 내로)
  if (fretNumber < 0 || fretNumber > 5) {
    fretNumber = 0;
  }

  const baseFrequency = stringFrequencies[parseInt(stringNumber)];
  if (!baseFrequency) {
    console.log(`No baseFrequency for string ${stringNumber}`);
    return;
  }

  const frequency = baseFrequency[fretNumber];

  console.log(
    `playString: chord=${currentChord}, type=${currentChordType}, string=${stringNumber}, fret=${fretNumber}, frequency=${frequency}`
  );

  if (!frequency) {
    console.log("No frequency found for this fret, just animating string");
    animateString(stringNumber);
    return;
  }

  playGuitarSound(frequency);
  animateString(stringNumber);
}

function playGuitarSound(frequency) {
  if (!audioContext || audioContext.state !== "running") {
    console.log("AudioContext not running in playGuitarSound");
    return;
  }

  console.log(`playGuitarSound: frequency=${frequency}Hz`);

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

  // 기존 destination 출력
  gainNode.connect(audioContext.destination);

  // dest가 존재하면 녹음용 dest에도 연결
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
  if (!audioContext || audioContext.state !== "running") {
    console.log("AudioContext not running, cannot start recording");
    return;
  }

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
    // webm 형식으로 Blob 생성
    const blob = new Blob(recordedChunks, { type: "audio/webm" });
    const url = URL.createObjectURL(blob);

    const playbackButton = document.createElement("button");
    playbackButton.textContent = "녹음 재생";
    playbackButton.onclick = () => {
      const audio = new Audio(url);
      audio.play();
    };

    const downloadButton = document.createElement("a");
    downloadButton.href = url;
    downloadButton.download = "recorded.webm";
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

// 악기 선택(추가 예정)
document.getElementById("instrument-select").addEventListener("change", (e) => {
  alert(e.target.value + "는 아직 구현되지 않았습니다.");
});
