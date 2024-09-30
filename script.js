const form = document.getElementById('betForm');
const betsTable = document.querySelector('#betsTable tbody');
const betChart = document.getElementById('betChart').getContext('2d');
const tipsterChart = document.getElementById('tipsterChart').getContext('2d');
const totalGreen = document.getElementById('totalGreen');
const totalRed = document.getElementById('totalRed');
const stackeDisplay = document.getElementById('stacke');
const confirmation = document.getElementById('confirmation');
const errorMessage = document.getElementById('errorMessage');
const editingBetId = document.getElementById('editingBetId');

// Modal elements
const stackeModal = document.getElementById('stackeModal');
const modalTitle = document.getElementById('modalTitle');
const modalAmount = document.getElementById('modalAmount');
const modalConfirmButton = document.getElementById('modalConfirmButton');
const modalCancelButton = document.getElementById('modalCancelButton');

let bets = JSON.parse(localStorage.getItem('bets')) || [];
let stacke = JSON.parse(localStorage.getItem('stacke')) || 1000; // Saldo inicial de R$ 1000

let betChartInstance, tipsterChartInstance;

function updateTable() {
  betsTable.innerHTML = '';
  bets.forEach((bet, index) => {
    const row = `<tr>
      <td>${bet.tipster}</td>
      <td>${bet.odd}</td>
      <td>${bet.valor}</td>
      <td>${bet.resultado}</td>
      <td>${bet.data}</td>
      <td>
        <button class="edit-button" onclick="editBet(${index})">Editar</button>
        <button class="delete-button" onclick="deleteBet(${index})">Excluir</button>
      </td>
    </tr>`;
    betsTable.innerHTML += row;
  });
}

function updateStacke() {
  stackeDisplay.innerText = `R$ ${stacke.toFixed(2)}`;
}

function updateTotals() {
  const totalGreenValue = bets.filter(bet => bet.resultado === 'green').reduce((sum, bet) => sum + bet.valor, 0);
  const totalRedValue = bets.filter(bet => bet.resultado === 'red').reduce((sum, bet) => sum + bet.valor, 0);
  
  totalGreen.innerText = `Total Green: R$ ${totalGreenValue.toFixed(2)}`;
  totalRed.innerText = `Total Red: R$ ${totalRedValue.toFixed(2)}`;
}

// Função para atualizar gráfico de apostas por data
function updateChart() {
  const dates = {};
  bets.forEach(bet => {
    const date = bet.data;
    if (!dates[date]) {
      dates[date] = { green: 0, red: 0 };
    }
    dates[date][bet.resultado] += parseFloat(bet.valor);
  });

  const labels = Object.keys(dates);
  const greenData = labels.map(date => dates[date].green);
  const redData = labels.map(date => dates[date].red);

  // Destroi o gráfico anterior se existir, para evitar sobreposição
  if (betChartInstance) betChartInstance.destroy();

  betChartInstance = new Chart(betChart, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Green',
          backgroundColor: 'green',
          data: greenData
        },
        {
          label: 'Red',
          backgroundColor: 'red',
          data: redData
        }
      ]
    },
    options: {
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

// Função para atualizar gráfico por tipster
function updateTipsterChart() {
  const tipsters = {};
  bets.forEach(bet => {
    const tipster = bet.tipster;
    if (!tipsters[tipster]) {
      tipsters[tipster] = { green: 0, red: 0 };
    }
    tipsters[tipster][bet.resultado] += parseFloat(bet.valor);
  });

  const labels = Object.keys(tipsters);
  const greenData = labels.map(tipster => tipsters[tipster].green);
  const redData = labels.map(tipster => tipsters[tipster].red);

  // Destroi o gráfico anterior se existir, para evitar sobreposição
  if (tipsterChartInstance) tipsterChartInstance.destroy();

  tipsterChartInstance = new Chart(tipsterChart, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Green',
          backgroundColor: 'green',
          data: greenData
        },
        {
          label: 'Red',
          backgroundColor: 'red',
          data: redData
        }
      ]
    },
    options: {
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

form.addEventListener('submit', function (event) {
  event.preventDefault();

  const today = new Date().toISOString().split('T')[0]; // Data atual do sistema
  const editingIndex = editingBetId.value;

  const newBet = {
    tipster: form.elements['tipster'].value,
    odd: parseFloat(form.elements['odd'].value),
    valor: parseFloat(form.elements['valor'].value),
    resultado: form.elements['resultado'].value,
    data: today
  };

  if (editingIndex) {
    bets[editingIndex] = newBet;
    editingBetId.value = '';
    confirmation.innerText = 'Aposta atualizada com sucesso!';
  } else {
    if (newBet.resultado === 'green') {
      stacke += (newBet.valor * newBet.odd) - newBet.valor;
    } else if (newBet.resultado === 'red') {
      stacke -= newBet.valor;
    }
    bets.push(newBet);
    confirmation.innerText = 'Aposta registrada com sucesso!';
  }

  localStorage.setItem('bets', JSON.stringify(bets));
  localStorage.setItem('stacke', JSON.stringify(stacke));

  form.reset();
  updateTable();
  updateStacke();  // Atualiza o saldo
  updateTotals();  // Atualiza os totais
  updateChart();   // Atualiza o gráfico de apostas
  updateTipsterChart();  // Atualiza o gráfico por tipster
});

function deleteBet(index) {
  const bet = bets[index];

  if (bet.resultado === 'green') {
    stacke -= (bet.valor * bet.odd) - bet.valor;
  } else if (bet.resultado === 'red') {
    stacke += bet.valor;
  }

  bets.splice(index, 1); // Remove a aposta
  localStorage.setItem('bets', JSON.stringify(bets));
  localStorage.setItem('stacke', JSON.stringify(stacke));

  updateTable();
  updateStacke();
  updateTotals();
  updateChart();  // Atualiza o gráfico após excluir
  updateTipsterChart();
}

function editBet(index) {
  const bet = bets[index];
  form.elements['tipster'].value = bet.tipster;
  form.elements['odd'].value = bet.odd;
  form.elements['valor'].value = bet.valor;
  form.elements['resultado'].value = bet.resultado;
  editingBetId.value = index;
}

// Modal functionality for deposits, withdrawals, and stacke edits
let currentModalAction = '';

document.getElementById('depositButton').addEventListener('click', () => {
  modalTitle.innerText = 'Adicionar Depósito';
  currentModalAction = 'deposit';
  modalAmount.value = '';
  stackeModal.classList.add('active');
});

document.getElementById('withdrawButton').addEventListener('click', () => {
  modalTitle.innerText = 'Realizar Saque';
  currentModalAction = 'withdraw';
  modalAmount.value = '';
  stackeModal.classList.add('active');
});

document.getElementById('editStackeButton').addEventListener('click', () => {
  modalTitle.innerText = 'Editar Stacke';
  currentModalAction = 'edit';
  modalAmount.value = stacke;
  stackeModal.classList.add('active');
});

modalConfirmButton.addEventListener('click', () => {
  const amount = parseFloat(modalAmount.value);

  if (isNaN(amount) || amount <= 0) {
    alert('Por favor, insira um valor válido.');
    return;
  }

  if (currentModalAction === 'deposit') {
    stacke += amount;
  } else if (currentModalAction === 'withdraw') {
    if (amount > stacke) {
      alert('Saldo insuficiente.');
      return;
    }
    stacke -= amount;
  } else if (currentModalAction === 'edit') {
    stacke = amount;
  }

  localStorage.setItem('stacke', JSON.stringify(stacke));
  updateStacke();
  stackeModal.classList.remove('active');
});

modalCancelButton.addEventListener('click', () => {
  stackeModal.classList.remove('active');
});

window.onload = function () {
  updateTable();
  updateStacke();  // Atualiza o saldo
  updateTotals();  // Atualiza os totais
  updateChart();   // Inicializa os gráficos
  updateTipsterChart();
};
