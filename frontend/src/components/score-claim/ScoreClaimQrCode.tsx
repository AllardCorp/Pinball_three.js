import QRCode from "qrcode";
import { useEffect, useState } from "react";

type ScoreClaimQrCodeProps = {
  verificationUrl: string;
};

export default function ScoreClaimQrCode({
  verificationUrl,
}: ScoreClaimQrCodeProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function generateQrCode() {
      try {
        const nextQrCodeUrl = await QRCode.toDataURL(verificationUrl, { margin: 1 });

        if (!isCancelled) {
          setQrCodeUrl(nextQrCodeUrl);
        }
      } catch (error) {
        console.error("Score claim QR code generation failed:", error);
      }
    }

    void generateQrCode();

    return () => {
      isCancelled = true;
    };
  }, [verificationUrl]);

  if (!qrCodeUrl) {
    return <p className="text-sm text-slate-500">Génération du QR code...</p>;
  }

  return (
    <img
      alt="QR code de rattachement du score"
      className="h-40 w-40 rounded bg-white p-2"
      src={qrCodeUrl}
    />
  );
}
