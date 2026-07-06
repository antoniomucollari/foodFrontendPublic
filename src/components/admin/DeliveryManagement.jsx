import React from "react";
import UserManagement from "./UserManagement";
import { Truck } from "lucide-react";

const DeliveryManagement = () => {
  return (
    <UserManagement
      role="DELIVERY"
      title="Delivery Management"
      description="View and manage delivery personnel"
      icon={Truck}
    />
  );
};

export default DeliveryManagement;
