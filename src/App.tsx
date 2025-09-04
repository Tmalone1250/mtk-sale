import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { CONTRACT_ADDRESSES, SEPOLIA_CHAIN_ID } from './contract_address'
import { TokenABI } from './abis/TokenABI'
import { TokenSaleABI } from './abis/TokenSaleABI'
import './App.css'

interface TokenInfo {
  name: string;
  symbol: string;
  balance: string;
  totalSupply: string;
  maxSupply: string;
}

interface TokenSaleInfo {
  buyPrice: string;
  sellPrice: string;
}

function App() {
  const [account, setAccount] = useState<string>('')
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null)
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null)
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null)
  const [tokenSaleInfo, setTokenSaleInfo] = useState<TokenSaleInfo | null>(null)
  const [buyAmount, setBuyAmount] = useState('')
  const [sellAmount, setSellAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Connect wallet
  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        setError('Please install MetaMask!')
        return
      }

      const provider = new ethers.BrowserProvider(window.ethereum)
      const accounts = await provider.send('eth_requestAccounts', [])
      
      // Check if we're on Sepolia
      const network = await provider.getNetwork()
      if (Number(network.chainId) !== SEPOLIA_CHAIN_ID) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${SEPOLIA_CHAIN_ID.toString(16)}` }],
          })
        } catch (switchError: any) {
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: `0x${SEPOLIA_CHAIN_ID.toString(16)}`,
                chainName: 'Sepolia Testnet',
                nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
                rpcUrls: ['https://rpc.sepolia.org'],
                blockExplorerUrls: ['https://sepolia.etherscan.io']
              }]
            })
          }
        }
      }

      const signer = await provider.getSigner()
      setProvider(provider)
      setSigner(signer)
      setAccount(accounts[0])
      setError('')
    } catch (err: any) {
      setError(err.message)
    }
  }

  // Load contract data
  const loadContractData = async () => {
    if (!provider || !account) return

    try {
      const tokenContract = new ethers.Contract(CONTRACT_ADDRESSES.TOKEN, TokenABI, provider)
      const tokenSaleContract = new ethers.Contract(CONTRACT_ADDRESSES.TOKEN_SALE, TokenSaleABI, provider)

      // Get token info
      const [name, symbol, balance, totalSupply, maxSupply] = await Promise.all([
        tokenContract.name(),
        tokenContract.symbol(),
        tokenContract.balanceOf(account),
        tokenContract.totalSupply(),
        tokenContract.MAX_SUPPLY()
      ])

      setTokenInfo({
        name,
        symbol,
        balance: ethers.formatEther(balance),
        totalSupply: ethers.formatEther(totalSupply),
        maxSupply: ethers.formatEther(maxSupply)
      })

      // Get token sale info
      const [buyPrice, sellPrice] = await Promise.all([
        tokenSaleContract.buyPrice(),
        tokenSaleContract.sellPrice()
      ])

      setTokenSaleInfo({
        buyPrice: ethers.formatEther(buyPrice),
        sellPrice: ethers.formatEther(sellPrice)
      })
    } catch (err: any) {
      setError(err.message)
    }
  }

  // Buy tokens
  const buyTokens = async () => {
    if (!signer || !tokenSaleInfo || !buyAmount) return

    try {
      setLoading(true)
      setError('')
      
      const tokenSaleContract = new ethers.Contract(CONTRACT_ADDRESSES.TOKEN_SALE, TokenSaleABI, signer)
      const cost = ethers.parseEther((parseFloat(buyAmount) * parseFloat(tokenSaleInfo.buyPrice)).toString())
      
      const tx = await tokenSaleContract.buyTokens({ value: cost })
      await tx.wait()
      
      setBuyAmount('')
      await loadContractData()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Sell tokens
  const sellTokens = async () => {
    if (!signer || !sellAmount) return

    try {
      setLoading(true)
      setError('')
      
      const tokenContract = new ethers.Contract(CONTRACT_ADDRESSES.TOKEN, TokenABI, signer)
      const tokenSaleContract = new ethers.Contract(CONTRACT_ADDRESSES.TOKEN_SALE, TokenSaleABI, signer)
      
      const amount = ethers.parseEther(sellAmount)
      
      // First approve the token sale contract to spend tokens
      const approveTx = await tokenContract.approve(CONTRACT_ADDRESSES.TOKEN_SALE, amount)
      await approveTx.wait()
      
      // Then sell the tokens
      const sellTx = await tokenSaleContract.sellTokens(amount)
      await sellTx.wait()
      
      setSellAmount('')
      await loadContractData()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (account && provider) {
      loadContractData()
    }
  }, [account, provider])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">MyToken (MTK) Sale</h1>
          <p className="text-gray-600">Buy and sell MTK tokens on Sepolia testnet</p>
        </header>

        {!account ? (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <h2 className="text-2xl font-semibold mb-4">Connect Your Wallet</h2>
            <p className="text-gray-600 mb-6">Connect your MetaMask wallet to start trading MTK tokens</p>
            <button
              onClick={connectWallet}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Connect MetaMask
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Account Info */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Account Information</h2>
              <p className="text-gray-600">
                <span className="font-medium">Connected:</span> {account.slice(0, 6)}...{account.slice(-4)}
              </p>
            </div>

            {/* Token Info */}
            {tokenInfo && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Token Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-600"><span className="font-medium">Name:</span> {tokenInfo.name}</p>
                    <p className="text-gray-600"><span className="font-medium">Symbol:</span> {tokenInfo.symbol}</p>
                  </div>
                  <div>
                    <p className="text-gray-600"><span className="font-medium">Your Balance:</span> {parseFloat(tokenInfo.balance).toFixed(4)} MTK</p>
                    <p className="text-gray-600"><span className="font-medium">Total Supply:</span> {parseFloat(tokenInfo.totalSupply).toFixed(0)} MTK</p>
                  </div>
                </div>
              </div>
            )}

            {/* Token Sale Info */}
            {tokenSaleInfo && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Token Sale Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-gray-600"><span className="font-medium">Buy Price:</span> {tokenSaleInfo.buyPrice} ETH</p>
                  </div>
                  <div>
                    <p className="text-gray-600"><span className="font-medium">Sell Price:</span> {tokenSaleInfo.sellPrice} ETH</p>
                  </div>
                  <div>
                    <p className="text-gray-600">
                      <span className="font-medium">Status:</span> 
                      <span className="ml-2 px-2 py-1 rounded text-sm bg-green-100 text-green-800">
                        Active
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Trading Interface */}
            {tokenSaleInfo && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Buy Tokens */}
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h3 className="text-lg font-semibold mb-4 text-green-700">Buy Tokens</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Amount of MTK to buy
                      </label>
                      <input
                        type="number"
                        value={buyAmount}
                        onChange={(e) => setBuyAmount(e.target.value)}
                        placeholder="Enter amount"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                      {buyAmount && tokenSaleInfo && (
                        <p className="text-sm text-gray-600 mt-1">
                          Cost: {(parseFloat(buyAmount) * parseFloat(tokenSaleInfo.buyPrice)).toFixed(6)} ETH
                        </p>
                      )}
                    </div>
                    <button
                      onClick={buyTokens}
                      disabled={loading || !buyAmount}
                      className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                    >
                      {loading ? 'Processing...' : 'Buy Tokens'}
                    </button>
                  </div>
                </div>

                {/* Sell Tokens */}
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h3 className="text-lg font-semibold mb-4 text-red-700">Sell Tokens</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Amount of MTK to sell
                      </label>
                      <input
                        type="number"
                        value={sellAmount}
                        onChange={(e) => setSellAmount(e.target.value)}
                        placeholder="Enter amount"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                      {sellAmount && tokenSaleInfo && (
                        <p className="text-sm text-gray-600 mt-1">
                          You'll receive: {(parseFloat(sellAmount) * parseFloat(tokenSaleInfo.sellPrice)).toFixed(6)} ETH
                        </p>
                      )}
                    </div>
                    <button
                      onClick={sellTokens}
                      disabled={loading || !sellAmount}
                      className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                    >
                      {loading ? 'Processing...' : 'Sell Tokens'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            {/* Contract Links */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Contract Information</h3>
              <div className="space-y-2">
                <p className="text-sm">
                  <span className="font-medium">Token Contract:</span>{' '}
                  <a
                    href={`https://sepolia.etherscan.io/address/${CONTRACT_ADDRESSES.TOKEN}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {CONTRACT_ADDRESSES.TOKEN}
                  </a>
                </p>
                <p className="text-sm">
                  <span className="font-medium">TokenSale Contract:</span>{' '}
                  <a
                    href={`https://sepolia.etherscan.io/address/${CONTRACT_ADDRESSES.TOKEN_SALE}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {CONTRACT_ADDRESSES.TOKEN_SALE}
                  </a>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
