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
let stringKeys = ["1", "2", "3", "4", "5", "6"];

// 키보드 설정 저장 및 로드
function loadSettings() {
  const savedCodeKeys = localStorage.getItem("codeKeys");
  const savedStringKeys = localStorage.getItem("stringKeys");

  if (savedCodeKeys) {
    codeKeys = savedCodeKeys.split(",");
    document.getElementById("code-keys").value = codeKeys.join(",");
  }

  if (savedStringKeys) {
    stringKeys = savedStringKeys.split(",");
    document.getElementById("string-keys").value = stringKeys.join(",");
  }
}

function saveSettings() {
  localStorage.setItem("codeKeys", codeKeys.join(","));
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
    stringKeys = document.getElementById("string-keys").value.split(",");
    saveSettings();
    alert("키보드 설정이 저장되었습니다.");
  });

// 애니메이션 및 기타 상태 관리
let currentChord = null;
let isSustainMode = false; // 코드 유지 방식 (true: 지속, false: 누르고 있는 동안)

// 코드 입력 처리
const pressedCodes = new Set();
document.addEventListener("keydown", (e) => {
  if (codeKeys.includes(e.key.toUpperCase())) {
    pressedCodes.add(e.key.toUpperCase());
    updateChord();
  }
  if (stringKeys.includes(e.key)) {
    playString(e.key);
  }
});

document.addEventListener("keyup", (e) => {
  if (codeKeys.includes(e.key.toUpperCase())) {
    pressedCodes.delete(e.key.toUpperCase());
    if (!isSustainMode) {
      updateChord();
    }
  }
});

// 코드 업데이트
function updateChord() {
  // 현재 누르고 있는 코드 키를 조합하여 코드 결정
  if (pressedCodes.size > 0) {
    currentChord = [...pressedCodes][0]; // 여러 키를 누르면 첫 번째 키 사용
  } else {
    currentChord = null;
  }
}

// Web Audio API 초기화
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioContext = new AudioContext();

// 현별로 기본 주파수 설정 (6현부터 1현까지)
const stringFrequencies = {
  1: 329.63, // 1번 현 (고음 E)
  2: 246.94, // 2번 현 (B)
  3: 196.0, // 3번 현 (G)
  4: 146.83, // 4번 현 (D)
  5: 110.0, // 5번 현 (A)
  6: 82.41, // 6번 현 (저음 E)
};

// 코드별로 반음 이동값 설정
const chordSemitones = {
  C: 0,
  "C#": 1,
  D: 2,
  "D#": 3,
  E: 4,
  F: 5,
  "F#": 6,
  G: 7,
  "G#": 8,
  A: 9,
  "A#": 10,
  B: 11,
};

// 동시에 재생되는 음을 관리하기 위한 배열
let activeNotes = [];

// 현 연주
function playString(key) {
  // 주파수 계산
  let baseFrequency = stringFrequencies[key];
  if (!baseFrequency) return; // 해당하는 현이 없으면 종료

  let semitoneShift = 0;

  if (currentChord) {
    // 코드에 따른 반음 이동 계산
    const chordName = currentChord;

    semitoneShift = chordSemitones[chordName] || 0;
  }

  const frequency = baseFrequency * Math.pow(2, semitoneShift / 12);

  // 사운드 생성
  playGuitarSound(frequency, key);

  // 애니메이션 업데이트
  animateString(key);
}

// 기타 소리 생성 함수
function playGuitarSound(frequency, key) {
  const now = audioContext.currentTime;

  // 진동체 생성 (오실레이터)
  const oscillator = audioContext.createOscillator();
  oscillator.type = "triangle";

  // 에너지 감쇠를 위한 GainNode
  const gainNode = audioContext.createGain();

  // 기타의 감쇠 특성 구현
  gainNode.gain.setValueAtTime(1, now);
  gainNode.gain.exponentialRampToValueAtTime(0.001, now + 2);

  oscillator.frequency.setValueAtTime(frequency, now);
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.start(now);
  oscillator.stop(now + 2); // 2초 후에 음을 정지

  // 활성 노트에 추가
  activeNotes.push({ oscillator, gainNode });
}

// 애니메이션 함수
function animateString(key) {
  const stringElement = document.querySelector(`.string[data-string="${key}"]`);
  if (!stringElement) return;

  stringElement.classList.add("active");

  // 애니메이션 종료 후 클래스 제거
  setTimeout(() => {
    stringElement.classList.remove("active");
  }, 500);
}
