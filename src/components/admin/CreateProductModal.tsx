import React, { useState } from 'react';
import { useMutation, useLazyQuery } from '@apollo/client';
import { XMarkIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { CREATE_PRODUCT, GET_PRESIGNED_URL } from '../../graphql/queries';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';

interface CreateProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateProductModal: React.FC<CreateProductModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    quantity: '',
    width: '',
    length: '',
    height: '',
    weight: '',
    tags: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploading, setUploading] = useState(false);

  const [getPresignedUrl] = useLazyQuery(GET_PRESIGNED_URL);
  const [createProduct] = useMutation(CREATE_PRODUCT);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      let imageUrl = '';

      // Upload image if selected
      if (imageFile) {
        // Get presigned URL (using useLazyQuery)
        const { data: presignedData } = await getPresignedUrl({
          variables: {
            filename: imageFile.name,
            contentType: imageFile.type,
          },
          fetchPolicy: 'network-only',
        });

        if (presignedData?.getPresignedUrl) {
          const { uploadUrl, imageUrl: url } = presignedData.getPresignedUrl;

          // Upload to S3
          const uploadResponse = await fetch(uploadUrl, {
            method: 'PUT',
            body: imageFile,
            headers: {
              'Content-Type': imageFile.type,
            },
          });

          if (!uploadResponse.ok) {
            throw new Error('Failed to upload image');
          }

          imageUrl = url;
        }
      }

      // Create product
      const { data } = await createProduct({
        variables: {
          input: {
            name: formData.name,
            category: formData.category,
            price: parseInt(formData.price),
            quantity: formData.quantity ? parseInt(formData.quantity) : 0,
            package: {
              width: formData.width ? parseInt(formData.width) : 0,
              length: formData.length ? parseInt(formData.length) : 0,
              height: formData.height ? parseInt(formData.height) : 0,
              weight: formData.weight ? parseInt(formData.weight) : 0,
            },
            tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : [],
            pictures: imageUrl ? [imageUrl] : [],
          },
        },
      });

      if (data?.createProduct?.success) {
        alert('Product created successfully!');
        onSuccess();
        resetForm();
      } else {
        alert(data?.createProduct?.message || 'Failed to create product');
      }
    } catch (error) {
      console.error('Error creating product:', error);
      alert('Failed to create product. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      price: '',
      quantity: '',
      width: '',
      length: '',
      height: '',
      weight: '',
      tags: '',
    });
    setImageFile(null);
    setImagePreview('');
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Product">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Product Image
          </label>
          <div className="flex items-center gap-4">
            {imagePreview ? (
              <img src={imagePreview} alt="Preview" className="w-32 h-32 object-cover rounded" />
            ) : (
              <div className="w-32 h-32 bg-gray-100 rounded flex items-center justify-center">
                <PhotoIcon className="h-12 w-12 text-gray-400" />
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="text-sm text-gray-600"
            />
          </div>
        </div>

        {/* Basic Info */}
        <Input
          label="Product Name"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          required
        />

        <Input
          label="Category"
          value={formData.category}
          onChange={(e) => handleChange('category', e.target.value)}
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Price ($)"
            type="number"
            value={formData.price}
            onChange={(e) => handleChange('price', e.target.value)}
            required
          />

          <Input
            label="Quantity"
            type="number"
            value={formData.quantity}
            onChange={(e) => handleChange('quantity', e.target.value)}
          />
        </div>

        {/* Package Dimensions */}
        <div className="border-t pt-4">
          <h3 className="font-medium text-gray-900 mb-3">Package Dimensions</h3>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Width (cm)"
              type="number"
              value={formData.width}
              onChange={(e) => handleChange('width', e.target.value)}
            />
            <Input
              label="Length (cm)"
              type="number"
              value={formData.length}
              onChange={(e) => handleChange('length', e.target.value)}
            />
            <Input
              label="Height (cm)"
              type="number"
              value={formData.height}
              onChange={(e) => handleChange('height', e.target.value)}
            />
            <Input
              label="Weight (g)"
              type="number"
              value={formData.weight}
              onChange={(e) => handleChange('weight', e.target.value)}
            />
          </div>
        </div>

        {/* Tags */}
        <Input
          label="Tags (comma separated)"
          value={formData.tags}
          onChange={(e) => handleChange('tags', e.target.value)}
          placeholder="electronics, sale, featured"
        />

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button type="submit" variant="primary" fullWidth isLoading={uploading}>
            Create Product
          </Button>
          <Button type="button" variant="outline" fullWidth onClick={onClose}>
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateProductModal;
