import './App.css';
import { useEffect, useState } from 'react';
import logo from './logo.jpg';
import { contractABI } from './contracts/Example.js';
import { contractAddress } from './Constants';
const ethers = require('ethers');

const ENTRY_FEE = 1000;

function App() {
  const [provider, setProvider] = useState(null);
  const [connectedAddress, setConnectedAddress] = useState(null);
  const [winner, setWinner] = useState(null);

  const [owner, setOwner] = useState(null);
  const [entryFee, setEntryFee] = useState(null);
  const [players, setPlayers] = useState(null);

  useEffect(() => {
    (async () => {
      if (!provider) return;

      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        contractAddress,
        contractABI,
        signer
      );

      setOwner(await contract.owner());
      setEntryFee(parseInt(await contract.entryFee()));
      setPlayers(await contract.getPlayers());

      contract.on('UpdatePlayers', async () => {
        console.log('Players updated');
        setPlayers(await contract.getPlayers());
      });
    })();
  }, [provider]);

  const connectWallet = async () => {
    try {
      if (window.ethereum) {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const newProvider = new ethers.BrowserProvider(window.ethereum);
        setProvider(newProvider);
        const accounts = await newProvider.listAccounts();
        setConnectedAddress(accounts[0].address);
      } else {
        throw new Error('No Ethereum provider detected');
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  };

  const callContractFunction = async (func) => {
    try {
      if (!provider) {
        throw new Error('Ethereum provider not initialized');
      }

      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        contractAddress,
        contractABI,
        signer
      );

      if (func === 'joinRoulette') {
        await contract.joinRoulette({
          value: ENTRY_FEE,
        });

        await updatePlayers();
      } else if (func === 'beginRoulette') {
        console.log('Roulette Begin');
        const address = await contract.beginRoulette();
        setWinner(address);
      } else if (func === 'resetRoulette') {
        console.log('Roulette Begin');
        await contract.clearRoulette();
      }
    } catch (error) {
      console.error('Error calling contract function:', error);
    }
  };

  const updatePlayers = async () => {
    try {
      if (!provider) {
        throw new Error('Ethereum provider not initialized');
      }

      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        contractAddress,
        contractABI,
        signer
      );

      setPlayers(await contract.getPlayers());
    } catch (error) {
      console.error('Error calling contract function:', error);
    }
  };

  return (
    <div className="bg-gray-900 min-h-screen flex py-4 justify-center">
      <div className="bg-gray-800 rounded-lg p-8 shadow-xl max-w-3xl w-full">
        <h1 className="text-white text-3xl font-bold mb-4">
          Blockchain Roulette
        </h1>

        {connectedAddress && (
          <div className="mb-6">
            <p className="text-white text-lg font-medium">Connected Wallet:</p>
            <p className="text-white text-xl">{connectedAddress}</p>
            <p className="text-white text-lg font-medium mt-2">Entry Fee:</p>
            <p className="text-white text-xl">{entryFee}</p>
          </div>
        )}
        {!connectedAddress && (
          <button
            onClick={connectWallet}
            className="bg-indigo-500 text-white px-8 py-3 rounded-md hover:bg-indigo-600 focus:outline-none focus:ring focus:ring-indigo-500"
          >
            Connect Wallet
          </button>
        )}
        {connectedAddress && (
          <div className="flex gap-x-2">
            <button
              onClick={() => callContractFunction('joinRoulette')}
              className="bg-green-500 text-white px-8 py-3 rounded-md hover:bg-green-600 focus:outline-none focus:ring focus:ring-green-500"
            >
              Join Roulette
            </button>
            {connectedAddress === owner && players?.length > 1 && (
              <button
                onClick={() => callContractFunction('beginRoulette')}
                className="bg-green-500 text-white px-8 py-3 rounded-md hover:bg-green-600 focus:outline-none focus:ring focus:ring-green-500"
              >
                Begin Roulette
              </button>
            )}
            {connectedAddress === owner && players?.length !== 0 && (
              <button
                onClick={() => callContractFunction('clearRoulette')}
                className="bg-green-500 text-white px-8 py-3 rounded-md hover:bg-green-600 focus:outline-none focus:ring focus:ring-green-500"
              >
                Reset Roulette
              </button>
            )}
          </div>
        )}

        {winner && (
          <div className="mt-8">
            <h5 className="text-white text-xl font-bold">
              Winner of Last Roulette:
            </h5>
            <p className="text-white text-lg">{winner?.from}</p>
          </div>
        )}

        <h5 className="text-white text-xl font-bold mt-8">Players List</h5>
        {players?.map((player, index) => (
          <p key={index} className="text-white text-lg">
            {index + 1}) {player}
          </p>
        ))}
      </div>
    </div>
  );
}

export default App;
