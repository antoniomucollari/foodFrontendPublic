import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { menuAPI, categoryAPI } from "../../services/api";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Plus, Edit, Trash2, ChefHat, Search, Filter } from "lucide-react";
import AddMenuItemModal from "../AddMenuItemModal";
import EditMenuItemModal from "../EditMenuItemModal";

const MenuItemsManagement = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMenuItem, setEditingMenuItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const queryClient = useQueryClient();

  const { data: menuData, isLoading } = useQuery({
    queryKey: ["admin-menu", selectedCategory, searchTerm],
    queryFn: () =>
      menuAPI.getMenus({
        categoryId: selectedCategory || undefined,
        searchTerm: searchTerm || undefined,
      }),
  });

  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoryAPI.getAllCategories(),
  });

  const deleteMenuMutation = useMutation({
    mutationFn: (id) => menuAPI.deleteMenu(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-menu"]);
    },
  });

  const menuItems = menuData?.data?.data || [];
  const categories = categoriesData?.data?.data || [];

  const handleDeleteMenuItem = (id) => {
    if (window.confirm("Are you sure you want to delete this menu item?")) {
      deleteMenuMutation.mutate(id);
    }
  };

  const handleEditMenuItem = (menuItem) => {
    setEditingMenuItem(menuItem);
    setShowEditModal(true);
  };

  return (
    <div className="space-y-6 p-6 w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Menu Items Management
          </h1>
          <p className="text-muted-foreground">Manage food menu items</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Menu Item
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ChefHat className="h-5 w-5 mr-2" />
            Menu Items ({menuItems.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search menu items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-border rounded-lg bg-background text-foreground shadow-sm hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent cursor-pointer"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2">Loading menu items...</span>
            </div>
          )}

          {!isLoading && menuItems.length === 0 && (
            <div className="text-center py-8">
              <ChefHat className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No menu items found</p>
              <Button className="mt-4" onClick={() => setShowAddModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Menu Item
              </Button>
            </div>
          )}

          {!isLoading && menuItems.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {menuItems.map((item) => (
                <Card
                  key={item.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <div className="aspect-square overflow-hidden">
                    <img
                      src={item.imageUrl || "/placeholder-food.jpg"}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-sm line-clamp-2 flex-1">
                        {item.name}
                      </h3>
                      <div className="flex space-x-1 ml-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 w-6 p-0"
                          onClick={() => handleEditMenuItem(item)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 w-6 p-0"
                          onClick={() => handleDeleteMenuItem(item.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                      {item.description}
                    </p>

                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-primary">
                        ${item.price?.toFixed(2)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {item.category?.name}
                      </span>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      <span>ID: {item.id}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <AddMenuItemModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
      />
      <EditMenuItemModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingMenuItem(null);
        }}
        menuItem={editingMenuItem}
      />
    </div>
  );
};

export default MenuItemsManagement;
