const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

app.use(express.static('public'));

let players = {};

function generateCrashPoint() {
    return Math.random() * 10 + 1;
}

setInterval(() => {
    const crashPoint = generateCrashPoint();
    let multiplier = 1.00;

    const interval = setInterval(() => {
        multiplier += 0.05;
        io.emit('multiplierUpdate', { multiplier: multiplier.toFixed(2) });

        if (multiplier >= crashPoint) {
            clearInterval(interval);
            io.emit('crash', { crashPoint: multiplier.toFixed(2) });

            Object.keys(players).forEach(playerId => {
                if (players[playerId].bet > 0) {
                    players[playerId].bet = 0;
                }
            });
        }
    }, 100);
}, 10000);

io.on('connection', (socket) => {
    console.log('Pemain terhubung:', socket.id);

    players[socket.id] = { balance: 1000, bet: 0 };
    socket.emit('balanceUpdate', players[socket.id].balance);

    socket.on('placeBet', (betAmount) => {
        if (players[socket.id].bet > 0) {
            socket.emit('status', 'Kamu sudah bertaruh di ronde ini!');
            return;
        }

        if (betAmount <= 0 || betAmount > players[socket.id].balance) {
            socket.emit('status', 'Jumlah taruhan tidak valid atau saldo tidak cukup!');
            return;
        }

        players[socket.id].bet = betAmount;
        players[socket.id].balance -= betAmount;
        socket.emit('balanceUpdate', players[socket.id].balance);
        socket.emit('status', `Taruhan ${betAmount} ditempatkan!`);
    });

    socket.on('cashout', (multiplier) => {
        if (players[socket.id].bet === 0) {
            socket.emit('status', 'Kamu belum bertaruh di ronde ini!');
            return;
        }

        const winnings = players[socket.id].bet * multiplier;
        players[socket.id].balance += winnings;
        players[socket.id].bet = 0;
        socket.emit('balanceUpdate', players[socket.id].balance);
        socket.emit('status', `Kamu menang ${winnings.toFixed(2)} pada ${multiplier}x!`);
    });

    socket.on('disconnect', () => {
        console.log('Pemain terputus:', socket.id);
        delete players[socket.id];
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Server berjalan di port ${PORT}`);
});
