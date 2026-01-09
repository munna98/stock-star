import { BrowserRouter, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import ItemsPage from "./pages/ItemsPage";
import SitesPage from "./pages/SitesPage";
import BrandsPage from "./pages/BrandsPage";
import ModelsPage from "./pages/ModelsPage";
import StockEntryPage from "./pages/StockEntryPage";
import TransactionHistoryPage from "./pages/TransactionHistoryPage";
import StockBalanceReport from "./pages/StockBalanceReport";
import DashboardPage from "./pages/DashboardPage";
import StockMovementReport from "./pages/StockMovementReport";
import ActivationPage from "./pages/ActivationPage";
import RequireActivation from "./components/RequireActivation";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/activation" element={<ActivationPage />} />

        <Route path="/" element={
          <RequireActivation>
            <Layout />
          </RequireActivation>
        }>
          <Route index element={<DashboardPage />} />
          <Route path="items" element={<ItemsPage />} />
          <Route path="brands" element={<BrandsPage />} />
          <Route path="models" element={<ModelsPage />} />
          <Route path="sites" element={<SitesPage />} />
          <Route path="inventory-vouchers" element={<StockEntryPage />} />
          <Route path="transactions" element={<TransactionHistoryPage />} />
          <Route path="stock-balance" element={<StockBalanceReport />} />
          <Route path="stock-movements" element={<StockMovementReport />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
