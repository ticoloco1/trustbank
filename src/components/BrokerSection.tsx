"use client";

import { useAccount } from "wagmi";
import { VideoShareBroker } from "./VideoShareBroker";

type BrokerSectionProps = {
  miniSiteSlug: string;
  clubNftName?: string | null;
  /** Quando informado, mostra a corretora de shares deste vídeo (book, compra/venda, rateio). */
  videoId?: string | null;
  videoTitle?: string | null;
  videoTicker?: string | null;
  children?: React.ReactNode;
};

/** Seção corretora: mostra book de shares. Se club_nft estiver ativo, pode embaçar até ter NFT. */
export function BrokerSection({
  miniSiteSlug,
  clubNftName,
  videoId,
  videoTitle,
  videoTicker,
  children,
}: BrokerSectionProps) {
  const { address } = useAccount();
  // TODO: verificar se wallet possui o NFT do clube (club_nft_contract). Por ora mostramos a corretora para todos.
  const hasAccess = true;

  const brokerContent = videoId ? (
    <VideoShareBroker videoId={videoId} title={videoTitle} ticker={videoTicker} />
  ) : (
    <div style={{ padding: "2rem", background: "#1e293b", color: "#e2e8f0", borderRadius: 12 }}>
      <h3 style={{ marginBottom: "0.5rem" }}>Corretora</h3>
      <p style={{ fontSize: "0.9rem", color: "#94a3b8" }}>Vincule um vídeo ao mini site para ver o book de compra e venda de cotas.</p>
      {children}
    </div>
  );

  if (hasAccess) {
    return <section style={{ marginTop: "2rem" }}>{brokerContent}</section>;
  }

  return (
    <section style={{ position: "relative", marginTop: "2rem", borderRadius: 12, overflow: "hidden", minHeight: 200 }}>
      <div style={{ filter: "blur(12px)", pointerEvents: "none", userSelect: "none", opacity: 0.7 }}>{brokerContent}</div>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(15, 23, 42, 0.75)",
          color: "#e2e8f0",
          padding: "2rem",
          textAlign: "center",
        }}
      >
        <h3 style={{ fontSize: "1.25rem", marginBottom: "0.5rem", fontWeight: 700 }}>Corretora de shares</h3>
        <p style={{ fontSize: "0.95rem", marginBottom: "1rem", maxWidth: 360 }}>
          Para negociar shares dos vídeos, faça parte do clube de investimentos. Adquira o NFT de acesso.
        </p>
        <p style={{ fontSize: "0.85rem", color: "#94a3b8" }}>{clubNftName || "NFT do clube"} — em breve</p>
      </div>
    </section>
  );
}
