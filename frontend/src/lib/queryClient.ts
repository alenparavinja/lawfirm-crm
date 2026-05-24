import { QueryClient } from '@tanstack/react-query';

// staleTime of 5 minutes suits a CRM where data changes infrequently and
// tabs stay open for long sessions. refetchOnWindowFocus is off for the
// same reason - refetching because a user alt-tabbed is more disruptive
// than helpful in a dense data entry context.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default queryClient;