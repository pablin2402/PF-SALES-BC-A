// src/Routes.js
import { Routes, Route } from "react-router-dom";

import HomeView from "./view/HomeView";
import SalesView from "./view/SalesView";
import SalesManView from "./view/SalesManView";

import ProductView from './view/ProductView';
import ClientView from './view/ClientView';
import OrderView from './view/OrderView';
import CategoryView from './view/CategoryView';
import InventaryView from './view/InventaryView';
import LocalizacionView from './view/LocalizationView';

import ClientCreationComponent from "./ClientComponent/ClientCreationComponent";
import ClientInformationComponent from "./ClientComponent/ClientInformationComponent";
import ClientInformationOrdenComponent from "./ClientComponent/ClientInformationOrdenComponent";

import ProductCreationComponent from './ProductComponent/ProductCreationComponent';
import CategoryCreationComponent from './CategoryComponent/CategoryCreation';
import InventaryListComponent from "./InventaryComponent/InventaryListComponent";
import InventaryCreateComponent from "./InventaryComponent/InventaryCreateComponent";
import OrderCreateComponent from "./OrderComponent/OrderCreateComponent";

import DashboardLayout from "./layouts/DashboardLayouts";
import InventaryLayout from "./layouts/InventaryLayout";
import ClientsLayout from "./layouts/ClientsLayout";

export default function AppRoutes() {
  return (
        <Routes>
            <Route path="/" element={<HomeView />} />
            <Route element={<DashboardLayout />}>
              <Route path="/sales" element={<SalesView />} />
              <Route path="/product" element={<ProductView />} />
              <Route path="/order" element={<OrderView />} />
              <Route path="/category" element={<CategoryView />} />

              <Route path="/product/creation" element={<ProductCreationComponent />} />
              <Route path="/category/creation" element={<CategoryCreationComponent />} />
              <Route path="/order/creation" element={<OrderCreateComponent />} />

            </Route>
            <Route element={<InventaryLayout />}>
              <Route path="/inventary" element={<InventaryView />} />
              <Route path="/inventary/list" element={<InventaryListComponent />} />
              <Route path="/inventary/create" element={<InventaryCreateComponent />} />

            </Route>
            <Route element={<ClientsLayout />}>

            <Route path="/client" element={<ClientView />} />
            <Route path="/sales/client" element={<SalesManView />} />
            <Route path="/client/:id" element={<ClientInformationComponent />} />
            <Route path="/client/order/:id" element={<ClientInformationOrdenComponent />} />
            <Route path="/client/creation" element={<ClientCreationComponent />} />
            </Route>
            <Route path="/localization" element={<LocalizacionView />} />


        </Routes>
  );
}
