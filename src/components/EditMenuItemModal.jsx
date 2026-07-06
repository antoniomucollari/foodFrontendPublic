import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { menuAPI, categoryAPI } from "../services/api";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { X } from "lucide-react";

const EditMenuItemModal = ({ isOpen, onClose, menuItem }) => {
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    description: "",
    price: "",
    categoryId: "",
    imageFile: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const queryClient = useQueryClient();

  // Fetch categories for dropdown
  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoryAPI.getAllCategories(),
  });

  // Fetch individual menu item data to ensure we have the most up-to-date information
  const { data: menuItemData } = useQuery({
    queryKey: ["menu-item", menuItem?.id],
    queryFn: () => menuAPI.getMenuById(menuItem?.id),
    enabled: !!menuItem?.id && isOpen,
  });

  useEffect(() => {
    if (menuItemData?.data?.data) {
      const item = menuItemData.data.data;

      setFormData({
        id: item.id,
        name: item.name || "",
        description: item.description || "",
        price: item.price?.toString() || "",
        categoryId: item.categoryId?.toString() || "",
        imageFile: null, // Don't pre-populate image file
      });
    }
  }, [menuItemData]);

  // Cleanup object URLs when component unmounts
  useEffect(() => {
    return () => {
      if (formData.imageFile) {
        URL.revokeObjectURL(URL.createObjectURL(formData.imageFile));
      }
    };
  }, [formData.imageFile]);

  const updateMenuItemMutation = useMutation({
    mutationFn: (menuData) => {
      const formDataToSend = new FormData();
      formDataToSend.append("id", menuData.id);
      formDataToSend.append("name", menuData.name);
      formDataToSend.append("description", menuData.description);
      formDataToSend.append("price", menuData.price);
      formDataToSend.append("categoryId", menuData.categoryId);
      if (menuData.imageFile) {
        formDataToSend.append("imageFile", menuData.imageFile);
      }
      return menuAPI.updateMenu(formDataToSend);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-menu"]);
      queryClient.invalidateQueries(["menu"]);
      onClose();
      setFormData({
        id: "",
        name: "",
        description: "",
        price: "",
        categoryId: "",
        imageFile: null,
      });
      setError("");
    },
    onError: (err) => {
      setError(err.response?.data?.message || "Failed to update menu item");
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.price || !formData.categoryId) {
      setError("Please fill in all required fields");
      return;
    }

    setIsLoading(true);
    setError("");
    updateMenuItemMutation.mutate(formData);
    setIsLoading(false);
  };

  const handleChange = (e) => {
    if (e.target.name === "imageFile") {
      // Revoke previous object URL if it exists
      if (formData.imageFile) {
        URL.revokeObjectURL(URL.createObjectURL(formData.imageFile));
      }
      setFormData({
        ...formData,
        imageFile: e.target.files[0],
      });
    } else {
      setFormData({
        ...formData,
        [e.target.name]: e.target.value,
      });
    }
  };

  const categories = categoriesData?.data?.data || [];

  if (!isOpen || !menuItem) return null;

  return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 !m-0 min-h-screen">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Edit Menu Item</CardTitle>
              <CardDescription>Update menu item information</CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Item Name *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter item name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter item description"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price *</Label>
              <Input
                id="price"
                name="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={handleChange}
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoryId">Category *</Label>
              <select
                id="categoryId"
                name="categoryId"
                value={formData.categoryId}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground shadow-sm hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent cursor-pointer"
                required
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="imageFile">Replace Image (optional)</Label>
              {menuItemData?.data?.data?.imageUrl && !formData.imageFile && (
                <div className="mt-2 mb-3 p-3  bg-card rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                    Current image:
                  </p>
                  <img
                    src={menuItemData.data.data.imageUrl}
                    alt="Current"
                    className="w-20 h-20 object-cover rounded border"
                  />
                </div>
              )}
              {formData.imageFile && (
                <div className="mt-2 mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-blue-600 dark:text-blue-300 mb-2">
                    New image selected:
                  </p>
                  <img
                    src={URL.createObjectURL(formData.imageFile)}
                    alt="New"
                    className="w-20 h-20 object-cover rounded border"
                  />
                  <p className="text-xs text-blue-500 dark:text-blue-400 mt-1">
                    {formData.imageFile.name}
                  </p>
                </div>
              )}
              <div className="mt-2">
                <Input
                  id="imageFile"
                  name="imageFile"
                  type="file"
                  accept="image/*"
                  onChange={handleChange}
                  className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Leave empty to keep the current image. Upload a new image to
                replace it.
              </p>
            </div>

            <div className="flex space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading || updateMenuItemMutation.isPending}
                className="flex-1"
              >
                {isLoading || updateMenuItemMutation.isPending
                  ? "Updating..."
                  : "Update Item"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditMenuItemModal;
