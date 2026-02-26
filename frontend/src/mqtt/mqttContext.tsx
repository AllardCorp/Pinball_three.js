// import { createContext, useContext, useEffect, useState } from "react"
// import { connectMqtt } from "./mqttClient"
//
// const MqttContext = createContext<any>(null)
//
// export function MqttProvider({ children }: { children: React.ReactNode }) {
//   const [client, setClient] = useState<any>(null)
//
//   useEffect(() => {
//     const mqttClient = connectMqtt()
//     setClient(mqttClient)
//   }, [])
//
//   return (
//     <MqttContext.Provider value={client}>
//       {children}
//     </MqttContext.Provider>
//   )
// }
//
// export function useMqtt() {
//   return useContext(MqttContext)
// }
