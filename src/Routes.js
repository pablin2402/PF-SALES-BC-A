import { Routes, Route } from "react-router-dom";

import HomeView from "./view/HomeView";
import LoginView from "./view/LoginView";
import SalesManView from "./view/SalesManView";

import ProductView from './view/ProductView';
import ClientView from './view/ClientView';
import OrderView from './view/OrderView';
import CategoryView from './view/CategoryView';
import LocalizacionView from './view/LocalizationView';
import OrderPaymentView from './view/OrderPaymentView';
import DeliveryView from "./view/DeliveryView";
import StatisticsView from "./view/StatisticsView";
import DeliveryRouteView from "./view/DeliveryRouteView";
import ObjectiveRegionalsView from "./view/ObjectiveRegionalsView";
import ProfileView from "./view/ProfileView";

import DeliveryCreationComponent from "./ClientComponent/DeliveryCreationComponent";
import ClientCreationComponent from "./ClientComponent/ClientCreationComponent";
import ClientInformationComponent from "./ClientComponent/ClientInformationComponent";
import ClientInformationOrdenComponent from "./ClientComponent/ClientInformationOrdenComponent";

import SalesManCreationComponent from "./ClientComponent/SalesManCreationComponent";
import SalesManInformationComponent from "./ClientComponent/SalesManInformationComponent";

import ProductCreationComponent from "./ProductComponent/ProductCreationComponent";
import CategoryCreationComponent from "./CategoryComponent/CategoryCreation";

import OrderCreateComponent from "./OrderComponent/OrderCreateComponent";

import CreateRouteComponent from "./locationComponent/CreateRouteComponent";
import ShowRouteComponent from "./locationComponent/ShowRouteComponent";

import ObjectiveDepartmentComponent from "./ObjectiveComponent/ObjectiveDepartmentComponent";

import DashboardLayout from "./layouts/DashboardLayouts";
import ClientsLayout from "./layouts/ClientsLayout";
import LocationLayout from "./layouts/LocationLayout";

import ActivityRouteComponent from "./view/ActivityRouteComponent";
export default function AppRoutes() {
  return (
        <Routes>
            <Route path="/" element={<HomeView />} />
            <Route path="/login" element={<LoginView />} />
            <Route path="/localization/activivty" element={<ActivityRouteComponent />}/>
            <Route path="/delivery" element={<DeliveryRouteView />}/>
            <Route path="/objective/sales" element={<ObjectiveRegionalsView />}/>
            <Route path="/objective/department/:id" element={<ObjectiveDepartmentComponent />}/>
            <Route path="/profile" element={<ProfileView />}/>

            <Route element={<DashboardLayout />}>
              <Route path="/product" element={<ProductView />} />
              <Route path="/order" element={<OrderView />} />
              <Route path="/category" element={<CategoryView />} />
              <Route path="/stadistics" element={<StatisticsView />} />

              <Route path="/product/creation" element={<ProductCreationComponent />} />
              <Route path="/category/creation" element={<CategoryCreationComponent />} />
              <Route path="/order/creation" element={<OrderCreateComponent />} />

            </Route>
            <Route element={<ClientsLayout />}>
              <Route path="/client" element={<ClientView />} />
              <Route path="/sales/client" element={<SalesManView />} />
              <Route path="/delivery/list" element={<DeliveryView />} />
              <Route path="/sales/create" element={<SalesManCreationComponent />} />
              <Route path="/sales/:id" element={<SalesManInformationComponent />} />
              <Route path="/client/:id" element={<ClientInformationComponent />} />
              <Route path="/client/order/:id" element={<ClientInformationOrdenComponent />} />
              <Route path="/client/creation" element={<ClientCreationComponent />} />
              <Route path="/delivery/creation" element={<DeliveryCreationComponent />} />
            </Route>
            <Route path="/order/pay" element={<OrderPaymentView />} />
            <Route element={<LocationLayout />}>
            <Route path="/localization" element={<LocalizacionView />} />
            <Route path="/localization/route" element={<CreateRouteComponent />} />
            <Route path="/localization/list/route" element={<ShowRouteComponent />} />

            </Route>
        </Routes>
  );
}
