// frontend/src/components/FaucetCard.tsx
'use client';

import { Oval } from 'react-loader-spinner';

type Props = {
    label: string;
    chain: 'eth' | 'kai' | 'cjnt';
    status: string;
    txHash: string;
    loading: boolean;
    disabled: boolean;
    errorReason: string;
    remainingTime?: number | null;
    onClick: () => void;
    explorerUrl?: string;
};

export default function FaucetCard({
    label,
    chain,
    status,
    txHash,
    loading,
    disabled,
    errorReason,
    remainingTime,
    onClick,
    explorerUrl,
}: Props) {
    const formatTime = (seconds: number | null | undefined) => {
        if (!seconds || seconds <= 0) return '';
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h}시간 ${m}분 ${s}초`;
    };

    return (
        <section className="mb-6 border p-4 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-2">{label}</h2>

            <button
                onClick={onClick}
                disabled={disabled || loading}
                className="flex items-center justify-center gap-2 border px-4 py-2 rounded disabled:opacity-50"
            >
                {loading ? (
                    <>
                        <Oval height={18} width={18} color="#3b82f6" secondaryColor="#bfdbfe" strokeWidth={5} strokeWidthSecondary={5} />
                        전송 중...
                    </>
                ) : (
                    '요청하기'
                )}
            </button>

            {errorReason && (
                <p className="text-sm text-red-500 mt-1">🚫 {errorReason}</p>
            )}

            {remainingTime && !errorReason && (
                <p className="text-sm text-orange-600 mt-1">
                    ⏳ {label} 쿨다운 중: {formatTime(remainingTime)}
                </p>
            )}

            {status && <p className="mt-2">{status}</p>}
            {txHash && explorerUrl && (
                <a
                    href={`${explorerUrl}${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="break-all text-xs text-blue-600 underline"
                >
                    {txHash}
                </a>
            )}
        </section>
    );
}
