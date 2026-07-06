import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { categoryAPI } from '../services/api';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { X } from 'lucide-react';

const AddCategoryModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const queryClient = useQueryClient();

  const createCategoryMutation = useMutation({
    mutationFn: (categoryData) => categoryAPI.addCategory(categoryData),
    onSuccess: () => {
      queryClient.invalidateQueries(['categories']);
      onClose();
      setFormData({ name: '' });
      setImageFile(null);
      setPreviewUrl('');
      setError('');
    },
    onError: (err) => {
      setError(err.response?.data?.message || 'Failed to create category');
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Category name is required');
      return;
    }

    if (!imageFile) {
      setError('Category image is required');
      return;
    }

    const data = new FormData();
    data.append('name', formData.name);
    data.append('imageFile', imageFile);

    setIsLoading(true);
    setError('');
    createCategoryMutation.mutate(data);
    setIsLoading(false);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 !m-0">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Add New Category</CardTitle>
              <CardDescription>Create a new food category</CardDescription>
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
              <Label htmlFor="name">Category Name *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter category name"
                required
              />
            </div>



            <div className="space-y-4">
              <Label>Category Image *</Label>

              {/* Image Preview */}
              {previewUrl && (
                <div className="relative w-full h-48 bg-muted rounded-md overflow-hidden mb-2">
                  <img
                    src={previewUrl}
                    alt="Category preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <Input
                id="imageFile"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    setImageFile(file);
                    setPreviewUrl(URL.createObjectURL(file));
                  }
                }}
                required
              />
              <p className="text-xs text-muted-foreground">
                Upload an image for the category.
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
                disabled={isLoading || createCategoryMutation.isPending}
                className="flex-1"
              >
                {isLoading || createCategoryMutation.isPending ? 'Creating...' : 'Create Category'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div >
  );
};

export default AddCategoryModal;
