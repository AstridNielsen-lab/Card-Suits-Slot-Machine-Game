import React, { useState, useCallback } from 'react';
import { Spade as Spades, Heart as Hearts, Diamond as Diamonds, Club as Clubs, Volume2, VolumeX } from 'lucide-react';
import { initMercadoPago, Wallet } from '@mercadopago/sdk-react';

initMercadoPago('APP_USR-508a31c5-8563-4feb-ada5-c9a1a93a48a8');

type Symbol = 'spades' | 'hearts' | 'diamonds' | 'clubs';
type SlotState = [Symbol, Symbol, Symbol];

const SYMBOLS: Symbol[] = ['spades', 'hearts', 'diamonds', 'clubs'];
const SPIN_COST = 10;
const WINNING_COMBINATIONS = {
  hearts: 100,
  diamonds: 75,
  spades: 50,
  clubs: 25,
};

const PAYMENT_AMOUNTS = [5, 10, 20, 50, 100, 200];

function App() {
  const [balance, setBalance] = useState(300);
  const [slots, setSlots] = useState<SlotState>(['spades', 'hearts', 'diamonds']);
  const [isSpinning, setIsSpinning] = useState(false);
  const [lastWin, setLastWin] = useState(0);
  const [sound, setSound] = useState(true);
  const [showPaytable, setShowPaytable] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState(5);
  const [preferenceId, setPreferenceId] = useState<string | null>(null);
  const [showCredits, setShowCredits] = useState(false);

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

  const checkWin = (newSlots: SlotState) => {
    if (newSlots[0] === newSlots[1] && newSlots[1] === newSlots[2]) {
      const winAmount = WINNING_COMBINATIONS[newSlots[0]];
      setBalance(prev => prev + winAmount);
      setLastWin(winAmount);
      playSound('win');
      return true;
    }
    setLastWin(0);
    return false;
  };

  const spin = () => {
    if (isSpinning || balance < SPIN_COST) return;

    setBalance(prev => prev - SPIN_COST);
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
        const finalSlots: SlotState = [
          SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
          SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
          SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        ];
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
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
            Rádio Tatuapé FM Slots
          </h1>
          <div className="flex justify-between items-center px-4 py-2 bg-gray-800 rounded-lg shadow-neon mb-4">
            <div>
              <p className="text-sm text-gray-400">Saldo</p>
              <p className="text-xl font-bold">R$ {balance.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Último Prêmio</p>
              <p className="text-xl font-bold text-green-500">
                {lastWin > 0 ? `R$ ${lastWin.toFixed(2)}` : '-'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-xl shadow-2xl">
          <div className="grid grid-cols-3 gap-4 mb-6">
            {slots.map((symbol, index) => (
              <div
                key={index}
                className={`aspect-square flex items-center justify-center bg-gray-700 rounded-lg ${
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
              disabled={isSpinning || balance < SPIN_COST}
              className={`w-full py-3 px-6 rounded-lg font-bold text-lg transition-all duration-200 ${
                isSpinning || balance < SPIN_COST
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-neon'
              }`}
            >
              {isSpinning ? 'Girando...' : 'Girar (R$ 10,00)'}
            </button>

            <button
              onClick={handleOpenPaymentModal}
              className="w-full py-3 px-6 rounded-lg font-bold text-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 transition-all duration-200 shadow-neon"
            >
              Adicionar Saldo
            </button>
          </div>
        </div>

        <div className="flex justify-between items-center mt-4">
          <div className="flex gap-4">
            <button
              onClick={() => setShowPaytable(!showPaytable)}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              {showPaytable ? 'Ocultar Prêmios' : 'Ver Prêmios'}
            </button>
            <button
              onClick={() => setShowCredits(!showCredits)}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              {showCredits ? 'Ocultar Créditos' : 'Ver Créditos'}
            </button>
          </div>
          <button
            onClick={() => setSound(!sound)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            {sound ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>
        </div>

        {showPaytable && (
          <div className="bg-gray-800 p-4 rounded-lg mt-4">
            <h3 className="text-lg font-bold mb-2">Tabela de Prêmios</h3>
            <div className="space-y-2">
              {Object.entries(WINNING_COMBINATIONS).map(([symbol, value]) => (
                <div key={symbol} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getSymbolIcon(symbol as Symbol)} x3
                  </div>
                  <span>R$ {value.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {showCredits && (
          <div className="bg-gray-800 p-4 rounded-lg mt-4">
            <h3 className="text-lg font-bold mb-2">Créditos</h3>
            <div className="space-y-2 text-sm">
              <p>Desenvolvido por: <strong>Julio Campos Machado</strong></p>
              <p>Programador Full Stack</p>
              <p>
                <a 
                  href="https://wa.me/5511970603441" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-green-500 hover:text-green-400"
                >
                  WhatsApp: (11) 97060-3441
                </a>
              </p>
              <p>
                <a 
                  href="https://likelook.wixsite.com/solutions" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-400"
                >
                  Like Look Solutions
                </a>
              </p>
            </div>
          </div>
        )}

        {showPaymentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-gray-800 p-6 rounded-xl max-w-md w-full">
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
      </div>
    </div>
  );
}

export default App;