import {useQuery} from '@tanstack/react-query';
import {MapboxService} from '../services/mapbox.service.ts';

export const QueryKeys = {
  root: () => ['mapbox'] as const,
  forwardGeocode: (query: string) =>
    ['mapbox', 'forward-geocode', query] as const,
};

export const MapboxQueries = {
  QueryKeys,

  useForwardGeocode(query: string) {
    const {mapbox} = MapboxService.useState();

    return useQuery({
      enabled: !!query && query.length > 3,
      queryKey: QueryKeys.forwardGeocode(query),
      queryFn: async () => {
        return await mapbox.forwardGeocode(query);
      },
    });
  },
};
