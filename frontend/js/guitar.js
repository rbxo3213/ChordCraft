// frontend/js/guitar.js

// 서버 URL 설정
const SERVER_URL = "http://localhost:5000";

// 토큰 확인
const token = localStorage.getItem("token");

if (!token) {
  alert("로그인이 필요합니다.");
  window.location.href = "index.html";
}

// 키보드 설정 기본값
let codeKeys = ["C", "D", "E", "F", "G", "A", "B"];
let chordTypeKeys = ["1", "2", "3", "4", "5"]; // 코드 모드 키 (예: 1: Major, 2: Minor 등)
let stringKeys = ["u", "i", "o", "p", "[", "]"];

// 키보드 설정 저장 및 로드
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

function saveSettings() {
  localStorage.setItem("codeKeys", codeKeys.join(","));
  localStorage.setItem("chordTypeKeys", chordTypeKeys.join(","));
  localStorage.setItem("stringKeys", stringKeys.join(","));
}

// 페이지 로드 시 설정 로드
loadSettings();

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

// 애니메이션 및 기타 상태 관리
let currentChord = null;
let currentChordType = null;
let isRecording = false;

// 녹음 관련 변수
let mediaRecorder;
let recordedChunks = [];

// 코드 입력 처리
const pressedCodes = new Set();
const pressedChordTypes = new Set();
document.addEventListener("keydown", (e) => {
  if (codeKeys.includes(e.key.toUpperCase())) {
    pressedCodes.add(e.key.toUpperCase());
    updateChord();
  }
  if (chordTypeKeys.includes(e.key)) {
    pressedChordTypes.add(e.key);
    updateChord();
  }
  if (stringKeys.includes(e.key)) {
    playString(e.key);
  }
});

document.addEventListener("keyup", (e) => {
  if (codeKeys.includes(e.key.toUpperCase())) {
    pressedCodes.delete(e.key.toUpperCase());
    updateChord();
  }
  if (chordTypeKeys.includes(e.key)) {
    pressedChordTypes.delete(e.key);
    updateChord();
  }
});

function updateChord() {
  if (pressedCodes.size > 0) {
    currentChord = [...pressedCodes][0]; // 여러 키를 누르면 첫 번째 키 사용
  } else {
    currentChord = null;
  }

  if (pressedChordTypes.size > 0) {
    currentChordType = [...pressedChordTypes][0]; // 여러 키를 누르면 첫 번째 키 사용
  } else {
    currentChordType = null;
  }

  // 현재 선택된 코드를 화면에 표시
  displayCurrentChord();
}

function displayCurrentChord() {
  const displayElement = document.getElementById("current-chord-display");
  if (currentChord && currentChordType) {
    let chordTypeName = getChordTypeName(currentChordType);
    displayElement.textContent = `선택된 코드: ${currentChord}${chordTypeName}`;
  } else {
    displayElement.textContent = "선택된 코드: 없음";
  }
}

// 코드 타입 숫자를 이름으로 변환하는 함수
function getChordTypeName(chordTypeKey) {
  const chordTypeNames = {
    1: "",
    2: "7",
    3: "m",
    4: "m7",
    5: " (Barre)",
  };
  return chordTypeNames[chordTypeKey] || "";
}

// Web Audio API 초기화
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioContext = new AudioContext();

// 기타 코드 데이터베이스
const chordData = {
  C: {
    1: [0, 3, 2, 0, 1, 0], // C Major
    2: [0, 3, 2, 3, 1, 0], // C7
    3: [0, 3, 1, 0, 1, 0], // Cm
    4: [0, 3, 1, 3, 1, 0], // Cm7
    5: [3, 3, 5, 5, 5, 3], // C Barre Chord
  },
  D: {
    1: [0, 0, 0, 2, 3, 2], // D Major
    2: [0, 0, 0, 2, 1, 2], // D7
    3: [0, 0, 0, 2, 3, 1], // Dm
    4: [0, 0, 0, 2, 1, 1], // Dm7
    5: [5, 5, 7, 7, 7, 5], // D Barre Chord
  },
  E: {
    1: [0, 2, 2, 1, 0, 0], // E Major
    2: [0, 2, 0, 1, 3, 0], // E7
    3: [0, 2, 2, 0, 0, 0], // Em
    4: [0, 2, 0, 0, 3, 0], // Em7
    5: [0, 7, 9, 9, 9, 7], // E Barre Chord
  },
  F: {
    1: [1, 3, 3, 2, 1, 1], // F Major
    2: [1, 3, 1, 2, 4, 1], // F7
    3: [1, 3, 3, 1, 1, 1], // Fm
    4: [1, 3, 1, 1, 4, 1], // Fm7
    5: [1, 3, 3, 2, 1, 1], // F Barre Chord
  },
  G: {
    1: [3, 2, 0, 0, 0, 3], // G Major
    2: [3, 2, 0, 0, 0, 1], // G7
    3: [3, 1, 0, 0, 3, 3], // Gm
    4: [3, 1, 0, 0, 3, 1], // Gm7
    5: [3, 5, 5, 4, 3, 3], // G Barre Chord
  },
  A: {
    1: [0, 0, 2, 2, 2, 0], // A Major
    2: [0, 0, 2, 0, 2, 0], // A7
    3: [0, 0, 2, 2, 1, 0], // Am
    4: [0, 0, 2, 0, 1, 0], // Am7
    5: [5, 7, 7, 6, 5, 5], // A Barre Chord
  },
  B: {
    1: [7, 9, 9, 8, 7, 7], // B Major (Barre)
    2: [7, 9, 7, 8, 10, 7], // B7
    3: [7, 9, 9, 7, 7, 7], // Bm
    4: [7, 9, 7, 7, 10, 7], // Bm7
    5: [2, 2, 4, 4, 4, 2], // B Barre Chord
  },
  E7: {
    1: [0, 2, 0, 1, 0, 0], // E7
  },
  A7: {
    1: [0, 0, 2, 0, 2, 0], // A7
  },
  D7: {
    1: [0, 0, 0, 2, 1, 2], // D7
  },
  // 필요에 따라 더 많은 코드를 추가할 수 있습니다.
};

// 현별로 기본 주파수 설정 (6현부터 1현까지)
const stringFrequencies = {
  6: 82.41, // 6번 현 (저음 E)
  5: 110.0, // 5번 현 (A)
  4: 146.83, // 4번 현 (D)
  3: 196.0, // 3번 현 (G)
  2: 246.94, // 2번 현 (B)
  1: 329.63, // 1번 현 (고음 E)
};

// 동시에 재생되는 음을 관리하기 위한 배열
let activeNotes = [];

// 현 연주
function playString(key) {
  const keyToStringNumber = {
    u: "6",
    i: "5",
    o: "4",
    p: "3",
    "[": "2",
    "]": "1",
  };
  const stringNumber = keyToStringNumber[key];
  if (!stringNumber) return;

  let fretNumber = 0; // 기본 프렛은 0 (개방현)

  if (currentChord && currentChordType) {
    const chord = chordData[currentChord][currentChordType];
    if (chord) {
      fretNumber = chord[6 - parseInt(stringNumber)];
    }
  }

  // 주파수 계산
  const baseFrequency = stringFrequencies[stringNumber];
  if (baseFrequency === undefined) return;

  const frequency = baseFrequency * Math.pow(2, fretNumber / 12);

  // 사운드 생성
  playGuitarSound(frequency, key);

  // 애니메이션 업데이트
  animateString(stringNumber);
}

function playGuitarSound(frequency, key) {
  const now = audioContext.currentTime;

  // 진동체 생성 (오실레이터)
  const oscillator = audioContext.createOscillator();
  oscillator.type = "sawtooth"; // 파형을 sawtooth로 변경

  // 필터 추가
  const filter = audioContext.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(1000, now);

  // 에너지 감쇠를 위한 GainNode
  const gainNode = audioContext.createGain();

  // 기타의 감쇠 특성 구현
  gainNode.gain.setValueAtTime(1, now);
  gainNode.gain.exponentialRampToValueAtTime(0.001, now + 2);

  oscillator.frequency.setValueAtTime(frequency, now);
  oscillator.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.start(now);
  oscillator.stop(now + 2); // 2초 후에 음을 정지

  // 녹음 중이면 녹음 스트림에 연결
  if (isRecording && recordingDestination) {
    gainNode.connect(recordingDestination);
  }

  // 활성 노트에 추가
  activeNotes.push({ oscillator, gainNode });
}

// 애니메이션 함수
function animateString(stringNumber) {
  const stringElement = document.querySelector(
    `.string[data-string="${stringNumber}"]`
  );
  if (!stringElement) return;

  stringElement.classList.add("active");

  // 애니메이션 종료 후 클래스 제거
  setTimeout(() => {
    stringElement.classList.remove("active");
  }, 500);
}

// 프로필 버튼 이벤트
document.getElementById("profile-button").addEventListener("click", () => {
  window.location.href = "profile.html";
});

// 녹음 버튼 이벤트
const recordButton = document.getElementById("record-button");
const recordingStatus = document.getElementById("recording-status");
let recordingDestination;

recordButton.addEventListener("click", () => {
  if (!isRecording) {
    startRecording();
  } else {
    stopRecording();
  }
});

function startRecording() {
  isRecording = true;
  recordButton.textContent = "녹음 중지";
  recordButton.classList.add("recording");
  recordingStatus.textContent = "연주가 녹음됩니다";

  // MediaRecorder 설정
  const dest = audioContext.createMediaStreamDestination();
  recordingDestination = dest;

  mediaRecorder = new MediaRecorder(dest.stream);
  mediaRecorder.start();

  mediaRecorder.ondataavailable = (e) => {
    recordedChunks.push(e.data);
  };
}

function stopRecording() {
  isRecording = false;
  recordButton.textContent = "녹음 시작";
  recordButton.classList.remove("recording");
  recordingStatus.textContent = "녹음이 중지되었습니다";

  mediaRecorder.stop();

  mediaRecorder.onstop = () => {
    const blob = new Blob(recordedChunks, { type: "audio/webm" });
    const url = URL.createObjectURL(blob);

    // 로컬 저장을 위한 링크 생성
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = "guitar_recording.webm";
    document.body.appendChild(a);
    a.click();

    // 리소스 해제
    window.URL.revokeObjectURL(url);
    recordedChunks = [];
  };
}
