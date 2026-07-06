import React from "react";
import UserManagement from "./UserManagement";
import { Users } from "lucide-react";

const CustomersManagement = () => {
  return (
    <UserManagement
      role="CUSTOMER"
      title="Customers Management"
      description="View and manage all customers"
      icon={Users}
    />
  );
};

export default CustomersManagement;
