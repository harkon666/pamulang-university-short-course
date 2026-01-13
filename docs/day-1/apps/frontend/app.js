/**
 * Day 1 - Connect Wallet Demo
 * Avalanche dApp - Pamulang University Short Course
 * 
 * Fitur:
 * - Connect Wallet dengan pilihan provider (MetaMask / Core)
 * - Network Detection & Validation
 * - Balance Display
 * - Event Listeners (accountsChanged, chainChanged)
 */

// ============================================
// Constants
// ============================================

const AVALANCHE_FUJI_CONFIG = {
  chainId: '0xA869', // 43113 in hex
  chainIdDecimal: 43113,
  chainName: 'Avalanche Fuji C-Chain',
  nativeCurrency: {
    name: 'AVAX',
    symbol: 'AVAX',
    decimals: 18
  },
  rpcUrls: ['https://api.avax-test.network/ext/bc/C/rpc'],
  blockExplorerUrls: ['https://subnets-test.avax.network/c-chain']
};

// Network names mapping
const NETWORK_NAMES = {
  1: 'Ethereum Mainnet',
  5: 'Goerli Testnet',
  11155111: 'Sepolia Testnet',
  137: 'Polygon Mainnet',
  80001: 'Polygon Mumbai',
  43114: 'Avalanche Mainnet',
  43113: 'Avalanche Fuji Testnet',
  56: 'BNB Smart Chain',
  97: 'BNB Testnet',
  42161: 'Arbitrum One',
  421613: 'Arbitrum Goerli'
};

// Wallet provider info
const WALLET_PROVIDERS = {
  metamask: {
    name: 'MetaMask',
    checkProperty: 'isMetaMask',
    downloadUrl: 'https://metamask.io/download/'
  },
  core: {
    name: 'Core Wallet',
    checkProperty: 'isAvalanche',
    downloadUrl: 'https://core.app/'
  }
};

// ============================================
// State
// ============================================

let walletState = {
  isConnected: false,
  address: null,
  chainId: null,
  balance: null,
  provider: null, // 'metamask' or 'core'
  providerName: null
};

let detectedWallets = {
  metamask: false,
  core: false
};

// ============================================
// DOM Elements
// ============================================

const elements = {
  // Status
  statusBar: document.getElementById('statusBar'),
  statusIndicator: document.getElementById('statusIndicator'),
  statusText: document.getElementById('statusText'),

  // Connect Section
  connectSection: document.getElementById('connectSection'),
  connectBtn: document.getElementById('connectBtn'),

  // Wallet Info
  walletInfo: document.getElementById('walletInfo'),
  networkName: document.getElementById('networkName'),
  chainId: document.getElementById('chainId'),
  networkBadge: document.getElementById('networkBadge'),
  networkIcon: document.getElementById('networkIcon'),
  networkStatusText: document.getElementById('networkStatusText'),
  switchNetworkBtn: document.getElementById('switchNetworkBtn'),
  addressFull: document.getElementById('addressFull'),
  addressShort: document.getElementById('addressShort'),
  balanceAmount: document.getElementById('balanceAmount'),

  // Error
  errorAlert: document.getElementById('errorAlert'),
  errorMessage: document.getElementById('errorMessage'),

  // Wallet Modal
  walletModal: document.getElementById('walletModal'),
  metamaskOption: document.getElementById('metamaskOption'),
  coreOption: document.getElementById('coreOption'),
  metamaskStatus: document.getElementById('metamaskStatus'),
  coreStatus: document.getElementById('coreStatus')
};

// ============================================
// EIP-6963 Multi-Wallet Discovery
// ============================================

// Store discovered providers from EIP-6963
let discoveredProviders = [];

/**
 * Setup EIP-6963 provider discovery
 * This allows us to detect all installed wallets properly
 */
function setupEIP6963() {
  // Listen for wallet announcements
  window.addEventListener('eip6963:announceProvider', (event) => {
    const { info, provider } = event.detail;
    console.log('🔔 EIP-6963 Provider announced:', info);

    // Store the provider with its info
    discoveredProviders.push({ info, provider });

    // Update detection based on provider info
    if (info.rdns?.includes('metamask') || info.name?.toLowerCase().includes('metamask')) {
      detectedWallets.metamask = true;
    }
    if (info.rdns?.includes('core') || info.rdns?.includes('avalanche') ||
      info.name?.toLowerCase().includes('core') || info.name?.toLowerCase().includes('avalanche')) {
      detectedWallets.core = true;
    }

    updateWalletStatusBadges();
  });

  // Request providers from all installed wallets
  window.dispatchEvent(new Event('eip6963:requestProvider'));
  console.log('📡 EIP-6963: Requested providers');
}

// ============================================
// Wallet Detection
// ============================================

/**
 * Detect available wallet providers
 */
function detectWallets() {
  console.log('🔍 Detecting wallets...');

  // Reset detection
  detectedWallets.metamask = false;
  detectedWallets.core = false;

  // Check for Core Wallet specific injection (window.avalanche or window.core)
  if (typeof window.avalanche !== 'undefined') {
    console.log('✅ Found window.avalanche');
    detectedWallets.core = true;
  }

  if (typeof window.core !== 'undefined') {
    console.log('✅ Found window.core');
    detectedWallets.core = true;
  }

  // Check window.ethereum
  if (typeof window.ethereum !== 'undefined') {
    console.log('📦 window.ethereum properties:', {
      isMetaMask: window.ethereum.isMetaMask,
      isAvalanche: window.ethereum.isAvalanche,
      isCoreWallet: window.ethereum.isCoreWallet,
      isCore: window.ethereum.isCore,
      hasProviders: !!window.ethereum.providers
    });

    // Check for multiple providers (EIP-6963 or legacy)
    const providers = window.ethereum.providers || [window.ethereum];
    console.log('📋 Found providers:', providers.length);

    providers.forEach((provider, index) => {
      console.log(`Provider ${index}:`, {
        isMetaMask: provider.isMetaMask,
        isAvalanche: provider.isAvalanche,
        isCoreWallet: provider.isCoreWallet,
        isCore: provider.isCore
      });

      // MetaMask detection (exclude if it's also Core)
      if (provider.isMetaMask && !provider.isAvalanche && !provider.isCoreWallet && !provider.isCore) {
        detectedWallets.metamask = true;
      }

      // Core Wallet detection
      if (provider.isAvalanche || provider.isCoreWallet || provider.isCore) {
        detectedWallets.core = true;
      }
    });

    // Fallback: check direct properties on window.ethereum
    if (!detectedWallets.metamask && window.ethereum.isMetaMask &&
      !window.ethereum.isAvalanche && !window.ethereum.isCoreWallet && !window.ethereum.isCore) {
      detectedWallets.metamask = true;
    }

    if (!detectedWallets.core &&
      (window.ethereum.isAvalanche || window.ethereum.isCoreWallet || window.ethereum.isCore)) {
      detectedWallets.core = true;
    }
  }

  console.log('🎯 Detection result:', detectedWallets);
  updateWalletStatusBadges();
}

/**
 * Get specific wallet provider
 */
function getWalletProvider(walletType) {
  console.log(`🔌 Getting provider for: ${walletType}`);
  console.log('📋 Discovered providers via EIP-6963:', discoveredProviders.map(p => p.info));

  if (walletType === 'core') {
    // Priority 0: Check EIP-6963 discovered providers first
    const eip6963Core = discoveredProviders.find(
      p => p.info.rdns?.includes('core') ||
        p.info.rdns?.includes('avalanche') ||
        p.info.name?.toLowerCase().includes('core') ||
        p.info.name?.toLowerCase().includes('avalanche')
    );
    if (eip6963Core) {
      console.log('Using Core from EIP-6963:', eip6963Core.info.name);
      return eip6963Core.provider;
    }

    // Priority 1: Check window.avalanche (Core Wallet specific injection)
    if (typeof window.avalanche !== 'undefined') {
      console.log('Using window.avalanche');
      return window.avalanche;
    }

    // Priority 2: Check window.core
    if (typeof window.core !== 'undefined') {
      console.log('Using window.core');
      return window.core;
    }

    // Priority 3: Check providers array in window.ethereum
    if (window.ethereum?.providers) {
      const coreProvider = window.ethereum.providers.find(
        p => p.isAvalanche || p.isCoreWallet || p.isCore
      );
      if (coreProvider) {
        console.log('Using Core from window.ethereum.providers array');
        return coreProvider;
      }
    }

    // Priority 4: Check window.ethereum directly
    if (window.ethereum?.isAvalanche || window.ethereum?.isCoreWallet || window.ethereum?.isCore) {
      console.log('Using window.ethereum (Core)');
      return window.ethereum;
    }

    console.log('❌ Core Wallet provider not found');
    return null;
  }

  if (walletType === 'metamask') {
    // Priority 0: Check EIP-6963 discovered providers first
    const eip6963Metamask = discoveredProviders.find(
      p => p.info.rdns?.includes('metamask') ||
        p.info.name?.toLowerCase().includes('metamask')
    );
    if (eip6963Metamask) {
      console.log('Using MetaMask from EIP-6963:', eip6963Metamask.info.name);
      return eip6963Metamask.provider;
    }

    // Priority 1: Check providers array first
    if (window.ethereum?.providers) {
      const metamaskProvider = window.ethereum.providers.find(
        p => p.isMetaMask && !p.isAvalanche && !p.isCoreWallet && !p.isCore
      );
      if (metamaskProvider) {
        console.log('Using MetaMask from window.ethereum.providers array');
        return metamaskProvider;
      }
    }

    // Priority 2: Check window.ethereum directly
    if (window.ethereum?.isMetaMask &&
      !window.ethereum?.isAvalanche &&
      !window.ethereum?.isCoreWallet &&
      !window.ethereum?.isCore) {
      console.log('Using window.ethereum (MetaMask)');
      return window.ethereum;
    }

    console.log('❌ MetaMask provider not found');
    return null;
  }

  return window.ethereum || null;
}

/**
 * Update wallet status badges in modal
 */
function updateWalletStatusBadges() {
  if (elements.metamaskStatus) {
    if (detectedWallets.metamask) {
      elements.metamaskStatus.innerHTML = '<span class="status-badge available">Available</span>';
    } else {
      elements.metamaskStatus.innerHTML = '<span class="status-badge not-installed">Click to try</span>';
    }
    // Don't disable - let user try anyway
    if (elements.metamaskOption) {
      elements.metamaskOption.disabled = false;
    }
  }

  if (elements.coreStatus) {
    if (detectedWallets.core) {
      elements.coreStatus.innerHTML = '<span class="status-badge available">Available</span>';
    } else {
      // Show "Click to try" instead of "Not Installed" - user might have Core installed but not detected
      elements.coreStatus.innerHTML = '<span class="status-badge not-installed">Click to try</span>';
    }
    // Don't disable - let user try anyway, Core might open from click
    if (elements.coreOption) {
      elements.coreOption.disabled = false;
    }
  }
}

// ============================================
// Modal Functions
// ============================================

/**
 * Open wallet selection modal
 */
function connectWallet() {
  detectWallets();
  elements.walletModal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

/**
 * Close wallet selection modal
 */
function closeWalletModal() {
  elements.walletModal.classList.add('hidden');
  document.body.style.overflow = '';

  // Reset connecting states
  elements.metamaskOption?.classList.remove('connecting');
  elements.coreOption?.classList.remove('connecting');
  updateWalletStatusBadges();
}

/**
 * Connect with specific wallet provider
 */
async function connectWithProvider(walletType) {
  try {
    const provider = getWalletProvider(walletType);

    if (!provider) {
      const walletInfo = WALLET_PROVIDERS[walletType];

      if (walletType === 'core') {
        // Show more detailed message for Core Wallet
        showError(`Core Wallet tidak terdeteksi. Pastikan: 1) Core Wallet terinstall, 2) Set sebagai default wallet di browser settings. Install: ${walletInfo.downloadUrl}`);

        // Open Core Wallet download page in new tab after 2 seconds
        setTimeout(() => {
          if (confirm('Buka halaman download Core Wallet?')) {
            window.open(walletInfo.downloadUrl, '_blank');
          }
        }, 500);
      } else {
        showError(`${walletInfo.name} tidak terdeteksi! Install dari ${walletInfo.downloadUrl}`);
      }
      return;
    }

    // Update UI to show connecting state
    const optionElement = walletType === 'metamask' ? elements.metamaskOption : elements.coreOption;
    const statusElement = walletType === 'metamask' ? elements.metamaskStatus : elements.coreStatus;

    optionElement?.classList.add('connecting');
    if (statusElement) {
      statusElement.innerHTML = '<span class="status-badge connecting">Connecting...</span>';
    }

    // Request account access
    const accounts = await provider.request({
      method: 'eth_requestAccounts'
    });

    if (accounts.length === 0) {
      throw new Error('Tidak ada akun yang ditemukan');
    }

    // Get chain ID
    const chainId = await provider.request({
      method: 'eth_chainId'
    });

    // Store the provider for future use
    walletState.isConnected = true;
    walletState.address = accounts[0];
    walletState.chainId = parseInt(chainId, 16);
    walletState.provider = walletType;
    walletState.providerName = WALLET_PROVIDERS[walletType].name;

    // Store provider reference for later use
    window.activeProvider = provider;

    // Get balance
    await updateBalance();

    // Close modal and update UI
    closeWalletModal();
    updateUI();

    // Setup event listeners for the active provider
    setupProviderEventListeners(provider);

    // Show success toast
    showToast(`Terhubung dengan ${walletState.providerName}! ✅`, 'success');

    console.log('Wallet connected:', {
      provider: walletType,
      address: walletState.address,
      chainId: walletState.chainId
    });

  } catch (error) {
    console.error('Error connecting wallet:', error);

    // Reset connecting state
    const optionElement = walletType === 'metamask' ? elements.metamaskOption : elements.coreOption;
    optionElement?.classList.remove('connecting');
    updateWalletStatusBadges();

    // Handle specific errors
    if (error.code === 4001) {
      showError('Koneksi ditolak oleh user');
    } else if (error.code === -32002) {
      showError('Permintaan koneksi sudah pending. Silakan cek wallet Anda.');
    } else {
      showError(error.message || 'Gagal menghubungkan wallet');
    }
  }
}

// ============================================
// Main Functions
// ============================================

/**
 * Disconnect wallet from the dApp
 */
function disconnectWallet() {
  // Reset state
  walletState = {
    isConnected: false,
    address: null,
    chainId: null,
    balance: null,
    provider: null,
    providerName: null
  };

  // Clear active provider
  window.activeProvider = null;

  // Update UI
  updateUI();

  // Show toast
  showToast('Wallet telah terputus', 'success');

  console.log('Wallet disconnected');
}

/**
 * Switch to Avalanche Fuji Testnet
 */
async function switchToFuji() {
  const provider = window.activeProvider || window.ethereum;

  if (!provider) {
    showError('Wallet provider tidak ditemukan');
    return;
  }

  try {
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: AVALANCHE_FUJI_CONFIG.chainId }]
    });
  } catch (error) {
    // Chain doesn't exist, add it
    if (error.code === 4902) {
      try {
        await provider.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: AVALANCHE_FUJI_CONFIG.chainId,
            chainName: AVALANCHE_FUJI_CONFIG.chainName,
            nativeCurrency: AVALANCHE_FUJI_CONFIG.nativeCurrency,
            rpcUrls: AVALANCHE_FUJI_CONFIG.rpcUrls,
            blockExplorerUrls: AVALANCHE_FUJI_CONFIG.blockExplorerUrls
          }]
        });
      } catch (addError) {
        console.error('Error adding chain:', addError);
        showError('Gagal menambahkan Avalanche Fuji network');
      }
    } else {
      console.error('Error switching chain:', error);
      showError('Gagal switch ke Avalanche Fuji network');
    }
  }
}

/**
 * Copy wallet address to clipboard
 */
async function copyAddress() {
  if (!walletState.address) return;

  try {
    await navigator.clipboard.writeText(walletState.address);
    showToast('Address berhasil disalin! 📋', 'success');
  } catch (error) {
    console.error('Error copying address:', error);
    showError('Gagal menyalin address');
  }
}

// ============================================
// Helper Functions
// ============================================

/**
 * Check if wallet extension is installed
 */
function isWalletInstalled() {
  return typeof window.ethereum !== 'undefined';
}

/**
 * Get network name from chain ID
 */
function getNetworkName(chainId) {
  return NETWORK_NAMES[chainId] || `Unknown Network (${chainId})`;
}

/**
 * Shorten wallet address
 */
function shortenAddress(address) {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Format balance from wei to AVAX
 */
function formatBalance(balanceWei) {
  const balanceEth = parseInt(balanceWei, 16) / 1e18;
  return balanceEth.toFixed(4);
}

/**
 * Update wallet balance
 */
async function updateBalance() {
  if (!walletState.address) return;

  const provider = window.activeProvider || window.ethereum;
  if (!provider) return;

  try {
    const balance = await provider.request({
      method: 'eth_getBalance',
      params: [walletState.address, 'latest']
    });
    walletState.balance = balance;
  } catch (error) {
    console.error('Error getting balance:', error);
  }
}

/**
 * Check if connected to Avalanche Fuji
 */
function isCorrectNetwork() {
  return walletState.chainId === AVALANCHE_FUJI_CONFIG.chainIdDecimal;
}

// ============================================
// UI Functions
// ============================================

/**
 * Update all UI elements based on wallet state
 */
function updateUI() {
  if (walletState.isConnected) {
    // Update status
    elements.statusIndicator.classList.remove('disconnected');
    elements.statusIndicator.classList.add('connected');
    elements.statusText.textContent = `Terhubung via ${walletState.providerName || 'Wallet'}`;

    // Hide connect section, show wallet info
    elements.connectSection.classList.add('hidden');
    elements.walletInfo.classList.remove('hidden');

    // Update network info
    elements.networkName.textContent = getNetworkName(walletState.chainId);
    elements.chainId.textContent = `Chain ID: ${walletState.chainId}`;

    // Update network status badge
    if (isCorrectNetwork()) {
      elements.networkBadge.classList.remove('wrong');
      elements.networkBadge.classList.add('correct');
      elements.networkIcon.textContent = '✅';
      elements.networkStatusText.textContent = 'Avalanche Fuji';
      elements.switchNetworkBtn.classList.add('hidden');
    } else {
      elements.networkBadge.classList.remove('correct');
      elements.networkBadge.classList.add('wrong');
      elements.networkIcon.textContent = '❌';
      elements.networkStatusText.textContent = 'Wrong Network';
      elements.switchNetworkBtn.classList.remove('hidden');
    }

    // Update address
    elements.addressFull.textContent = walletState.address;
    elements.addressShort.textContent = shortenAddress(walletState.address);

    // Update balance
    if (walletState.balance) {
      elements.balanceAmount.textContent = formatBalance(walletState.balance);
    }

  } else {
    // Update status
    elements.statusIndicator.classList.remove('connected');
    elements.statusIndicator.classList.add('disconnected');
    elements.statusText.textContent = 'Wallet Belum Terhubung';

    // Show connect section, hide wallet info
    elements.connectSection.classList.remove('hidden');
    elements.walletInfo.classList.add('hidden');

    // Reset connect button
    resetConnectButton();
  }
}

/**
 * Reset connect button to initial state
 */
function resetConnectButton() {
  elements.connectBtn.disabled = false;
  elements.connectBtn.innerHTML = `
    <svg class="wallet-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="6" width="20" height="14" rx="2" stroke="currentColor" stroke-width="2"/>
      <path d="M2 10H22" stroke="currentColor" stroke-width="2"/>
      <circle cx="17" cy="14" r="2" fill="currentColor"/>
    </svg>
    <span>Connect Wallet</span>
  `;
}

/**
 * Show error alert
 */
function showError(message) {
  elements.errorMessage.textContent = message;
  elements.errorAlert.classList.remove('hidden');

  // Auto hide after 5 seconds
  setTimeout(hideError, 5000);
}

/**
 * Hide error alert
 */
function hideError() {
  elements.errorAlert.classList.add('hidden');
}

/**
 * Show toast notification
 */
function showToast(message, type = 'success') {
  // Remove existing toast
  const existingToast = document.querySelector('.toast');
  if (existingToast) {
    existingToast.remove();
  }

  // Create new toast
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  // Remove after 3 seconds
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// ============================================
// Event Listeners
// ============================================

/**
 * Setup event listeners for specific provider
 */
function setupProviderEventListeners(provider) {
  if (!provider) return;

  // Remove existing listeners first (to prevent duplicates)
  provider.removeAllListeners?.('accountsChanged');
  provider.removeAllListeners?.('chainChanged');
  provider.removeAllListeners?.('disconnect');

  // Account changed
  provider.on('accountsChanged', async (accounts) => {
    console.log('Accounts changed:', accounts);

    if (accounts.length === 0) {
      // User disconnected
      disconnectWallet();
    } else {
      // Account switched
      walletState.address = accounts[0];
      await updateBalance();
      updateUI();
      showToast('Akun berganti! 🔄', 'success');
    }
  });

  // Chain changed
  provider.on('chainChanged', async (chainId) => {
    const newChainId = parseInt(chainId, 16);
    console.log('Chain changed:', newChainId);

    walletState.chainId = newChainId;
    await updateBalance();
    updateUI();

    if (isCorrectNetwork()) {
      showToast('Terhubung ke Avalanche Fuji! ✅', 'success');
    } else {
      showToast('Network berubah! ⚠️', 'error');
    }
  });

  // Disconnect
  provider.on('disconnect', (error) => {
    console.log('Wallet disconnected:', error);
    disconnectWallet();
  });
}

/**
 * Setup global event listeners
 */
function setupGlobalEventListeners() {
  // Close modal on overlay click
  elements.walletModal?.addEventListener('click', (e) => {
    if (e.target === elements.walletModal) {
      closeWalletModal();
    }
  });

  // Close modal on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !elements.walletModal.classList.contains('hidden')) {
      closeWalletModal();
    }
  });
}

// ============================================
// Initialization
// ============================================

/**
 * Initialize the app
 */
async function init() {
  console.log('🏔️ Avalanche Connect Wallet Demo - Day 1');
  console.log('Pamulang University Short Course');
  console.log('Supports: MetaMask & Core Wallet (via EIP-6963)');

  // Setup EIP-6963 for multi-wallet discovery
  setupEIP6963();

  // Wait a bit for wallets to announce themselves via EIP-6963
  await new Promise(resolve => setTimeout(resolve, 100));

  // Detect available wallets (legacy detection as fallback)
  detectWallets();

  // Setup global event listeners
  setupGlobalEventListeners();

  // Check if already connected
  if (isWalletInstalled()) {
    try {
      const accounts = await window.ethereum.request({
        method: 'eth_accounts'
      });

      if (accounts.length > 0) {
        const chainId = await window.ethereum.request({
          method: 'eth_chainId'
        });

        // Determine which wallet is connected
        let providerType = 'unknown';
        let providerName = 'Wallet';

        if (window.ethereum.isAvalanche || window.ethereum.isCoreWallet) {
          providerType = 'core';
          providerName = 'Core Wallet';
        } else if (window.ethereum.isMetaMask) {
          providerType = 'metamask';
          providerName = 'MetaMask';
        }

        walletState.isConnected = true;
        walletState.address = accounts[0];
        walletState.chainId = parseInt(chainId, 16);
        walletState.provider = providerType;
        walletState.providerName = providerName;

        window.activeProvider = window.ethereum;

        await updateBalance();
        updateUI();
        setupProviderEventListeners(window.ethereum);

        console.log('Wallet already connected:', walletState);
      }
    } catch (error) {
      console.error('Error checking existing connection:', error);
    }
  }

  // Add spinning animation style
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    .spinning {
      animation: spin 1s linear infinite;
    }
  `;
  document.head.appendChild(style);
}

// Run initialization when DOM is ready
document.addEventListener('DOMContentLoaded', init);
