import {useQuery, useMutation} from '@tanstack/react-query';

export const QueryKeys = {
  root: () => ['mapbox'] as const,
  forwardGeocode: (query: string) =>
    ['mapbox', 'forward-geocode', query] as const,
};

export const MapboxQueries = {
  QueryKeys,

  useForwardGeocode(query: string) {
    return useQuery({
      queryKey: QueryKeys.forwardGeocode(query),
      queryFn: async () => {
        return [];
      },
    });
  },
};
