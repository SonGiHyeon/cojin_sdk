'use client'

import { http } from 'wagmi'
import { mainnet, sepolia } from 'wagmi/chains'
import { getDefaultConfig } from '@rainbow-me/rainbowkit'

// WalletConnect용 프로젝트 ID (https://cloud.walletconnect.com 에서 생성)
const projectId = 'cf675ae34ba440d14b064cce657ea368'

export const config = getDefaultConfig({
    appName: 'CJNT Faucet',
    projectId,
    chains: [sepolia], // 필요한 체인 추가 가능
    transports: {
        [sepolia.id]: http(),
    },
})
