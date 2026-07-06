import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useAuth } from "../contexts/AuthContext";
import { restaurantsAPI, categoryAPI } from "../services/api";
import { toast } from "react-toastify";
import { Loader2, Upload, UtensilsCrossed } from "lucide-react";
import Select from "react-select";

const CreateRestaurant = () => {
    const { user, refreshUserDetails } = useAuth();
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [coverImagePreview, setCoverImagePreview] = useState(null);
    const [profileImagePreview, setProfileImagePreview] = useState(null);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm();

    useEffect(() => {
        // If user already has a restaurant, redirect to dashboard
        if (user?.restaurantId) {
            navigate("/manager/dashboard");
        }

        // Fetch categories
        const fetchCategories = async () => {
            try {
                const response = await categoryAPI.getAllCategories();
                const categoryOptions = response.data.data.map((cat) => ({
                    value: cat.id,
                    label: cat.name,
                }));
                setCategories(categoryOptions);
            } catch (error) {
                console.error("Failed to fetch categories:", error);
                toast.error("Failed to load restaurant categories");
            }
        };

        fetchCategories();
    }, [user, navigate]);

    const handleImageChange = (e, fieldName, setPreview) => {
        const file = e.target.files[0];
        if (file) {
            setValue(fieldName, file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const onSubmit = async (data) => {
        setIsLoading(true);
        try {
            const formData = new FormData();
            formData.append("name", data.name);
            formData.append("description", data.description);
            formData.append("phoneNumber", data.phoneNumber);
            formData.append("categories", data.categories.map((c) => c.value)); // Send IDs only

            if (data.coverImage) {
                formData.append("coverImage", data.coverImage);
            }
            if (data.profileImage) {
                formData.append("profileImage", data.profileImage);
            }

            await restaurantsAPI.createRestaurant(formData);

            toast.success("Restaurant created successfully!");

            // Refresh user details to get the new restaurantId
            await refreshUserDetails();

            // Navigate to dashboard
            navigate("/manager/dashboard");
        } catch (error) {
            console.error("Create restaurant error:", error);
            toast.error(error.response?.data?.message || "Failed to create restaurant");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center">
                    <div className="bg-primary p-3 rounded-full">
                        <UtensilsCrossed className="h-8 w-8 text-white" />
                    </div>
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    Create Your Restaurant
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    You need to set up your restaurant profile before accessing the dashboard.
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                        {/* Name */}
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                Restaurant Name
                            </label>
                            <div className="mt-1">
                                <input
                                    id="name"
                                    type="text"
                                    {...register("name", { required: "Restaurant name is required" })}
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm text-gray-900 bg-white"
                                />
                                {errors.name && (
                                    <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                                )}
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                                Description
                            </label>
                            <div className="mt-1">
                                <textarea
                                    id="description"
                                    rows={3}
                                    {...register("description", { required: "Description is required" })}
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm text-gray-900 bg-white"
                                />
                                {errors.description && (
                                    <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                                )}
                            </div>
                        </div>

                        {/* Phone Number */}
                        <div>
                            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                                Phone Number
                            </label>
                            <div className="mt-1">
                                <input
                                    id="phoneNumber"
                                    type="text"
                                    {...register("phoneNumber", { required: "Phone number is required" })}
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm text-gray-900 bg-white"
                                />
                                {errors.phoneNumber && (
                                    <p className="mt-1 text-sm text-red-600">{errors.phoneNumber.message}</p>
                                )}
                            </div>
                        </div>

                        {/* Categories */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Categories
                            </label>
                            <Select
                                options={categories}
                                isMulti
                                onChange={(selected) => setValue("categories", selected)}
                                className="basic-multi-select"
                                classNamePrefix="select"
                                placeholder="Select categories..."
                                styles={{
                                    control: (base) => ({
                                        ...base,
                                        borderColor: '#d1d5db',
                                    }),
                                    option: (base, state) => ({
                                        ...base,
                                        color: '#111827', // text-gray-900
                                        backgroundColor: state.isFocused ? '#f3f4f6' : 'white',
                                    }),
                                    input: (base) => ({
                                        ...base,
                                        color: '#111827',
                                    }),
                                    singleValue: (base) => ({
                                        ...base,
                                        color: '#111827',
                                    }),
                                    multiValueLabel: (base) => ({
                                        ...base,
                                        color: '#111827',
                                    }),
                                }}
                            />
                            {/* Hidden input for validation if needed, or rely on state */}
                        </div>


                        {/* Images Grid */}
                        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                            {/* Profile Image */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Profile Image</label>
                                <div className="mt-1 flex items-center justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md h-32 relative overflow-hidden group hover:border-primary transition-colors cursor-pointer">
                                    {profileImagePreview ? (
                                        <img src={profileImagePreview} alt="Profile Preview" className="absolute inset-0 w-full h-full object-cover" />
                                    ) : (
                                        <div className="space-y-1 text-center pointer-events-none">
                                            <Upload className="mx-auto h-8 w-8 text-gray-400" />
                                            <div className="text-xs text-gray-600">
                                                <span className="text-primary hover:text-primary-dark">Upload</span> profile
                                            </div>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        accept="image/*"
                                        onChange={(e) => handleImageChange(e, "profileImage", setProfileImagePreview)}
                                    />
                                    {profileImagePreview && (
                                        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                            <span className="text-white text-xs font-medium">Change Image</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Cover Image */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Cover Image</label>
                                <div className="mt-1 flex items-center justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md h-32 relative overflow-hidden group hover:border-primary transition-colors cursor-pointer">
                                    {coverImagePreview ? (
                                        <img src={coverImagePreview} alt="Cover Preview" className="absolute inset-0 w-full h-full object-cover" />
                                    ) : (
                                        <div className="space-y-1 text-center pointer-events-none">
                                            <Upload className="mx-auto h-8 w-8 text-gray-400" />
                                            <div className="text-xs text-gray-600">
                                                <span className="text-primary hover:text-primary-dark">Upload</span> cover
                                            </div>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        accept="image/*"
                                        onChange={(e) => handleImageChange(e, "coverImage", setCoverImagePreview)}
                                    />
                                    {coverImagePreview && (
                                        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                            <span className="text-white text-xs font-medium">Change Image</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>


                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                                        Creating Restaurant...
                                    </>
                                ) : (
                                    "Create Restaurant"
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreateRestaurant;
