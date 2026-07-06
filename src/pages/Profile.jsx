import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { User, Mail, Phone, MapPin, Save, Edit, X, AlertTriangle, Shield, Camera, ArrowLeft } from 'lucide-react';

const Profile = () => {
  const navigate = useNavigate();
  const { user, updateUserProfile, refreshUserDetails, deactivateAccount } = useAuth();
  const { showSuccess, showError, showConfirm } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    address: '',
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        address: user.address || '',
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: ''
      });
      setImagePreview(user.profileUrl || null);
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    // Validate passwords
    if (formData.newPassword && formData.newPassword !== formData.confirmNewPassword) {
      showError('New passwords do not match!');
      return;
    }

    if (formData.newPassword && !formData.currentPassword) {
      showError('Please enter your current password to set a new password.');
      return;
    }

    setIsLoading(true);
    try {
      const updateData = { ...formData };

      // Clean up password fields before sending
      if (!updateData.newPassword) {
        delete updateData.newPassword;
        delete updateData.currentPassword;
      }
      delete updateData.confirmNewPassword; // Never send to backend

      // If a new image was selected, include it
      if (imageFile) {
        updateData.imageFile = imageFile;
      }

      await updateUserProfile(updateData);
      setIsEditing(false);
      setImageFile(null); // Clear the file after successful upload
      // Reset password fields
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: ''
      }));
      showSuccess('Profile updated successfully!');
    } catch (error) {
      // Error is handled by global error handler
      console.error('Error updating profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset form data to original user data
    setFormData({
      name: user.name || '',
      email: user.email || '',
      phoneNumber: user.phoneNumber || '',
      address: user.address || '',
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: ''
    });
    setImagePreview(user.profileUrl || null);
    setImageFile(null);
    setIsEditing(false);
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      await refreshUserDetails();
      showSuccess('Profile refreshed successfully!');
    } catch (error) {
      // Error is handled by global error handler
      console.error('Error refreshing profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeactivateAccount = async () => {
    const confirmed = await showConfirm(
      'Deactivate Account',
      'Are you sure you want to deactivate your account? This action cannot be undone and you will be logged out immediately.',
      {
        confirmText: 'Yes, Deactivate',
        cancelText: 'Cancel',
        type: 'danger'
      }
    );

    if (confirmed) {
      const doubleConfirmed = await showConfirm(
        'Final Confirmation',
        'This will permanently deactivate your account. Are you absolutely sure?',
        {
          confirmText: 'Yes, I\'m Sure',
          cancelText: 'Cancel',
          type: 'danger'
        }
      );

      if (doubleConfirmed) {
        setIsLoading(true);
        try {
          await deactivateAccount();
          showSuccess('Account deactivated successfully. You have been logged out.');
        } catch (error) {
          // Error is handled by global error handler
          console.error('Error deactivating account:', error);
        } finally {
          setIsLoading(false);
        }
      }
    }
  };

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate('/discovery');
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <p className="text-muted-foreground">Please log in to view your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 px-4 pt-8 pb-8">
      <div>
        <Button variant="link" size="sm" onClick={handleGoBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Profile</h1>
          <p className="text-muted-foreground">Manage your account information</p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="minimal"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            Refresh
          </Button>
          {!isEditing ? (
            <Button variant="minimal" onClick={() => setIsEditing(true)}>
              Edit Profile
            </Button>
          ) : (
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isLoading}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isLoading}
              >
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Profile Avatar Section */}
      <Card>
        <CardContent className="flex flex-col items-center py-8">
          <div className="relative mb-4">
            {imagePreview ? (
              <img
                src={imagePreview}
                alt={user.name}
                className="w-24 h-24 rounded-full object-cover ring-4 ring-primary/20"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center ring-4 ring-primary/20">
                <User className="h-12 w-12 text-primary" />
              </div>
            )}

            {isEditing && (
              <label
                htmlFor="profile-image-upload"
                className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1.5 cursor-pointer shadow-md hover:bg-primary/90 transition-colors"
                title="Change profile picture"
              >
                <Camera className="h-4 w-4" />
                <input
                  id="profile-image-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </label>
            )}
          </div>
          <h2 className="text-xl font-semibold text-foreground">{user.name}</h2>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                disabled={!isEditing}
                placeholder="Enter your full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                disabled={!isEditing}
                placeholder="Enter your email"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                disabled={!isEditing}
                placeholder="Enter your phone number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                disabled={!isEditing}
                placeholder="Enter your address"
              />
            </div>
          </div>

          {isEditing && (
            <div className="space-y-4 pt-4 border-t">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  name="currentPassword"
                  type="password"
                  value={formData.currentPassword}
                  onChange={handleInputChange}
                  placeholder="Enter current password (required if changing password)"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    value={formData.newPassword}
                    onChange={handleInputChange}
                    placeholder="Enter new password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
                  <Input
                    id="confirmNewPassword"
                    name="confirmNewPassword"
                    type="password"
                    value={formData.confirmNewPassword}
                    onChange={handleInputChange}
                    placeholder="Confirm new password"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="pt-4 border-t">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-muted-foreground">Account Status</Label>
                <p className="font-medium">
                  {user.isActive ? (
                    <span className="text-green-600">Active</span>
                  ) : (
                    <span className="text-red-600">Inactive</span>
                  )}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Roles</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {user.roles?.map((role, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary"
                    >
                      <Shield className="h-3 w-3 mr-1" />
                      {typeof role === 'string' ? role : role.name}
                    </span>
                  )) || <span className="text-muted-foreground">No roles assigned</span>}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Deactivation Section */}
      <Card className="border-red-200 dark:border-red-800">
        <CardHeader>
          <h3 className="text-lg font-medium text-red-600 dark:text-red-400">
            Deactivate Account
          </h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>

              <p className="text-sm text-muted-foreground mt-1">
                Once you deactivate your account, you will not be able to log in again.
                This action cannot be undone.
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={handleDeactivateAccount}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              {isLoading ? 'Deactivating...' : 'Deactivate Account'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
