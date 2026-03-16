"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { useState } from "react";
import { ProtectedPlayer } from "@/components/ProtectedPlayer";
import { useCart } from "@/context/CartContext";

type VideoPayload = {
  id: string;
  youtube_id: string;
  title: string | null;
  thumbnail_url: string | null;
  paywall_enabled: boolean;
  paywall_price_usdc: string | null;
  hasAccess?: boolean;
};

export default function VideoPage() {
  const params = useParams();
  const id = params.id as string;
  const qc = useQueryClient();
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending: isConnectPending } = useConnect();
  const { disconnect } = useDisconnect();
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState("");
  const { addItem, hasItem } = useCart();

  const { data: googleSession } = useQuery({
    queryKey: ["google-session"],
    queryFn: async () => {
      const r = await fetch("/api/auth/google/session", { credentials: "include" });
      const data = await r.json();
      return data as { user: { id: string; email: string | null } | null };
    },
  });
  const viewerEmail = googleSession?.user?.email ?? undefined;

  const { data: video, isLoading, isError } = useQuery({
    queryKey: ["video", id, address ?? "no-wallet", viewerEmail ?? ""],
    queryFn: async () => {
      let url = `/api/videos/${encodeURIComponent(id)}?`;
      if (address) url += `wallet=${encodeURIComponent(address)}`;
      else if (viewerEmail) url += `email=${encodeURIComponent(viewerEmail)}`;
      const r = await fetch(url);
      if (r.status === 404) return null;
      if (!r.ok) throw new Error("Falha ao carregar vídeo");
      return r.json() as Promise<VideoPayload>;
    },
    enabled: !!id,
  });

  const unlockMutation = useMutation({
    mutationFn: async () => {
      if (!address || !video) throw new Error("Conecte sua carteira");
      const r = await fetch("/api/paywall/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          video_id: video.id,
          viewer_wallet: address,
          amount_usdc: video.paywall_price_usdc,
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.message || data.error || "Falha ao desbloquear");
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["video", id, address ?? "no-wallet"] });
      setUnlockError(null);
    },
    onError: (e: Error) => {
      setUnlockError(e.message);
    },
  });

  const showPaywall =
    video?.paywall_enabled && video.hasAccess !== true;
  const price = video?.paywall_price_usdc ? `${video.paywall_price_usdc} USDC` : "USDC";

  const { data: paymentConfig } = useQuery({
    queryKey: ["payment-config", "VIDEO_UNLOCK", video?.id],
    queryFn: async () => {
      const r = await fetch(
        `/api/payments/config?type=VIDEO_UNLOCK&reference_id=${encodeURIComponent(video!.id)}`
      );
      if (!r.ok) return null;
      return r.json() as Promise<{ destination_wallet: string; amount_usdc: string; label: string }>;
    },
    enabled: showPaywall && !!video?.id,
  });

  const checkoutCardMutation = useMutation({
    mutationFn: async () => {
      const r = await fetch("/api/payments/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "VIDEO_UNLOCK",
          reference_id: video!.id,
          success_url: typeof window !== "undefined" ? `${window.location.origin}/v/${id}?paid=1` : undefined,
          cancel_url: typeof window !== "undefined" ? window.location.href : undefined,
          customer_email: viewerEmail || undefined,
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.message || data.error || "Falha ao criar checkout");
      return data as { url: string };
    },
    onSuccess: (data) => {
      if (data?.url) window.location.href = data.url;
    },
    onError: (e: Error) => setUnlockError(e.message),
  });

  const verifyPaymentMutation = useMutation({
    mutationFn: async () => {
      if (!address || !video || !txHash.trim()) throw new Error("Conecte a carteira e informe o tx_hash do pagamento.");
      const r = await fetch("/api/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "VIDEO_UNLOCK",
          tx_hash: txHash.trim(),
          reference_id: video.id,
          payer_wallet: address,
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.message || data.error || "Falha ao verificar pagamento");
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["video", id, address ?? "no-wallet"] });
      setUnlockError(null);
      setTxHash("");
    },
    onError: (e: Error) => setUnlockError(e.message),
  });

  if (isLoading || !id) {
    return (
      <main style={{ padding: "2rem", fontFamily: "system-ui", textAlign: "center" }}>
        <p>Carregando…</p>
        <Link href="/" style={{ color: "#6366f1" }}>← TrustBank</Link>
      </main>
    );
  }

  if (isError || !video) {
    return (
      <main style={{ padding: "2rem", fontFamily: "system-ui", textAlign: "center" }}>
        <p>Vídeo não encontrado.</p>
        <Link href="/" style={{ color: "#6366f1" }}>← Voltar ao TrustBank</Link>
      </main>
    );
  }

  return (
    <main
      style={{
        fontFamily: "system-ui",
        maxWidth: 900,
        margin: "0 auto",
        padding: "1.5rem 1rem",
      }}
    >
      <div style={{ marginBottom: "1rem" }}>
        <Link href="/" style={{ color: "#6366f1", textDecoration: "none", fontSize: "0.9rem" }}>
          ← TrustBank
        </Link>
      </div>

      <h1 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>
        {video.title || "Vídeo"}
      </h1>

      <div
        style={{
          position: "relative",
          width: "100%",
          paddingBottom: "56.25%",
          background: "#111",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        {showPaywall ? (
          <>
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.85) 100%)",
                color: "#fff",
                padding: "2rem",
              }}
            >
              {video.thumbnail_url && (
                <img
                  src={video.thumbnail_url}
                  alt=""
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    filter: "blur(20px) brightness(0.4)",
                  }}
                />
              )}
              <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
                <p style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>
                  Conteúdo exclusivo
                </p>
                <p style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.5rem" }}>
                  Desbloqueie por {price}
                </p>
                {!isConnected ? (
                  <div>
                    <p style={{ fontSize: "0.9rem", marginBottom: "1rem", opacity: 0.9 }}>
                      Conecte sua carteira para pagar e assistir.
                    </p>
                    {connectors.slice(0, 3).map((connector) => (
                      <button
                        key={connector.uid}
                        type="button"
                        onClick={() => connect({ connector })}
                        disabled={isConnectPending}
                        style={{
                          padding: "0.75rem 1.5rem",
                          margin: "0 0.25rem",
                          background: "#6366f1",
                          color: "#fff",
                          border: 0,
                          borderRadius: 8,
                          fontWeight: 600,
                          cursor: isConnectPending ? "wait" : "pointer",
                        }}
                      >
                        {isConnectPending ? "Conectando…" : connector.name}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div>
                    <p style={{ fontSize: "0.9rem", marginBottom: "0.5rem", opacity: 0.9 }}>
                      Carteira: {address?.slice(0, 6)}…{address?.slice(-4)}
                    </p>
                    <button
                      type="button"
                      onClick={() => disconnect()}
                      style={{
                        marginBottom: "1rem",
                        padding: "0.35rem 0.75rem",
                        fontSize: "0.85rem",
                        background: "transparent",
                        color: "rgba(255,255,255,0.8)",
                        border: "1px solid rgba(255,255,255,0.4)",
                        borderRadius: 6,
                        cursor: "pointer",
                      }}
                    >
                      Trocar carteira
                    </button>
                    <button
                      type="button"
                      onClick={() => checkoutCardMutation.mutate()}
                      disabled={checkoutCardMutation.isPending}
                      style={{
                        padding: "0.6rem 1.2rem",
                        marginBottom: "0.75rem",
                        marginRight: "0.5rem",
                        background: "#635bff",
                        color: "#fff",
                        border: 0,
                        borderRadius: 8,
                        fontWeight: 600,
                        cursor: checkoutCardMutation.isPending ? "wait" : "pointer",
                        fontSize: "0.95rem",
                      }}
                    >
                      {checkoutCardMutation.isPending ? "Abrindo…" : "Pagar com cartão (repasse em USDC)"}
                    </button>
                    {!hasItem("VIDEO_UNLOCK", video.id) && (
                      <button
                        type="button"
                        onClick={() => addItem({
                          type: "VIDEO_UNLOCK",
                          reference_id: video.id,
                          label: `Video: ${video.title || video.id}`,
                          amount_usdc: video.paywall_price_usdc ?? "0",
                        })}
                        style={{
                          padding: "0.6rem 1.2rem",
                          marginBottom: "0.75rem",
                          background: "#334155",
                          color: "#fff",
                          border: 0,
                          borderRadius: 8,
                          fontWeight: 600,
                          cursor: "pointer",
                          fontSize: "0.95rem",
                        }}
                      >
                        Add to cart
                      </button>
                    )}
                    <Link href="/cart" style={{ fontSize: "0.9rem", marginLeft: "0.5rem", color: "#93c5fd" }}>View cart</Link>
                    {viewerEmail && (
                      <p style={{ fontSize: "0.8rem", opacity: 0.8, marginBottom: "0.5rem" }}>
                        Será cobrado no e-mail: {viewerEmail}
                      </p>
                    )}
                    <p style={{ fontSize: "0.85rem", marginBottom: "0.5rem", opacity: 0.9 }}>
                      Ou pague em USDC (carteira):
                    </p>
                    {paymentConfig?.destination_wallet && (
                      <p style={{ fontSize: "0.85rem", marginBottom: "0.5rem", opacity: 0.9, wordBreak: "break-all" }}>
                        Envie <strong>{paymentConfig.amount_usdc} USDC</strong> para:<br />
                        <code style={{ fontSize: "0.75rem" }}>{paymentConfig.destination_wallet}</code>
                      </p>
                    )}
                    <input
                      type="text"
                      placeholder="Cole o tx_hash após pagar (hash da transação)"
                      value={txHash}
                      onChange={(e) => setTxHash(e.target.value)}
                      style={{
                        width: "100%",
                        maxWidth: 420,
                        padding: "0.5rem",
                        marginBottom: "0.5rem",
                        background: "rgba(255,255,255,0.1)",
                        border: "1px solid rgba(255,255,255,0.3)",
                        borderRadius: 6,
                        color: "#fff",
                        fontSize: "0.85rem",
                      }}
                    />
                    <br />
                    <button
                      type="button"
                      onClick={() => verifyPaymentMutation.mutate()}
                      disabled={verifyPaymentMutation.isPending || !txHash.trim()}
                      style={{
                        padding: "0.75rem 1.5rem",
                        marginRight: "0.5rem",
                        background: "#22c55e",
                        color: "#fff",
                        border: 0,
                        borderRadius: 8,
                        fontWeight: 600,
                        cursor: verifyPaymentMutation.isPending ? "wait" : "pointer",
                      }}
                    >
                      {verifyPaymentMutation.isPending ? "Verificando…" : "Verificar pagamento"}
                    </button>
                    <button
                      type="button"
                      onClick={() => unlockMutation.mutate()}
                      disabled={unlockMutation.isPending}
                      style={{
                        padding: "0.75rem 1rem",
                        background: "rgba(255,255,255,0.2)",
                        color: "#fff",
                        border: "1px solid rgba(255,255,255,0.4)",
                        borderRadius: 8,
                        fontWeight: 600,
                        cursor: unlockMutation.isPending ? "wait" : "pointer",
                      }}
                      title="Modo sem verificação de tx (apenas para testes)"
                    >
                      {unlockMutation.isPending ? "…" : "Desbloquear (teste)"}
                    </button>
                    {unlockError && (
                      <p style={{ marginTop: "0.75rem", color: "#fca5a5", fontSize: "0.9rem" }}>
                        {unlockError}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <ProtectedPlayer
            videoId={video.youtube_id}
            obfuscated={false}
          />
        )}
      </div>
    </main>
  );
}
