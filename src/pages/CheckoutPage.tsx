import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useLazyQuery } from '@apollo/client';
import { CREATE_ORDER, GET_DELIVERY_PRICING } from '../graphql/queries';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/auth';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import type { Address, CreateOrderResponse, DeliveryPricingResponse } from '../types/graphql';

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { items, clearCart, getTotalPrice } = useCart();
  const { isAuthenticated } = useAuth();

  const [address, setAddress] = useState<Address>({
    name: '',
    streetAddress: '',
    city: '',
    state: '',
    country: 'USA',
    postCode: '',
    phoneNumber: '',
  });

  const [deliveryPrice, setDeliveryPrice] = useState<number>(0);
  const [shippingCalculated, setShippingCalculated] = useState<boolean>(false);
  const [paymentToken] = useState('mock_payment_token_' + Date.now());

  const [getDeliveryPricing, { loading: pricingLoading }] = useLazyQuery<{ getDeliveryPricing: DeliveryPricingResponse }>(
    GET_DELIVERY_PRICING,
    {
      onCompleted: (data) => {
        setDeliveryPrice(data.getDeliveryPricing.pricing);
        setShippingCalculated(true);
      },
      onError: (error) => {
        console.error('Pricing error:', error);
        setShippingCalculated(false);
      },
    }
  );

  const [createOrder, { loading: orderLoading }] = useMutation<{ createOrder: CreateOrderResponse }>(
    CREATE_ORDER,
    {
      onCompleted: (data) => {
        console.log('Create order response:', data);
        if (data.createOrder.success) {
          clearCart();
          navigate(`/orders/${data.createOrder.order?.orderId}`);
        } else {
          const errorDetails = data.createOrder.errors?.join(', ') || data.createOrder.message;
          console.error('Order validation errors:', data.createOrder);
          alert(`Order failed: ${errorDetails}`);
        }
      },
      onError: (error) => {
        console.error('Create order error:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        alert(`Failed to create order: ${error.message}`);
      },
    }
  );

  const handleAddressChange = (field: keyof Address, value: string) => {
    setAddress((prev) => ({ ...prev, [field]: value }));
  };

  const handleCalculateShipping = async () => {
    if (!address.streetAddress || !address.city || !address.state || !address.postCode) {
      alert('Please fill in all address fields');
      return;
    }

    await getDeliveryPricing({
      variables: {
        input: {
          products: items.map((item: any) => ({
            productId: item.product.productId,
            name: item.product.name,
            price: parseInt(item.product.price),
            quantity: parseInt(item.quantity),
            package: {
              weight: parseInt(item.product.package?.weight || 0),
              width: parseInt(item.product.package?.width || 0),
              length: parseInt(item.product.package?.length || 0),
              height: parseInt(item.product.package?.height || 0),
            },
          })),
          address: {
            name: address.name,
            companyName: undefined,
            streetAddress: address.streetAddress,
            postCode: address.postCode,
            city: address.city,
            state: address.state,
            country: address.country,
            phoneNumber: address.phoneNumber,
          },
        },
      },
    });
  };

  const handleSubmitOrder = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (deliveryPrice === 0) {
      alert('Please calculate shipping first');
      return;
    }

    if (!address.phoneNumber || address.phoneNumber.trim() === '') {
      alert('Please enter a phone number');
      return;
    }

    // Log access token for debugging
    const token = authService.getAccessToken();
    console.log('Access Token:', token);
    console.log('ID Token:', authService.getIdToken());
    console.log('User:', authService.getUser());

    const orderData = {
      products: items.map((item: any) => ({
        productId: item.product.productId,
        createdDate: item.product.createdDate || new Date().toISOString(),
        modifiedDate: item.product.modifiedDate || new Date().toISOString(),
        name: item.product.name,
        price: parseInt(item.product.price),
        quantity: parseInt(item.quantity),
        category: item.product.category || 'General',
        tags: item.product.tags || [],
        pictures: item.product.pictures || [],
        package: {
          weight: parseInt(item.product.package?.weight || 0),
          width: parseInt(item.product.package?.width || 0),
          length: parseInt(item.product.package?.length || 0),
          height: parseInt(item.product.package?.height || 0),
        },
      })),
      address: {
        name: address.name,
        streetAddress: address.streetAddress,
        postCode: address.postCode,
        city: address.city,
        state: address.state,
        country: address.country,
        phoneNumber: address.phoneNumber,
      },
      deliveryPrice: parseInt(deliveryPrice.toString()),
      paymentToken,
    };

    console.log('Sending order data:', JSON.stringify(orderData, null, 2));

    await createOrder({
      variables: {
        order: orderData,
      },
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Please Sign In</h2>
        <p className="text-gray-600 mb-8">You need to be signed in to checkout</p>
        <Button onClick={() => navigate('/login')}>Sign In</Button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Cart is Empty</h2>
        <Button onClick={() => navigate('/products')}>Continue Shopping</Button>
      </div>
    );
  }

  const subtotal = getTotalPrice();
  const total = subtotal + deliveryPrice;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Checkout Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Shipping Address */}
          <Card className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Shipping Address</h2>
            
            <div className="space-y-4">
              <Input
                label="Full Name"
                value={address.name}
                onChange={(e) => handleAddressChange('name', e.target.value)}
                placeholder="John Doe"
                required
              />

              <Input
                label="Street Address"
                value={address.streetAddress}
                onChange={(e) => handleAddressChange('streetAddress', e.target.value)}
                placeholder="123 Main St"
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="City"
                  value={address.city}
                  onChange={(e) => handleAddressChange('city', e.target.value)}
                  placeholder="New York"
                  required
                />

                <Input
                  label="State"
                  value={address.state}
                  onChange={(e) => handleAddressChange('state', e.target.value)}
                  placeholder="NY"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Postal Code"
                  value={address.postCode}
                  onChange={(e) => handleAddressChange('postCode', e.target.value)}
                  placeholder="10001"
                  required
                />

                <Input
                  label="Country"
                  value={address.country}
                  onChange={(e) => handleAddressChange('country', e.target.value)}
                  placeholder="USA"
                  required
                />
              </div>

              <Input
                label="Phone Number"
                value={address.phoneNumber}
                onChange={(e) => handleAddressChange('phoneNumber', e.target.value)}
                placeholder="+1 234 567 8900"
                type="tel"
                required
              />

              <Button
                variant="outline"
                fullWidth
                onClick={handleCalculateShipping}
                isLoading={pricingLoading}
              >
                Calculate Shipping
              </Button>

              {shippingCalculated && deliveryPrice > 0 && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <p className="text-green-800 font-medium">
                      Shipping calculated successfully!
                    </p>
                  </div>
                  <p className="text-green-700 text-sm mt-1">
                    Delivery cost: <span className="font-semibold">${deliveryPrice}</span>
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Payment Information */}
          <Card className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Payment Information</h2>
            <p className="text-gray-600 text-sm mb-4">
              Payment processing is simulated for this demo. In production, integrate with Stripe, PayPal, or other payment providers.
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-700">
                <strong>Mock Payment Token:</strong> {paymentToken}
              </p>
            </div>
          </Card>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="p-6 sticky top-24">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>
            
            <div className="space-y-3 mb-6">
              {items.map((item: any) => (
                <div key={item.product.productId} className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {item.product.name} × {item.quantity}
                  </span>
                  <span className="font-semibold">
                    ${item.product.price * item.quantity}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-2 border-t pt-4 mb-4">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>${subtotal}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span>
                  {deliveryPrice > 0 ? `$${deliveryPrice}` : 'Calculate'}
                </span>
              </div>
              <div className="border-t pt-2 flex justify-between text-lg font-bold text-gray-900">
                <span>Total</span>
                <span>${total}</span>
              </div>
            </div>

            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={handleSubmitOrder}
              isLoading={orderLoading}
              disabled={deliveryPrice === 0}
            >
              Place Order
            </Button>

            <Button
              variant="ghost"
              fullWidth
              onClick={() => navigate('/cart')}
              className="mt-3"
            >
              Back to Cart
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
