import { ApolloClient, InMemoryCache, createHttpLink, ApolloLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { config } from '../config';
import { authService } from '../services/auth';

// HTTP Link
const httpLink = createHttpLink({
  uri: config.graphql.endpoint,
});

// Auth Link - adds authorization header to requests
const authLink = setContext((_, { headers }) => {
  const token = authService.getAccessToken();
  
  return {
    headers: {
      ...headers,
      authorization: token ? token : '',
    },
  };
});

// Error Link - handles GraphQL and network errors
const errorLink = onError(({ graphQLErrors, networkError, response }) => {
  // Log raw response for debugging
  if (response) {
    console.log('[Apollo Response]:', JSON.stringify(response, null, 2));
  }
  
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) => {
      console.error(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
      );
      
      // Handle token expiration - logout and redirect to login
      if (message.includes('Token has expired') || 
          message.includes('expired') ||
          message.includes('Unauthorized') || 
          message.includes('Not Authorized')) {
        console.warn('Authentication token expired or invalid - logging out');
        setTimeout(() => {
          authService.logout();
        }, 100);
      }
    });
  }

  if (networkError) {
    console.error(`[Network error]: ${networkError}`);
    
    // Handle 401 status code
    if ('statusCode' in networkError && networkError.statusCode === 401) {
      console.warn('Received 401 - logging out');
      setTimeout(() => {
        authService.logout();
      }, 100);
    }
  }
});

// Apollo Client
export const apolloClient = new ApolloClient({
  link: ApolloLink.from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          getProducts: {
            keyArgs: false,
            merge(existing, incoming, { args }) {
              if (!incoming) return existing;
              // If no nextToken, it's a fresh query - replace instead of merge
              if (!args?.nextToken) return incoming;
              // If we have a nextToken, we're loading more - merge the results
              if (!existing) return incoming;
              
              return {
                ...incoming,
                products: [...existing.products, ...incoming.products],
              };
            },
          },
          getOrders: {
            keyArgs: false,
            merge(existing, incoming, { args }) {
              if (!incoming) return existing;
              // If no nextToken, it's a fresh query - replace instead of merge
              if (!args?.nextToken) return incoming;
              // If we have a nextToken, we're loading more - merge the results
              if (!existing) return incoming;
              
              return {
                ...incoming,
                orders: [...existing.orders, ...incoming.orders],
              };
            },
          },
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
      errorPolicy: 'all',
    },
    query: {
      fetchPolicy: 'network-only',
      errorPolicy: 'all',
    },
    mutate: {
      errorPolicy: 'all',
    },
  },
});
