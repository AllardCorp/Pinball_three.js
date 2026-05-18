// const mqtt = useMqtt()
//
// useEffect(() => {
//   if (!mqtt) return
//
//   mqtt.subscribe("pinball/flipper")
//
//   mqtt.on("message", (topic, message) => {
//     if (topic === "pinball/flipper") {
//       // trigger animation rapier
//     }
//   })
// }, [mqtt])

import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { Leva, useControls } from "leva";
import QRCode from "qrcode";
import { Perf } from "r3f-perf";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import Experience from "../experience/Experience";
import { apiEndpoint } from "../lib/api";
import { useSession } from "../lib/auth-client";

type DeviceLogin = {
  deviceCode: string;
  verificationUrl: string;
  expiresAt: string;
};

type DeviceUser = {
  id: string;
  name: string | null;
  email: string | null;
  username: string | null;
};

export default function Playfield() {
  const { data: session, isPending } = useSession();
  const [deviceLogin, setDeviceLogin] = useState<DeviceLogin | null>(null);
  const [deviceUser, setDeviceUser] = useState<DeviceUser | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [deviceLoginStatus, setDeviceLoginStatus] = useState<
    "idle" | "pending" | "approved" | "expired" | "error"
  >("idle");
  const { perfVisible } = useControls({
    perfVisible: true,
  });
  const { rapierDebug } = useControls("rapier", {
    rapierDebug: false,
  });

  useEffect(() => {
    if (isPending || session || deviceUser || deviceLogin) {
      return;
    }

    const abortController = new AbortController();

    async function startDeviceLogin() {
      try {
        setDeviceLoginStatus("pending");

        const response = await fetch(apiEndpoint("/api/device-login/start"), {
          method: "POST",
          signal: abortController.signal,
        });

        if (!response.ok) {
          setDeviceLoginStatus("error");
          return;
        }

        const payload = (await response.json()) as DeviceLogin;
        setDeviceLogin(payload);
        setQrCodeUrl(await QRCode.toDataURL(payload.verificationUrl, { margin: 1 }));
      } catch (error) {
        if (!abortController.signal.aborted) {
          console.error("Device login start failed:", error);
          setDeviceLoginStatus("error");
        }
      }
    }

    void startDeviceLogin();

    return () => {
      abortController.abort();
    };
  }, [deviceLogin, deviceUser, isPending, session]);

  useEffect(() => {
    if (!deviceLogin || session || deviceUser) {
      return;
    }

    const intervalId = window.setInterval(async () => {
      try {
        const response = await fetch(
          apiEndpoint(`/api/device-login/status/${deviceLogin.deviceCode}`),
        );

        if (response.status === 410) {
          setDeviceLoginStatus("expired");
          return;
        }

        if (!response.ok) {
          setDeviceLoginStatus("error");
          return;
        }

        const payload = (await response.json()) as {
          status: "pending" | "approved";
          user: DeviceUser | null;
        };

        setDeviceLoginStatus(payload.status);

        if (payload.status === "approved" && payload.user) {
          setDeviceUser(payload.user);
          window.clearInterval(intervalId);
        }
      } catch (error) {
        console.error("Device login status lookup failed:", error);
        setDeviceLoginStatus("error");
      }
    }, 2000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [deviceLogin, deviceUser, session]);

  function resetDeviceLogin() {
    setDeviceLogin(null);
    setDeviceUser(null);
    setQrCodeUrl(null);
    setDeviceLoginStatus("idle");
  }

  const activeUser = session?.user ?? deviceUser;

  return (
    <div className="relative h-screen w-screen">
      <div className="absolute right-4 top-10 z-10 max-w-xs rounded-xl bg-white/90 px-4 py-3 text-sm shadow-lg backdrop-blur">
        <p className="font-medium">Session du Playfield</p>
        {isPending && <p className="text-slate-500">Chargement...</p>}
        {!isPending && !activeUser && (
          <div className="space-y-3 text-slate-500">
            <p>Mode invite actif. La partie reste jouable.</p>
            {qrCodeUrl && (
              <img
                alt="QR code de connexion"
                className="h-36 w-36 rounded bg-white p-1"
                src={qrCodeUrl}
              />
            )}
            {deviceLoginStatus === "pending" && (
              <p>Scannez le QR code pour sauvegarder vos statistiques.</p>
            )}
            {deviceLoginStatus === "expired" && (
              <button className="text-blue-600" onClick={resetDeviceLogin} type="button">
                Generer un nouveau QR code
              </button>
            )}
            {deviceLoginStatus === "error" && (
              <button className="text-blue-600" onClick={resetDeviceLogin} type="button">
                Reessayer la connexion QR
              </button>
            )}
            <Link className="text-blue-600" to="/login">
              Connexion classique
            </Link>
          </div>
        )}
        {activeUser && (
          <div className="space-y-1">
            <p>{activeUser.email}</p>
            <p className="text-slate-500">
              Username: {activeUser.username ?? "non defini"}
            </p>
            <Link className="text-blue-600" to="/dashboard">
              Aller au dashboard
            </Link>
          </div>
        )}
      </div>

      <Leva collapsed />
      <Canvas shadows camera={{ position: [0, 8, 15], fov: 50 }}>
        <color attach="background" args={["skyblue"]} />
        {perfVisible && <Perf position="top-left" showGraph />}
        <Physics debug={rapierDebug} gravity={[0, -9.81, 0]}>
          <Experience />
        </Physics>
      </Canvas>
    </div>
  );
}
