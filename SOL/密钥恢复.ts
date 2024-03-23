// Web3.js
// @solana/web3.js 这个库提供了很多用于与Solana交互，发送交易，从区块链上读取数据等操作的基础功能。

// 可以用以下命令安装：

// yarn add @solana/web3.js
// npm install --save @solana/web3.js
// <!-- Development (un-minified) -->
// <script src="https://unpkg.com/@solana/web3.js@latest/lib/index.iife.js"></script>

// <!-- Production (minified) -->
// <script src="https://unpkg.com/@solana/web3.js@latest/lib/index.iife.min.js"></script>




// SPL代币（SPL-Token）
// @solana/spl-token这个库提供了很多用于与SPL代币（SPL tokens）交互所需的JavaScript/TypeScript绑定函数。 可以用这个库来铸造新的SPL代币，进行转账，以及其他操作。

// 可以用以下命令安装：

// yarn add @solana/spl-token
// npm install --save @solana/spl-token
// <!-- Development (un-minified) -->
// <script src="https://unpkg.com/@solana/spl-token@latest/lib/index.iife.js"></script>

// <!-- Production (minified) -->
// <script src="https://unpkg.com/@solana/spl-token@latest/lib/index.iife.min.js"></script>
// 钱包适配器（Wallet-Adapter）
// 这是一组用于连接Solana公链钱包的库，称为钱包适配器。 目前这些软件包支持Angular，Vue.js，以及React。钱包适配器可以帮助你的dApp很快的与诸如Phantom， Solflare以及其他一些钱包进行整合。

// 可以用以下命令安装：

// yarn add @solana/wallet-adapter-wallets \
//     @solana/wallet-adapter-base
// npm install --save @solana/wallet-adapter-wallets \
//     @solana/wallet-adapter-base


import * as web3 from '@solana/web3.js';
// // 定义你的 Solana 私钥
// const privateKey = Buffer.from('YOUR_PRIVATE_KEY', 'hex');
// // 根据私钥生成公钥
// const keypair = web3.Keypair.fromSecretKey(privateKey);
// const publicKey = keypair.publicKey.toString();
// console.log("Generated Public Key:", publicKey);

const privateKey=Uint8Array.from([
      174, 47, 154, 16, 202, 193, 206, 113, 199, 190, 53, 133, 169, 175, 31, 56,
      222, 53, 138, 189, 224, 216, 117, 173, 10, 149, 53, 45, 73, 251, 237, 246,
      15, 185, 186, 82, 177, 240, 148, 69, 241, 227, 167, 80, 141, 89, 240, 121,
      121, 35, 172, 247, 68, 251, 226, 218, 48, 63, 176, 109, 168, 89, 238, 135,
    ])
const keypair = web3.Keypair.fromSeed(privateKey)
console.log("Generated Public Key:", keypair);
// sudo apt install ts-node
// ts-node /home/wth000/gitee/BRC20-ERC20-UI/SOL/密钥恢复.ts
// npm install -g typescript