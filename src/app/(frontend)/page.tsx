import ReceiptApp from "./components/receipt-app"
import HealthCheck from "./components/server_health_test"
export default function HomePage() {
  
  return (
    <>
      <HealthCheck />
      <ReceiptApp />
    </>
  );
}
