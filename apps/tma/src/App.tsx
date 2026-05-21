import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { CatalogScreen } from "./screens/CatalogScreen";
import { CountryScreen } from "./screens/CountryScreen";
import { FinalScreen } from "./screens/FinalScreen";
import { FormScreen } from "./screens/FormScreen";
import { IntentScreen } from "./screens/IntentScreen";
import { ProductInterestScreen } from "./screens/ProductInterestScreen";
import { ProductScreen } from "./screens/ProductScreen";
import { SetScreen } from "./screens/SetScreen";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<CountryScreen />} />
          <Route path="/intent" element={<IntentScreen />} />
          <Route path="/products" element={<ProductInterestScreen />} />
          <Route path="/catalog" element={<CatalogScreen />} />
          <Route path="/product/:id" element={<ProductScreen />} />
          <Route path="/set/:id" element={<SetScreen />} />
          <Route path="/form" element={<FormScreen />} />
          <Route path="/final" element={<FinalScreen />} />
          <Route path="*" element={<Navigate replace to="/" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
