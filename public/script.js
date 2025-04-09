const socket = io();
let provider, signer, walletAddress;

const balanceDisplay = document.getElementById('balance');
const multiplierDisplay = document.getElementById('multiplier');
const line = document.getElementById('line');
const betBtn = document.getElementById('betBtn');
const cashoutBtn = document.getElementById('cashoutBtn');
const betAmountInput = document.getElementById('betAmount');
const status = document.getElementById('status');
const connectWalletBtn = document.getElementById('connectWalletBtn');
const walletAddressDisplay = document.getElementById('walletAddress');
const depositBtn = document.getElementById('depositBtn');
const withdrawBtn = document.getElementById('withdrawBtn');
const depositAmountInput = document.getElementById('depositAmount');
const withdrawAmountInput = document.getElementById('withdrawAmount');

let currentMultiplier = 1.00;
let hasBet = false;

// Hubungkan wallet
connectWalletBtn.addEventListener('click', async () => {
    if (typeof window.ethereum !== 'undefined') {
        try {
            // Minta akses ke wallet
            await window.ethereum.request({ method: 'eth_requestAccounts' });

            // Pastikan jaringan adalah Sepolia Testnet (chainId: 11155111)
            const chainId = await window.ethereum.request({ method: 'eth_chainId' });
            if (chainId !== '0xAA36A7') { // 0xAA36A7 adalah chainId untuk Sepolia
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: '0xAA36A7' }],
                });
            }

            provider = new ethers.providers.Web3Provider(window.ethereum);
            signer = provider.getSigner();
            walletAddress = await signer.getAddress();

            walletAddressDisplay.textContent = `Wallet: ${walletAddress}`;
            connectWalletBtn.disabled = true;
            depositBtn.disabled = false;
            withdrawBtn.disabled = false;
            betBtn.disabled = false;

            // Tambahkan Sepolia Testnet jika belum ada
            await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                    chainId: '0xAA36A7',
                    chainName: 'Sepolia Testnet',
                    nativeCurrency: {
                        name: 'Sepolia ETH',
                        symbol: 'ETH',
                        decimals: 18
                    },
                    rpcUrls: ['https://sepolia.infura.io/v3/YOUR_INFURA_KEY'], // Ganti dengan Infura key kamu
                    blockExplorerUrls: ['https://sepolia.etherscan.io']
                }]
            });
        } catch (error) {
            status.textContent = `Gagal menghubungkan wallet: ${error.message}`;
        }
    } else {
        status.textContent = 'MetaMask tidak terdeteksi. Silakan instal MetaMask.';
    }
});

// Deposit
depositBtn.addEventListener('click', async () => {
    const amount = parseFloat(depositAmountInput.value);
    if (amount <= 0) {
        status.textContent = 'Jumlah deposit tidak valid!';
        return;
    }

    try {
        // Kirim transaksi deposit ke server (simulasi)
        socket.emit('deposit', amount, walletAddress);

        // Di dunia nyata, kita akan mengirimkan transaksi ke smart contract
        // Contoh: Kirim Sepolia ETH ke alamat server
        /*
        const tx = {
            to: 'ALAMAT_SERVER', // Ganti dengan alamat server atau smart contract
            value: ethers.utils.parseEther(amount.toString())
        };
        const transaction = await signer.sendTransaction(tx);
        await transaction.wait();
        */
    } catch (error) {
        status.textContent = `Gagal deposit: ${error.message}`;
    }
});

// Withdraw
withdrawBtn.addEventListener('click', async () => {
    const amount = parseFloat(withdrawAmountInput.value);
    if (amount <= 0) {
        status.textContent = 'Jumlah withdraw tidak valid!';
        return;
    }

    socket.emit('withdraw', amount);
});

// Update saldo
socket.on('balanceUpdate', (balance) => {
    balanceDisplay.textContent = balance.toFixed(4);
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
