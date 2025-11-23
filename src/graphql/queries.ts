import { gql } from '@apollo/client';

// Product Queries
export const GET_PRODUCTS = gql`
  query GetProducts($nextToken: String) {
    getProducts(nextToken: $nextToken) {
      products {
        productId
        name
        price
        category
        pictures
        tags
        package {
          weight
          width
          length
          height
        }
      }
      nextToken
    }
  }
`;

export const GET_PRODUCT = gql`
  query GetProduct($productId: ID!) {
    getProduct(productId: $productId) {
      productId
      name
      price
      category
      pictures
      tags
      package {
        weight
        width
        length
        height
      }
    }
  }
`;

export const GET_PRODUCTS_BY_CATEGORY = gql`
  query GetProductsByCategory($category: String!, $nextToken: String) {
    getProductsByCategory(category: $category, nextToken: $nextToken) {
      products {
        productId
        name
        description
        price
        category
        pictures
        tags
      }
      nextToken
    }
  }
`;

// Order Queries
export const GET_ORDERS = gql`
  query GetOrders($nextToken: String) {
    getOrders(nextToken: $nextToken) {
      orders {
        orderId
        userId
        status
        total
        createdDate
        modifiedDate
        products {
          productId
          name
          price
          quantity
        }
        address {
          name
          streetAddress
          city
          state
          country
          postCode
        }
        deliveryPrice
      }
      nextToken
    }
  }
`;

export const GET_ORDER = gql`
  query GetOrder($orderId: ID!) {
    getOrder(orderId: $orderId) {
      orderId
      userId
      status
      total
      createdDate
      modifiedDate
      products {
        productId
        name
        price
        quantity
      }
      address {
        name
        streetAddress
        city
        state
        country
        postCode
      }
      deliveryPrice
    }
  }
`;

// Delivery Queries
export const GET_DELIVERY_PRICING = gql`
  query GetDeliveryPricing($input: DeliveryPricingInput!) {
    getDeliveryPricing(input: $input) {
      pricing
    }
  }
`;

export const GET_NEW_DELIVERIES = gql`
  query GetNewDeliveries($nextToken: String) {
    getNewDeliveries(nextToken: $nextToken) {
      deliveries {
        orderId
        address {
          name
          streetAddress
          city
          state
          country
          phoneNumber
        }
      }
      nextToken
    }
  }
`;

export const GET_IN_PROGRESS_DELIVERIES = gql`
  query GetInProgressDeliveries($nextToken: String) {
    getInProgressDeliveries(nextToken: $nextToken) {
      deliveries {
        orderId
        address {
          name
          streetAddress
          city
          state
          country
          phoneNumber
        }
      }
      nextToken
    }
  }
`;

export const GET_DELIVERY = gql`
  query GetDelivery($input: DeliveryInput!) {
    getDelivery(input: $input) {
      orderId
      address {
        name
        companyName
        streetAddress
        city
        state
        country
        postCode
        phoneNumber
      }
    }
  }
`;

// Delivery Mutations
export const START_DELIVERY = gql`
  mutation StartDelivery($input: DeliveryInput!) {
    startDelivery(input: $input) {
      success
    }
  }
`;

export const FAIL_DELIVERY = gql`
  mutation FailDelivery($input: DeliveryInput!) {
    failDelivery(input: $input) {
      success
    }
  }
`;

export const COMPLETE_DELIVERY = gql`
  mutation CompleteDelivery($input: DeliveryInput!) {
    completeDelivery(input: $input) {
      success
    }
  }
`;

// Order Mutations
export const CREATE_ORDER = gql`
  mutation CreateOrder($order: CreateOrderRequest!) {
    createOrder(order: $order) {
      success
      message
      errors
      order {
        orderId
        userId
        status
        total
        createdDate
        products {
          productId
          name
          price
          quantity
        }
        address {
          name
          streetAddress
          city
          state
          country
          postCode
        }
        deliveryPrice
      }
    }
  }
`;

// Warehouse Queries
export const GET_NEW_PACKAGING_REQUEST_IDS = gql`
  query GetNewPackagingRequestIds($nextToken: String) {
    getNewPackagingRequestIds(nextToken: $nextToken) {
      packagingRequestIds
      nextToken
    }
  }
`;

export const GET_COMPLETED_PACKAGING_REQUEST_IDS = gql`
  query GetCompletedPackagingRequestIds($nextToken: String) {
    getCompletedPackagingRequestIds(nextToken: $nextToken) {
      packagingRequestIds
      nextToken
    }
  }
`;

export const GET_PACKAGING_REQUEST_V2 = gql`
  query GetPackagingRequestV2($input: PackagingInput!) {
    getPackagingRequest(input: $input) {
      orderId
      status
      products {
        productId
        quantity
      }
    }
  }
`;

// Warehouse Mutations
export const START_PACKAGING = gql`
  mutation StartPackaging($input: PackagingInput!) {
    startPackaging(input: $input) {
      success
    }
  }
`;

export const UPDATE_PACKAGING_PRODUCT = gql`
  mutation UpdatePackagingProduct($input: UpdatePackagingProductInput!) {
    updatePackagingProduct(input: $input) {
      success
    }
  }
`;

export const COMPLETE_PACKAGING = gql`
  mutation CompletePackaging($input: PackagingInput!) {
    completePackaging(input: $input) {
      success
    }
  }
`;
