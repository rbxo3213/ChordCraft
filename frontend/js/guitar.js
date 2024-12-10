// frontend/js/guitar.js
import { chordData } from "./chords.js";
import { stringFrequencies } from "./frequencies.js";

const SERVER_URL = "http://localhost:5000";

const token = localStorage.getItem("token");
if (!token) {
  alert("로그인이 필요합니다.");
  window.location.href = "index.html";
}

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
let mediaRecorder = null;
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
      try {
        await audioContext.resume();
      } catch (err) {
        console.error("AudioContext resume error", err);
      }
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
document.getElementById("record-button").addEventListener("click", async () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioContext.state === "suspended") {
    try {
      await audioContext.resume();
    } catch (err) {
      console.error("AudioContext resume error", err);
    }
  }

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
    console.warn("AudioContext not running, cannot start recording");
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
  console.log("Recording started");
}

function stopRecording() {
  if (!mediaRecorder || mediaRecorder.state !== "recording") {
    console.warn("No active recording to stop");
    return;
  }
  mediaRecorder.stop();
  mediaRecorder.onstop = () => {
    console.log("Recording stopped");
    // 녹음 종료 후 음악 이름 입력 모달 표시
    document.getElementById("record-name-modal").style.display = "block";
  };
}

// 모달 스타일 및 레이아웃 개선
const modals = document.querySelectorAll(".modal");
modals.forEach((modal) => {
  modal.style.background = "#faf8ef";
  modal.style.borderRadius = "8px";
});

// 악보 보관함 열기
document
  .getElementById("open-sheet-upload")
  .addEventListener("click", async () => {
    await loadSheetLibrary();
    document.getElementById("sheet-library-modal").style.display = "block";
  });

document
  .getElementById("close-sheet-library-modal")
  .addEventListener("click", () => {
    document.getElementById("sheet-library-modal").style.display = "none";
  });

// 악보 업로드
document
  .getElementById("upload-sheet-btn")
  .addEventListener("click", async () => {
    const title = document.getElementById("sheet-upload-title").value.trim();
    const file = document.getElementById("sheet-upload-input").files[0];
    if (!file) {
      alert("악보 파일을 선택해주세요.");
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("sheet", file);

    const res = await fetch(`${SERVER_URL}/api/sheets/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const resData = await res.json();
    if (res.ok) {
      alert("악보 업로드 성공");
      document.getElementById("sheet-upload-title").value = "";
      document.getElementById("sheet-upload-input").value = "";
      await loadSheetLibrary();
    } else {
      alert("악보 업로드 실패: " + resData.error);
    }
  });

async function loadSheetLibrary() {
  const res = await fetch(`${SERVER_URL}/api/sheets/user`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  const sheetListDiv = document.getElementById("sheet-library-list");
  sheetListDiv.innerHTML = "";
  if (res.ok && data.sheets && data.sheets.length > 0) {
    data.sheets.forEach((sheet) => {
      const sheetItem = document.createElement("div");
      sheetItem.style.border = "1px solid #ccc";
      sheetItem.style.padding = "5px";
      sheetItem.style.marginBottom = "5px";

      const img = document.createElement("img");
      img.src = SERVER_URL + sheet.fileUrl;
      img.width = 50;
      img.height = 50;
      img.style.cursor = "pointer";
      img.style.verticalAlign = "middle";
      img.addEventListener("click", () => {
        const sheetMusic = document.getElementById("sheet-music");
        sheetMusic.src = SERVER_URL + sheet.fileUrl;
        document.getElementById("sheet-library-modal").style.display = "none";
      });
      sheetItem.appendChild(img);
      sheetItem.appendChild(document.createTextNode(" " + sheet.title + " "));

      // 삭제 버튼
      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "삭제";
      deleteBtn.style.marginLeft = "10px";
      deleteBtn.addEventListener("click", async () => {
        if (!confirm("정말 이 악보를 삭제하시겠습니까?")) return;
        const delRes = await fetch(`${SERVER_URL}/api/sheets/${sheet._id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        const delData = await delRes.json();
        if (delRes.ok) {
          alert("악보 삭제 성공");
          await loadSheetLibrary();
        } else {
          alert("악보 삭제 실패: " + delData.error);
        }
      });
      sheetItem.appendChild(deleteBtn);

      sheetListDiv.appendChild(sheetItem);
    });
  } else {
    sheetListDiv.textContent = "등록된 악보가 없습니다.";
  }
}
