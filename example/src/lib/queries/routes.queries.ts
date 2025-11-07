import { useQuery } from "@tanstack/react-query";
import { Position } from "@turf/turf";

import { MapboxService } from "../services/mapbox.service";

const QueryKeys = {
  root: ["routes"],
  route: (waypoints: Position[]) => [...QueryKeys.root, waypoints],
};

export const RouteQueries = {
  useRoute: (coordinates: Position[]) => {
    return useQuery({
      enabled: coordinates.length >= 2,
      queryKey: QueryKeys.route(coordinates),
      queryFn: async () => {
        return new MapboxService().getRoute(coordinates);
      },
    });
  },
};
