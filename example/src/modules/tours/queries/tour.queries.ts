import {useQuery} from '@tanstack/react-query';
import {supabaseClient} from '../../supabase/supabase.client.ts';

export const QueryKeys = {
  root: () => ['tour'] as const,
  tours: () => ['tour', 'tours'] as const,
};

export const TourQueries = {
  QueryKeys,

  useTours: () => {
    return useQuery({
      initialData: [],
      queryKey: QueryKeys.tours(),
      queryFn: async () => {
        const {data} = await supabaseClient
          .from('tour')
          .select('*')
          .throwOnError();
        return data ?? [];
      },
    });
  },
};
