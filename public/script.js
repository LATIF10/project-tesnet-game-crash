const socket = io();

const balanceDisplay = document.getElementById('balance');
const multiplierDisplay = document.getElementById('multiplier');
const line = document.getElementById('line');
const betBtn = document.getElementById('betBtn');
const cashoutBtn = document.getElementById('cashoutBtn');
const betAmountInput = document.getElementById('betAmount');
const status = document.getElementById('status');

let currentMultiplier = 1.00;
let hasBet = false;

// Update saldo
socket.on('balanceUpdate', (balance) => {
    balanceDisplay.textContent = balance;
});

// Update multiplier
socket.on('multiplierUpdate', (data) => {
    currentMultiplier = parseFloat(data.multiplier);
    multiplierDisplay.textContent = `${currentMultiplier.toFixed(2)}x`;
    line.style.width = `${Math.min((currentMultiplier - 1) * 10, 100)}%`;
    if (hasBet) {
        cashoutBtn.disabled = false;
    }
});

// Tangani crash
socket.on('crash', (data) => {
    multiplierDisplay.textContent = `${data.crashPoint}x`;
    line.style.width = '100%';
    if (hasBet) {
        status.textContent = `Crashed at ${data.crashPoint}x! Kamu kalah.`;
        hasBet = false;
    }
    betBtn.disabled = false;
    cashoutBtn.disabled = true;
});

// Tangani status
socket.on('status', (message) => {
    status.textContent = message;
});

// Event listener untuk tombol taruhan
betBtn.addEventListener('click', () => {
    const betAmount = parseFloat(betAmountInput.value);
    socket.emit('placeBet', betAmount);
    hasBet = true;
    betBtn.disabled = true;
});

// Event listener untuk tombol cash out
cashoutBtn.addEventListener('click', () => {
    socket.emit('cashout', currentMultiplier);
    hasBet = false;
    betBtn.disabled = false;
    cashoutBtn.disabled = true;
});
