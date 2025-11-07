import queryString from "query-string";
import { Linking, Platform } from "react-native";

// Define types for the options
type MapProvider = "google";
type TravelType = "drive" | "walk" | "public_transport";
type MapType = "standard" | "satellite" | "hybrid" | "transit";

interface Options {
  provider?: MapProvider;
  latitude?: number;
  longitude?: number;
  zoom?: number;
  start?: string;
  end?: string;
  endPlaceId?: string;
  query?: string;
  queryPlaceId?: string;
  navigate?: boolean;
  travelType?: TravelType;
  mapType?: MapType;
  waypoints?: string[];
  coords?: string;
  reverseCoords?: string;
}

// Stringifies the latitude and longitude into coordinates
export const geoCordStringify = (
  latitude: number,
  longitude: number,
): string => {
  if (typeof latitude !== "number" || typeof longitude !== "number") {
    throw new Error("Entered a non-number value for geo coordinates.");
  }

  return `${latitude},${longitude}`;
};

export const validateTravelType = (type: TravelType): boolean => {
  const validTypes: TravelType[] = ["drive", "walk", "public_transport"];
  if (!validTypes.includes(type)) {
    throw new Error(`Invalid travel type: ${type}`);
  }
  return true;
};

// Validates the map type
export const validateMapType = (type: MapType): boolean => {
  const validTypes: MapType[] = ["standard", "satellite", "hybrid", "transit"];
  if (!validTypes.includes(type)) {
    throw new Error(`Invalid map type: ${type}`);
  }
  return true;
};

// cleanObject :: {} -> {}
// Creates a new object that removes any empty values
const cleanObject = (input: Record<string, any>): Record<string, any> => {
  return Object.keys(input).reduce((acc, key) => {
    const currentValue = input[key];
    return currentValue ? { ...acc, [key]: currentValue } : acc;
  }, {});
};

// Create Google Maps Parameters
// doc: https://developers.google.com/maps/documentation/urls/get-started
const createGoogleParams = (options: Options): Record<string, any> => {
  const travelTypeMap: Record<TravelType, string> = {
    drive: "driving",
    walk: "walking",
    public_transport: "transit",
  };

  const baseTypeMap: Record<MapType, string> = {
    satellite: "satellite",
    standard: "roadmap",
    hybrid: "satellite",
    transit: "roadmap",
  };

  const params: Record<string, any> = {
    origin: options.start,
    destination: options.end,
    destination_place_id: options.endPlaceId,
    travelmode: options.travelType
      ? travelTypeMap[options.travelType]
      : undefined,
    zoom: options.zoom,
    basemap: options.mapType ? baseTypeMap[options.mapType] : undefined,
    waypoints: options.waypoints,
  };

  if (options.mapType === "transit" || options.mapType === "hybrid") {
    params.layer = "transit";
  }

  if (options.navigate === true) {
    params.dir_action = "navigate";
  }

  if (options.coords) {
    params.center = options.coords;
  } else {
    params.query = options.query;
    params.query_place_id = options.queryPlaceId;
  }

  return cleanObject(params);
};

// Generates a query parameter for the provider specified
export const createQueryParameters = (
  options: Options,
): Record<string, any> => {
  if (options.travelType) {
    validateTravelType(options.travelType);
  }

  if (options.mapType) {
    validateMapType(options.mapType);
  }

  if (options.latitude && options.longitude) {
    options.coords = geoCordStringify(options.latitude, options.longitude);
    options.reverseCoords = geoCordStringify(
      options.longitude,
      options.latitude,
    );
  }

  const generateParameters: Record<
    MapProvider,
    (opts: Options) => Record<string, any>
  > = {
    google: createGoogleParams,
    // Add other providers here if necessary
  };

  return generateParameters[options.provider || "google"](options);
};

export default function open(options: Options): void {
  createOpenLink(options)();
}

export function createOpenLink({
  provider,
  ...options
}: Options): () => Promise<void> {
  const defaultProvider: MapProvider =
    Platform.OS === "ios" ? "google" : "google";
  const mapProvider: MapProvider = provider || defaultProvider;

  const mapLink: string = createMapLink({ provider: mapProvider, ...options });
  return async () => {
    try {
      await Linking.openURL(mapLink);
    } catch (err) {
      console.error("An error occurred", err);
    }
  };
}

export function createMapLink(options: Options): string {
  const {
    provider = "google",
    latitude,
    longitude,
    zoom,
    start,
    end,
    endPlaceId,
    query,
    queryPlaceId,
    travelType,
    mapType,
    waypoints = [],
  } = options;
  let { navigate } = options;

  const link: Record<MapProvider, string> = {
    google: "https://www.google.com/maps/search/?api=1&",
    // apple: Platform.OS === "ios" ? "maps://?" : "http://maps.apple.com/?",
    // yandex: "https://maps.yandex.com/?",
  };

  if (latitude && longitude) {
    link.google = "https://www.google.com/maps/@?api=1&map_action=map&";
    if (navigate === true && end === null) {
      console.warn(
        "Navigation mode set, but no end destination configured, defaulting to preview mode.",
      );
      navigate = false;
    }
  }

  if (end) {
    link.google = "https://www.google.com/maps/dir/?api=1&";
  }

  const stringifyOptions: queryString.StringifyOptions = {
    arrayFormat: provider === "google" ? "separator" : undefined,
    arrayFormatSeparator: "|",
  };

  const mapQueryParams = createQueryParameters({ ...options, provider });
  return (
    link[provider] +
    queryString.stringify(mapQueryParams, stringifyOptions).replace(/%2C/g, ",")
  );
}
