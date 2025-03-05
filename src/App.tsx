import React, { useState, useCallback, useEffect } from 'react';
import { Spade as Spades, Heart as Hearts, Diamond as Diamonds, Club as Clubs, Volume2, VolumeX } from 'lucide-react';
import { initMercadoPago, Wallet } from '@mercadopago/sdk-react';

initMercadoPago('APP_USR-508a31c5-8563-4feb-ada5-c9a1a93a48a8');

type Symbol = 'spades' | 'hearts' | 'diamonds' | 'clubs';
type SlotState = [Symbol, Symbol, Symbol];

const SYMBOLS: Symbol[] = ['spades', 'hearts', 'diamonds', 'clubs'];
const BET_AMOUNTS = [2, 5, 10, 20, 50];
const WINNING_COMBINATIONS = {
  hearts: 25,
  diamonds: 15,
  spades: 5,
  clubs: 2.5,
};

const PAYMENT_AMOUNTS = [5, 10, 20, 50, 100, 200];
const WIN_PROBABILITY = 0.05; // 5% chance of winning

function App() {
  const [balance, setBalance] = useState(20);
  const [slots, setSlots] = useState<SlotState>(['spades', 'hearts', 'diamonds']);
  const [isSpinning, setIsSpinning] = useState(false);
  const [lastWin, setLastWin] = useState(0);
  const [sound, setSound] = useState(true);
  const [showPaytable, setShowPaytable] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState(5);
  const [preferenceId, setPreferenceId] = useState<string | null>(null);
  const [currentBet, setCurrentBet] = useState(2);

  // Check for payment status in URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const status = urlParams.get('status');
    const amount = urlParams.get('payment_id');

    if (status === 'approved' && amount) {
      // Update balance with the selected amount
      setBalance(prev => prev + selectedAmount);
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
      // Close payment modal
      setShowPaymentModal(false);
      setPreferenceId(null);
    }
  }, [selectedAmount]);

  const playSound = useCallback((soundName: 'spin' | 'win') => {
    if (!sound) return;
    const audio = new Audio(
      soundName === 'spin'
        ? 'https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3'
        : 'https://assets.mixkit.co/active_storage/sfx/2001/2001-preview.mp3'
    );
    audio.play();
  }, [sound]);

  const getSymbolIcon = (symbol: Symbol, size = 24) => {
    switch (symbol) {
      case 'spades':
        return <Spades size={size} className="text-white" />;
      case 'hearts':
        return <Hearts size={size} className="text-red-500" />;
      case 'diamonds':
        return <Diamonds size={size} className="text-red-500" />;
      case 'clubs':
        return <Clubs size={size} className="text-white" />;
    }
  };

  const generateSlots = (): SlotState => {
    const isWinner = Math.random() < WIN_PROBABILITY;
    
    if (isWinner) {
      const winningSymbol = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
      return [winningSymbol, winningSymbol, winningSymbol];
    } else {
      let slots: SlotState = ['spades', 'spades', 'spades'];
      do {
        slots = [
          SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
          SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
          SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        ] as SlotState;
      } while (slots[0] === slots[1] && slots[1] === slots[2]);
      return slots;
    }
  };

  const checkWin = (newSlots: SlotState) => {
    if (newSlots[0] === newSlots[1] && newSlots[1] === newSlots[2]) {
      const multiplier = WINNING_COMBINATIONS[newSlots[0]];
      const winAmount = currentBet * multiplier;
      setBalance(prev => prev + winAmount);
      setLastWin(winAmount);
      playSound('win');
      return true;
    }
    setLastWin(0);
    return false;
  };

  const spin = () => {
    if (isSpinning || balance < currentBet) return;

    setBalance(prev => prev - currentBet);
    setIsSpinning(true);
    playSound('spin');

    let spins = 0;
    const maxSpins = 20;
    const interval = setInterval(() => {
      setSlots(prev => {
        const newSlots: SlotState = [
          SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
          SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
          SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        ];
        return newSlots;
      });

      spins++;
      if (spins >= maxSpins) {
        clearInterval(interval);
        setIsSpinning(false);
        const finalSlots = generateSlots();
        setSlots(finalSlots);
        checkWin(finalSlots);
      }
    }, 100);
  };

  const createPreference = async () => {
    try {
      const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer APP_USR-3499365808502924-030421-87e0e7b8e7dbeba725542f6d1f07162b-29008060',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: [
            {
              title: `Créditos Rádio Tatuapé FM Slots - R$ ${selectedAmount.toFixed(2)}`,
              quantity: 1,
              currency_id: 'BRL',
              unit_price: selectedAmount,
            },
          ],
          back_urls: {
            success: window.location.href,
            failure: window.location.href,
            pending: window.location.href,
          },
          auto_return: 'approved',
        }),
      });

      const data = await response.json();
      setPreferenceId(data.id);
    } catch (error) {
      console.error('Error creating payment preference:', error);
    }
  };

  const handleOpenPaymentModal = () => {
    setShowPaymentModal(true);
    createPreference();
  };

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    createPreference();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white flex flex-col">
      {/* Header */}
      <header className="w-full py-6 px-4 text-center bg-black/30">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
          Rádio Tatuapé FM Slots
        </h1>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto max-w-2xl px-4 py-8">
        {/* Balance and Last Win */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-gray-800/50 backdrop-blur rounded-xl p-4 border border-gray-700">
            <p className="text-sm text-gray-400 mb-1">Saldo</p>
            <p className="text-2xl font-bold">R$ {balance.toFixed(2)}</p>
          </div>
          <div className="bg-gray-800/50 backdrop-blur rounded-xl p-4 border border-gray-700">
            <p className="text-sm text-gray-400 mb-1">Último Prêmio</p>
            <p className="text-2xl font-bold text-green-500">
              {lastWin > 0 ? `R$ ${lastWin.toFixed(2)}` : '-'}
            </p>
          </div>
        </div>

        {/* Game Area */}
        <div className="bg-gray-800/50 backdrop-blur rounded-xl p-6 border border-gray-700 mb-8">
          {/* Bet Amount Selector */}
          <div className="mb-6">
            <p className="text-sm text-gray-400 mb-2">Valor da Aposta</p>
            <div className="grid grid-cols-5 gap-2">
              {BET_AMOUNTS.map((amount) => (
                <button
                  key={amount}
                  onClick={() => setCurrentBet(amount)}
                  className={`p-2 rounded-lg text-sm font-medium transition-all ${
                    currentBet === amount
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  R$ {amount}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            {slots.map((symbol, index) => (
              <div
                key={index}
                className={`aspect-square flex items-center justify-center bg-gray-900/50 rounded-lg border border-gray-700 ${
                  isSpinning ? 'animate-pulse' : ''
                }`}
              >
                {getSymbolIcon(symbol, 48)}
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <button
              onClick={spin}
              disabled={isSpinning || balance < currentBet}
              className={`w-full py-4 px-6 rounded-lg font-bold text-lg transition-all duration-200 ${
                isSpinning || balance < currentBet
                  ? 'bg-gray-700 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-lg hover:shadow-purple-500/20'
              }`}
            >
              {isSpinning ? 'Girando...' : `Girar (R$ ${currentBet.toFixed(2)})`}
            </button>

            <button
              onClick={handleOpenPaymentModal}
              className="w-full py-4 px-6 rounded-lg font-bold text-lg bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 transition-all duration-200 shadow-lg hover:shadow-emerald-500/20"
            >
              Adicionar Saldo
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={() => setShowPaytable(!showPaytable)}
            className="px-4 py-2 rounded-lg bg-gray-800/50 backdrop-blur border border-gray-700 hover:bg-gray-700/50 transition-colors"
          >
            {showPaytable ? 'Ocultar Prêmios' : 'Ver Prêmios'}
          </button>
          <button
            onClick={() => setSound(!sound)}
            className="p-2 rounded-lg bg-gray-800/50 backdrop-blur border border-gray-700 hover:bg-gray-700/50 transition-colors"
          >
            {sound ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>
        </div>

        {/* Paytable */}
        {showPaytable && (
          <div className="bg-gray-800/50 backdrop-blur rounded-xl p-6 border border-gray-700 mb-8">
            <h3 className="text-xl font-bold mb-4">Tabela de Multiplicadores</h3>
            <div className="space-y-3">
              {Object.entries(WINNING_COMBINATIONS).map(([symbol, multiplier]) => (
                <div key={symbol} className="flex items-center justify-between p-2 rounded bg-gray-900/30">
                  <div className="flex items-center gap-2">
                    {getSymbolIcon(symbol as Symbol)} x3
                  </div>
                  <span className="font-medium">{multiplier}x</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Payment Modal */}
        {showPaymentModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 p-6 rounded-xl max-w-md w-full border border-gray-700">
              <h2 className="text-xl font-bold mb-4">Adicionar Saldo</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  {PAYMENT_AMOUNTS.map((amount) => (
                    <button
                      key={amount}
                      onClick={() => handleAmountSelect(amount)}
                      className={`p-2 rounded ${
                        selectedAmount === amount
                          ? 'bg-purple-600'
                          : 'bg-gray-700 hover:bg-gray-600'
                      }`}
                    >
                      R$ {amount}
                    </button>
                  ))}
                </div>
                {preferenceId && (
                  <Wallet 
                    initialization={{ preferenceId }}
                    customization={{ texts: { valueProp: 'smart_payment' } }}
                  />
                )}
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setPreferenceId(null);
                  }}
                  className="w-full py-2 px-4 bg-gray-700 rounded hover:bg-gray-600"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full py-6 px-4 bg-black/30 text-center">
        <div className="container mx-auto max-w-2xl">
          <p className="font-medium mb-2">Desenvolvido por Julio Campos Machado</p>
          <p className="text-sm text-gray-400 mb-2">Programador Full Stack</p>
          <div className="flex justify-center gap-4">
            <a 
              href="https://wa.me/5511970603441" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-green-500 hover:text-green-400 transition-colors"
            >
              WhatsApp: (11) 97060-3441
            </a>
            <a 
              href="https://likelook.wixsite.com/solutions" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-400 transition-colors"
            >
              Like Look Solutions
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;