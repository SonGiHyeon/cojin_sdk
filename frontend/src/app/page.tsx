// page.tsx

'use client';

<h1 className="text-3xl text-red-500 font-bold">Tailwind 작동 테스트</h1>


import { useEffect, useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Oval } from 'react-loader-spinner';

const API_URL = 'http://localhost:3001/faucet';

type Eligibility = {
  ethEligible: boolean;
  kaiEligible: boolean;
  lastReceivedAt: {
    eth: number | null;
    kai: number | null;
  };
  remainingTime: {
    eth: number | null;
    kai: number | null;
  };
  cjntBalance: number;
};

export default function FaucetPage() {
  const [address, setAddress] = useState('');
  const [txHash, setTxHash] = useState({ eth: '', kai: '', cjnt: '' });
  const [status, setStatus] = useState({ eth: '', kai: '', cjnt: '' });
  const [eligibility, setEligibility] = useState<Eligibility | null>(null);
  const [loading, setLoading] = useState({ eth: false, kai: false, cjnt: false });
  const [errorReason, setErrorReason] = useState<{ eth: string; kai: string }>({ eth: '', kai: '' });

  const formatTime = (seconds: number | null | undefined) => {
    if (seconds === null || seconds === undefined) return '';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}시간 ${m}분 ${s}초`;
  };

  const fetchEligibility = async () => {
    if (!address) return;
    try {
      const res = await fetch(`${API_URL}/is-eligible/${address}`);
      const data = await res.json();
      setEligibility(data);
    } catch (e) {
      console.error('Eligibility fetch error', e);
    }
  };

  useEffect(() => {
    fetchEligibility();
  }, [address]);

  const request = async (chain: 'eth' | 'kai' | 'cjnt') => {
    try {
      setLoading((prev) => ({ ...prev, [chain]: true }));
      const res = await fetch(`${API_URL}/request-${chain}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      });

      const result = await res.json();
      if (res.ok) {
        setTxHash((prev) => ({ ...prev, [chain]: result.txHash }));
        const networkNames: Record<'eth' | 'kai' | 'cjnt', string> = {
          eth: 'Sepolia ETH',
          kai: 'KAIROS',
          cjnt: 'CJNT',
        };

        setStatus((prev) => ({
          ...prev,
          [chain]: `✅ ${networkNames[chain]} 전송 완료`,
        }));
        setErrorReason((prev) => ({ ...prev, [chain]: '' }));
      } else {
        const msg = result.message || '요청 실패';
        setStatus((prev) => ({ ...prev, [chain]: `❌ ${msg}` }));
        if (chain === 'eth' || chain === 'kai') {
          setErrorReason((prev) => ({ ...prev, [chain]: msg }));
        }
      }
    } catch (err) {
      console.error(err);
      setStatus((prev) => ({ ...prev, [chain]: '❌ 서버 에러' }));
    } finally {
      setLoading((prev) => ({ ...prev, [chain]: false }));
      fetchEligibility(); // 항상 최신 eligibility 유지
    }
  };

  const cjntInsufficient =
    eligibility &&
    !eligibility.ethEligible &&
    !eligibility.kaiEligible &&
    eligibility.remainingTime?.eth === null &&
    eligibility.remainingTime?.kai === null;

  const isButtonDisabled = (chain: 'eth' | 'kai') => {
    const ineligible = cjntInsufficient || !eligibility?.[`${chain}Eligible` as 'ethEligible' | 'kaiEligible'];
    const error = errorReason[chain];
    return ineligible || !!error;
  };

  const renderButton = (label: string, chain: 'eth' | 'kai' | 'cjnt', disabled: boolean) => {
    const isLoading = loading[chain];
    return (
      <button
        onClick={() => request(chain)}
        disabled={disabled || isLoading}
        className="flex items-center justify-center gap-2 border px-4 py-2 rounded disabled:opacity-50"
      >
        {isLoading ? (
          <>
            <Oval height={18} width={18} color="#3b82f6" secondaryColor="#bfdbfe" strokeWidth={5} strokeWidthSecondary={5} />
            전송 중...
          </>
        ) : (
          <span>{label}</span>
        )}
      </button>
    );
  };

  return (
    <main className="max-w-xl mx-auto mt-10 px-4">
      <h1 className="text-3xl font-bold mb-6">🧪 CJNT Faucet</h1>

      <div className="mb-4">
        <input
          type="text"
          value={address}
          placeholder="지갑 주소 입력"
          onChange={(e) => setAddress(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded"
        />
      </div>

      <ConnectButton />

      {cjntInsufficient && (
        <div className="text-red-500 text-sm mt-4">
          ❌ CJNT 보유량이 부족합니다. 최소 100개 이상 보유 시 사용 가능합니다.
        </div>
      )}

      <hr className="my-6" />

      <div className="grid gap-4">
        <section className="p-4 border rounded shadow">
          <h2 className="text-xl font-bold mb-2">Sepolia ETH</h2>
          {renderButton('요청하기', 'eth', isButtonDisabled('eth'))}
          {errorReason.eth ? (
            <p className="text-sm text-red-500 mt-1">🚫 {errorReason.eth}</p>
          ) : (
            eligibility?.remainingTime?.eth &&
            !eligibility.ethEligible && (
              <p className="text-sm text-orange-600 mt-1">
                ⏳ Sepolia ETH 쿨다운 중: {formatTime(eligibility.remainingTime.eth)}
              </p>
            )
          )}
          {status.eth && <p className="mt-2">{status.eth}</p>}
          {txHash.eth && (
            <a
              href={`https://sepolia.etherscan.io/tx/${txHash.eth}`}
              target="_blank"
              rel="noopener noreferrer"
              className="break-all text-xs text-blue-600 underline"
            >
              {txHash.eth}
            </a>
          )}
        </section>

        <section className="p-4 border rounded shadow">
          <h2 className="text-xl font-bold mb-2">KAIROS</h2>
          {renderButton('요청하기', 'kai', isButtonDisabled('kai'))}
          {errorReason.kai ? (
            <p className="text-sm text-red-500 mt-1">🚫 {errorReason.kai}</p>
          ) : (
            eligibility?.remainingTime?.kai &&
            !eligibility.kaiEligible && (
              <p className="text-sm text-orange-600 mt-1">
                ⏳ KAIROS 쿨다운 중: {formatTime(eligibility.remainingTime.kai)}
              </p>
            )
          )}
          {status.kai && <p className="mt-2">{status.kai}</p>}
          {txHash.kai && (
            <a
              href={`https://scope.klaytn.com/tx/${txHash.kai}?chainId=1001`}
              target="_blank"
              rel="noopener noreferrer"
              className="break-all text-xs text-blue-600 underline"
            >
              {txHash.kai}
            </a>
          )}
        </section>

        <section className="p-4 border rounded shadow">
          <h2 className="text-xl font-bold mb-2">CJNT</h2>
          {renderButton('100 CJNT 받기', 'cjnt', false)}
          {status.cjnt && <p className="mt-2">{status.cjnt}</p>}
          {txHash.cjnt && (
            <a
              href={`https://sepolia.etherscan.io/tx/${txHash.cjnt}`}
              target="_blank"
              rel="noopener noreferrer"
              className="break-all text-xs text-blue-600 underline"
            >
              {txHash.cjnt}
            </a>
          )}
        </section>
      </div>
    </main>
  );
}
