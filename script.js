const form = document.getElementById('betForm');
const betsTable = document.querySelector('#betsTable tbody');
const betChart = document.getElementById('betChart').getContext('2d');
const tipsterChart = document.getElementById('tipsterChart').getContext('2d');
const dailyProfitChart = document.getElementById('dailyProfitChart').getContext('2d');
const tipsterProfitChart = document.getElementById('tipsterProfitChart').getContext('2d');
const totalGreen = document.getElementById('totalGreen');
const totalRed = document.getElementById('totalRed');
const stackeDisplay = document.getElementById('stacke');
const confirmation = document.getElementById('confirmation');
const errorMessage = document.getElementById('errorMessage');
const editingBetId = document.getElementById('editingBetId');

let bets = JSON.parse(localStorage.getItem('bets')) || [];
let stacke = JSON.parse(localStorage.getItem('stacke')) || 1000; // Saldo inicial de R$ 1000

let betChartInstance, tipsterChartInstance, dailyProfitChartInstance, tipsterProfitChartInstance;

// Função para calcular lucro de uma aposta
function calculateProfit(bet) {
  if (bet.resultado === 'green') {
    return (bet.valor * bet.odd) - bet.valor; // Lucro positivo
  } else if (bet.resultado === 'red') {
    return -bet.valor; // Perda total
  }
  return 0; // Para apostas "aberto"
}

function updateTable() {
  betsTable.innerHTML = '';
  bets.forEach((bet, index) => {
    const profit = calculateProfit(bet);
    const row = `<tr>
      <td>${bet.tipster}</td>
      <td>${bet.odd}</td>
      <td>${bet.valor}</td>
      <td>${bet.resultado}</td>
      <td>R$ ${profit.toFixed(2)}</td> <!-- Mostrando lucro/perda -->
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

// Atualiza gráfico de lucro por tipster
function updateTipsterProfitChart() {
  const tipsters = {};
  bets.forEach(bet => {
    const tipster = bet.tipster;
    if (!tipsters[tipster]) {
      tipsters[tipster] = 0;
    }
    tipsters[tipster] += calculateProfit(bet);
  });

  const labels = Object.keys(tipsters);
  const profitData = labels.map(tipster => tipsters[tipster]);

  if (tipsterProfitChartInstance) tipsterProfitChartInstance.destroy();
  
  tipsterProfitChartInstance = new Chart(tipsterProfitChart, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Lucro',
          backgroundColor: 'blue',
          data: profitData
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

// Atualiza gráfico de lucro total diário
function updateDailyProfitChart() {
  const dailyProfits = {};
  bets.forEach(bet => {
    const date = bet.data;
    if (!dailyProfits[date]) {
      dailyProfits[date] = 0;
    }
    dailyProfits[date] += calculateProfit(bet);
  });

  const labels = Object.keys(dailyProfits);
  const profitData = labels.map(date => dailyProfits[date]);

  if (dailyProfitChartInstance) dailyProfitChartInstance.destroy();
  
  dailyProfitChartInstance = new Chart(dailyProfitChart, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Lucro Diário',
          backgroundColor: 'green',
          data: profitData
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

  const today = new Date().toISOString().split('T')[0];
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
  updateStacke();
  updateTotals();
  updateTipsterProfitChart();  // Atualiza gráfico de lucro por tipster
  updateDailyProfitChart();    // Atualiza gráfico de lucro diário
});

// Demais funções seguem o mesmo padrão do código anterior (excluir, editar, etc.)
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