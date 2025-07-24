import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

// ✅ .env 파일에서 환경변수 로드
dotenv.config();

const config: HardhatUserConfig = {
  solidity: "0.8.20",
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL!,
      accounts: [process.env.PRIVATE_KEY!],
    },
    kairos: {
      url: process.env.KAIROS_RPC_URL!,      // ex) https://public-en-baobab.klaytn.net
      accounts: [process.env.PRIVATE_KEY!],
      chainId: 1001,                         // ✅ Klaytn Baobab = 1001
    },
  },
};

export default config;
