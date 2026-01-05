import { BrowserRouter, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import ItemsPage from "./pages/ItemsPage";
import SitesPage from "./pages/SitesPage";
import BrandsPage from "./pages/BrandsPage";
import ModelsPage from "./pages/ModelsPage";
import StockEntryPage from "./pages/StockEntryPage";
import StockBalanceReport from "./pages/StockBalanceReport";
import StockMovementReport from "./pages/StockMovementReport";
// import "./App.css";

function Dashboard() {
  return (
    <div>
      <div className="page-header">
        <h2>Dashboard</h2>
      </div>
      <p style={{ color: "var(--text-secondary)" }}>Welcome to Stock Star. Select a module from the top menu.</p>
    </div>
  );
}


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="items" element={<ItemsPage />} />
          <Route path="brands" element={<BrandsPage />} />
          <Route path="models" element={<ModelsPage />} />
          <Route path="sites" element={<SitesPage />} />
          <Route path="inventory-vouchers" element={<StockEntryPage />} />
          <Route path="stock-balance" element={<StockBalanceReport />} />
          <Route path="stock-movements" element={<StockMovementReport />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
