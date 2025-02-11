// src/Routes.js
import { Routes, Route } from "react-router-dom";
import SalesView from './view/SalesView';
import ProductView from './view/ProductView';
import ClientView from './view/ClientView';
import OrderView from './view/OrderView';
import CategoryView from './view/CategoryView';
import InventaryView from './view/InventaryView';
import LocalizacionView from './view/LocalizationView';

import ClientCreationComponent from './ClientComponent/ClientCreationComponent';
import ProductCreationComponent from './ProductComponent/ProductCreationComponent';
import CategoryCreationComponent from './CategoryComponent/CategoryCreation';
import InventaryListComponent from "./InventaryComponent/InventaryListComponent";
import InventaryCreateComponent from "./InventaryComponent/InventaryCreateComponent";

import DashboardLayout from "./layouts/DashboardLayouts";
import InventaryLayout from "./layouts/InventaryLayout";

export default function AppRoutes() {
  return (
        <Routes>
            <Route path="/" element={<SalesView />} />
            <Route element={<DashboardLayout />}>
              <Route path="/sales" element={<SalesView />} />
              <Route path="/product" element={<ProductView />} />
              <Route path="/order" element={<OrderView />} />
              <Route path="/category" element={<CategoryView />} />

              <Route path="/product/creation" element={<ProductCreationComponent />} />
              <Route path="/category/creation" element={<CategoryCreationComponent />} />

            </Route>
            <Route element={<InventaryLayout />}>
              <Route path="/inventary" element={<InventaryView />} />
              <Route path="/inventary/list" element={<InventaryListComponent />} />
              <Route path="/inventary/create" element={<InventaryCreateComponent />} />

            </Route>
            <Route path="/client" element={<ClientView />} />
            <Route path="/client/creation" element={<ClientCreationComponent />} />
            <Route path="/localization" element={<LocalizacionView />} />


        </Routes>
  );
}
