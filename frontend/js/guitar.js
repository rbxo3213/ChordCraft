// guitar.js

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
let chordTypeKeys = ["1", "2", "3", "4", "5", "6"]; // 코드 모드 키 (예: 1: Major, 2: Minor 등)
let stringKeys = ["u", "i", "o", "p", "[", "]"]; // 연주 키

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
const activeStrings = new Set();

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
    activeStrings.add(e.key);
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
  if (stringKeys.includes(e.key)) {
    activeStrings.delete(e.key);
  }
});

// 현재 선택된 코드 업데이트
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

  // 디버깅: 현재 선택된 코드와 코드 타입 출력
  console.log("Current Chord:", currentChord);
  console.log("Current Chord Type:", currentChordType);

  // 현재 선택된 코드를 화면에 표시
  displayCurrentChord();
}

// 현재 선택된 코드 표시
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
    1: "", // Major
    2: "7", // Dominant 7
    3: "m", // Minor
    4: "M7", // Major 7
    5: "m7", // Minor 7
    6: " (Barre)", // Barre Chord
  };

  const chordTypeName = chordTypeNames[chordTypeKey] || "";
  // 디버깅: 코드 타입 이름 출력
  console.log(`Chord type for ${chordTypeKey}: ${chordTypeName}`);
  return chordTypeName;
}

// Web Audio API 초기화
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioContext = new AudioContext();

// 기타 코드 데이터베이스 (chords.js에서 가져옵니다)
import { chordData } from "./chords.js";

// 주파수 데이터베이스 (frequencies.js에서 가져옵니다)
import { stringFrequencies } from "./frequencies.js";

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

  let fretNumber = 0; // 기본값을 0으로 설정 (개방현)

  if (currentChord && currentChordType) {
    const chord = chordData[currentChord][currentChordType];
    if (chord) {
      fretNumber = chord[6 - parseInt(stringNumber)];
    } else {
      console.error(
        `No chord data for ${currentChord} type ${currentChordType}`
      );
      fretNumber = 0; // 기본값으로 설정
    }
  }

  // 주파수 가져오기
  const baseFrequency = stringFrequencies[stringNumber];
  if (baseFrequency === undefined) {
    console.error(`Invalid string frequency for string ${stringNumber}`);
    return;
  }

  const frequency = baseFrequency[fretNumber];
  if (frequency === undefined) {
    console.error(`Invalid frequency calculated for fret ${fretNumber}`);
    return;
  }

  // 사운드 생성
  playGuitarSound(frequency, key);
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

  // 디버깅: 주파수와 사운드 상태 출력
  console.log(`Playing sound at frequency: ${frequency} Hz`);

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
  if (!stringElement) {
    console.error(`No element found for string ${stringNumber}`);
    return;
  }

  stringElement.classList.add("playing");
  setTimeout(() => {
    stringElement.classList.remove("playing");
  }, 200);
}

// 녹음 처리
let recordingDestination;
document.getElementById("record-button").addEventListener("click", () => {
  isRecording = !isRecording;
  document.getElementById("record-button").textContent = isRecording
    ? "녹음 중지"
    : "녹음 시작";

  if (isRecording) {
    const recorderContext = new AudioContext();
    recordingDestination = recorderContext.createMediaStreamDestination();
  } else {
    recordedChunks = [];
    recordingDestination = null;
  }
});

// 마이크로폰 권한 요청
navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
  const mediaRecorder = new MediaRecorder(stream);
  mediaRecorder.ondataavailable = (event) => {
    recordedChunks.push(event.data);
  };
  mediaRecorder.onstop = () => {
    const blob = new Blob(recordedChunks, { type: "audio/wav" });
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.play();
  };
});

// 페이지 로드 시 설정 로드
loadSettings();
