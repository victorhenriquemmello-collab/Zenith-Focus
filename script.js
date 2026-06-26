// --- 0. SISTEMA DE LISTA DE TAREFAS (Local Storage) ---
const todoInput = document.getElementById('todo-input');
const btnAddTodo = document.getElementById('btn-add-todo');
const todoListContainer = document.getElementById('todo-list');

// Array que guardará os objetos das tarefas ex: { id: 123, text: 'Estudar', completed: false }
let todos = [];

// Carrega as tarefas salvas quando a página iniciar
window.addEventListener('DOMContentLoaded', () => {
    const savedTodos = localStorage.getItem('zenith_todos');
    if (savedTodos) {
        todos = JSON.parse(savedTodos);
        renderTodos();
    }
});

function saveTodos() {
    localStorage.setItem('zenith_todos', JSON.stringify(todos));
}

function renderTodos() {
    todoListContainer.innerHTML = '';
    
    todos.forEach(todo => {
        const li = document.createElement('li');
        li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
        
        li.innerHTML = `
            <div class="todo-left">
                <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''} onchange="toggleTodo(${todo.id})">
                <span>${todo.text}</span>
            </div>
            <button class="btn-delete" onclick="deleteTodo(${todo.id})">Remover</button>
        `;
        
        todoListContainer.appendChild(li);
    });
}

function addTodo() {
    const text = todoInput.value.trim();
    if (text === '') return;
    
    const newTodo = {
        id: Date.now(), // Gera um ID único baseado no timestamp
        text: text,
        completed: false
    };
    
    todos.push(newTodo);
    todoInput.value = '';
    
    saveTodos();
    renderTodos();
}

// Funções acionadas pelos eventos inline do HTML gerado dinamicamente
window.toggleTodo = function(id) {
    todos = todos.map(todo => {
        if (todo.id === id) {
            return { ...todo, completed: !todo.completed };
        }
        return todo;
    });
    saveTodos();
    renderTodos();
}

window.deleteTodo = function(id) {
    todos = todos.filter(todo => todo.id !== id);
    saveTodos();
    renderTodos();
}

// Listeners para adicionar tarefas
btnAddTodo.addEventListener('click', addTodo);
todoInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTodo();
});


// --- ESTADOS GLOBAIS ---
let audioCtx = null;
let noiseNode = null;
let gainNode = null;
let filterNode = null;
let isPlaying = false;

let timerInterval = null;
let timeLeft = 25 * 60; 
let isBreak = false;

// --- 1. MODULAÇÃO DE ÁUDIO (Web Audio API) ---
function createBrownNoise() {
    const bufferSize = 2 * audioCtx.sampleRate;
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = output[i];
        output[i] *= 3.5; 
    }
    const bufferSource = audioCtx.createBufferSource();
    bufferSource.buffer = noiseBuffer;
    bufferSource.loop = true;
    return bufferSource;
}

function createWhiteNoise() {
    const bufferSize = 2 * audioCtx.sampleRate;
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
    }
    const bufferSource = audioCtx.createBufferSource();
    bufferSource.buffer = noiseBuffer;
    bufferSource.loop = true;
    return bufferSource;
}

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }

    if (isPlaying) {
        noiseNode.stop();
        isPlaying = false;
        document.getElementById('btn-noise').innerText = "Iniciar Áudio Sensorial";
        return;
    }

    const noiseType = document.getElementById('noise-type').value;
    noiseNode = (noiseType === 'brown') ? createBrownNoise() : createWhiteNoise();

    filterNode = audioCtx.createBiquadFilter();
    filterNode.type = 'lowpass';
    filterNode.frequency.value = document.getElementById('filter-control').value;

    gainNode = audioCtx.createGain();
    gainNode.gain.value = document.getElementById('volume-control').value;

    noiseNode.connect(filterNode);
    filterNode.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    noiseNode.start();
    isPlaying = true;
    document.getElementById('btn-noise').innerText = "Pausar Áudio";
}

document.getElementById('btn-noise').addEventListener('click', initAudio);

document.getElementById('volume-control').addEventListener('input', (e) => {
    if (gainNode) gainNode.gain.setValueAtTime(e.target.value, audioCtx.currentTime);
});

document.getElementById('filter-control').addEventListener('input', (e) => {
    if (filterNode) filterNode.frequency.setValueAtTime(e.target.value, audioCtx.currentTime);
});

document.getElementById('noise-type').addEventListener('change', () => {
    if (isPlaying) { initAudio(); initAudio(); } 
});


// --- 2. GERENCIADOR DE ESTÁGIOS (TIMER ADAPTATIVO) ---
const timerDisplay = document.getElementById('timer');
const timerStatus = document.getElementById('timer-status');
const btnTimerStart = document.getElementById('btn-timer-start');

function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60).toString().padStart(2, '0');
    const seconds = (timeLeft % 60).toString().padStart(2, '0');
    timerDisplay.innerText = `${minutes}:${seconds}`;
}

function startTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
        btnTimerStart.innerText = "Retomar Foco";
        return;
    }

    btnTimerStart.innerText = "Pausar";
    timerInterval = setInterval(() => {
        if (timeLeft > 0) {
            timeLeft--;
            updateTimerDisplay();
        } else {
            clearInterval(timerInterval);
            timerInterval = null;
            isBreak = !isBreak;
            
            if (isBreak) {
                timeLeft = 5 * 60; 
                timerStatus.innerText = "HORA DE DESCARGAR! Faça movimentos/alongamentos repetitivos.";
                timerStatus.style.color = "#b04f4f"; 
                alert("Pausa obrigatória! Evite o acúmulo de energia motora e tiques.");
            } else {
                timeLeft = 25 * 60;
                timerStatus.innerText = "Estado atual: Concentração";
                timerStatus.style.color = "var(--muted-text)";
            }
            btnTimerStart.innerText = "Iniciar";
            updateTimerDisplay();
        }
    }, 1000);
}

document.getElementById('btn-timer-start').addEventListener('click', startTimer);
document.getElementById('btn-timer-reset').addEventListener('click', () => {
    clearInterval(timerInterval);
    timerInterval = null;
    isBreak = false;
    timeLeft = 25 * 60;
    timerStatus.innerText = "Estado atual: Concentração";
    btnTimerStart.innerText = "Iniciar Foco";
    updateTimerDisplay();
});


// --- 3. STIMMING DIGITAL (FIDGET INTERATIVO NO CANVAS) ---
const canvas = document.getElementById('stimming-zone');
const ctx = canvas.getContext('2d');

canvas.width = canvas.offsetWidth;
canvas.height = canvas.offsetHeight;

function drawRipple(x, y) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(140, 109, 79, 0.4)'; 
    ctx.fill();
}

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    drawRipple(x, y);
});

canvas.addEventListener('mouseleave', () => ctx.clearRect(0, 0, canvas.width, canvas.height));


// --- 4. ATALHO DE EMERGÊNCIA (MODO PÂNICO) ---
const panicAlert = document.getElementById('panic-alert');
let emergencyActive = false;

window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (!emergencyActive) {
            emergencyActive = true;
            panicAlert.style.display = 'flex';
            
            if (!isPlaying) initAudio();
            if (filterNode) filterNode.frequency.setValueAtTime(300, audioCtx.currentTime); 
            if (gainNode) gainNode.gain.setValueAtTime(0.7, audioCtx.currentTime);
        } else {
            emergencyActive = false;
            panicAlert.style.display = 'none';
        }
    }
});