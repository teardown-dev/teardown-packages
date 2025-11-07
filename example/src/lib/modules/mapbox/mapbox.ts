import * as GeoJSON from 'geojson';
import {
  Coordinates,
  DirectionsApproach,
  MapiRequest,
  // @ts-ignore
} from '@mapbox/mapbox-sdk/lib/classes/mapi-request';
// @ts-ignore
import MapboxDirectionsClient from '@mapbox/mapbox-sdk/services/directions';
import MapiClient, {
  SdkConfig,
  // @ts-ignore
} from '@mapbox/mapbox-sdk/lib/classes/mapi-client';

export default function DirectionsClient(config: SdkConfig | MapiClient) {
  return new MapboxDirectionsClient(config) as DirectionsService;
}

export interface DirectionsService {
  getDirections(
    request: DirectionsRequest | DirectionsRequest<'polyline' | 'polyline6'>,
  ): MapiRequest<DirectionsResponse>;
  getDirections(
    request: DirectionsRequest<'geojson'>,
  ): MapiRequest<
    DirectionsResponse<GeoJSON.MultiLineString | GeoJSON.LineString>
  >;
}

export type DirectionsAnnotation =
  | 'duration'
  | 'distance'
  | 'speed'
  | 'congestion';
export type DirectionsGeometry = 'geojson' | 'polyline' | 'polyline6';
export type DirectionsOverview = 'full' | 'simplified' | 'false';
export type DirectionsUnits = 'imperial' | 'metric';
export type DirectionsSide = 'left' | 'right';
export type DirectionsMode =
  | 'driving'
  | 'ferry'
  | 'unaccessible'
  | 'walking'
  | 'cycling'
  | 'train';
export type DirectionsClass =
  | 'toll'
  | 'ferry'
  | 'restricted'
  | 'motorway'
  | 'tunnel';
export type ManeuverModifier =
  | 'uturn'
  | 'sharp right'
  | 'right'
  | 'slight right'
  | 'straight'
  | 'slight left'
  | 'left'
  | 'sharp left'
  | 'depart'
  | 'arrive';
export type ManeuverType =
  | 'turn'
  | 'new name'
  | 'depart'
  | 'arrive'
  | 'merge'
  | 'on ramp'
  | 'off ramp'
  | 'fork'
  | 'end of road'
  | 'continue'
  | 'roundabout'
  | 'rotary'
  | 'roundabout turn'
  | 'notification'
  | 'exit roundabout'
  | 'exit rotary';
export type Polyline = string;
export type RouteGeometry =
  | GeoJSON.LineString
  | GeoJSON.MultiLineString
  | Polyline;

export interface CommonDirectionsRequest<
  T extends DirectionsGeometry = 'polyline',
> {
  waypoints: DirectionsWaypoint[];
  /**
   * Whether to try to return alternative routes. An alternative is classified as a route that is significantly
   * different than the fastest route, but also still reasonably fast. Such a route does not exist in all circumstances.
   * Currently up to two alternatives can be returned. Can be  true or  false (default).
   */
  alternatives?: boolean | undefined;
  /**
   * Whether or not to return additional metadata along the route. Possible values are:  duration ,  distance ,  speed , and congestion .
   * Several annotations can be used by including them as a comma-separated list. See the RouteLeg object for more details on
   * what is included with annotations.
   */
  annotations?: DirectionsAnnotation[] | undefined;

  /**
   * Whether or not to return banner objects associated with the  routeSteps .
   * Should be used in conjunction with  steps . Can be  true or  false . The default is  false .
   */
  bannerInstructions?: boolean | undefined;

  /**
   * Sets the allowed direction of travel when departing intermediate waypoints. If  true , the route will continue in the same
   * direction of travel. If  false , the route may continue in the opposite direction of travel. Defaults to  true for mapbox/driving and
   * false for  mapbox/walking and  mapbox/cycling .
   */
  continueStraight?: boolean | undefined;
  /**
   * Format of the returned geometry. Allowed values are:  geojson (as LineString ),
   * polyline with precision 5,  polyline6 (a polyline with precision 6). The default value is  polyline .
   */
  geometries?: T;
  /**
   * Language of returned turn-by-turn text instructions. See supported languages . The default is  en for English.
   */
  language?: string | undefined;
  /**
   * Type of returned overview geometry. Can be  full (the most detailed geometry available),
   * simplified (a simplified version of the full geometry), or  false (no overview geometry). The default is  simplified .
   */
  overview?: DirectionsOverview | undefined;

  /**
   * Emit instructions at roundabout exits. Can be  true or  false . The default is  false .
   */
  roundaboutExits?: boolean | undefined;
  /**
   * Whether to return steps and turn-by-turn instructions. Can be  true or  false . The default is  false .
   */
  steps?: boolean | undefined;
  /**
   * Whether or not to return SSML marked-up text for voice guidance along the route. Should be used in conjunction with steps .
   * Can be  true or  false . The default is  false .
   */
  voiceInstructions?: boolean | undefined;
  /**
   * Which type of units to return in the text for voice instructions. Can be  imperial or  metric . Default is  imperial .
   */
  voiceUnits?: DirectionsUnits | undefined;
}

export type DirectionsProfileInclusion =
  | {
      profile: 'walking' | 'cycling';
    }
  | {
      profile: 'driving';
      /**
       * The desired arrival time, formatted as a timestamp in ISO-8601 format in the local time at the route destination. The travel time, returned in duration, is a prediction for travel time based on historical travel data. The route is calculated in a time-dependent manner. For example, a trip that takes two hours will consider changing historic traffic conditions across the two-hour window. The route takes timed turn restrictions and conditional access restrictions into account based on the requested arrival time.
       */
      arriveBy?: string;
      /**
       * The departure time, formatted as a timestamp in ISO-8601 format in the local time at the route origin. The travel time, returned in duration, is a prediction for travel time based on historical travel data. The route is calculated in a time-dependent manner. For example, a trip that takes two hours will consider changing historic traffic conditions across the two-hour window, instead of only at the specified depart_at time. The route takes timed turn restrictions and conditional access restrictions into account based on the requested departure time.
       */
      departAt?: string;
      /**
       * The max vehicle height, in meters. If this parameter is provided, the Directions API will compute a route that includes only roads with a height limit greater than or equal to the max vehicle height. max_height must be between 0 and 10 meters. The default value is 1.6 meters. Coverage for road height restriction may vary by region.
       */
      maxHeight?: number;
      /**
       * The max vehicle weight, in metric tons (1000 kg). If this parameter is provided, the Directions API will compute a route that includes only roads with a weight limit greater than or equal to the max vehicle weight. max_weight must be between 0 and 100 metric tons. The default value is 2.5 metric tons. Coverage for road weight restriction may vary by region.
       */
      maxWeight?: number;
      /**
       * The max vehicle width, in meters. If this parameter is provided, the Directions API will compute a route that includes only roads with a width limit greater than or equal to the max vehicle width. max_width must be between 0 and 10 meters. The default value is 1.9 meters. Coverage for road width restriction may vary by region.
       */
      maxWidth?: number;
    }
  | {
      profile: 'driving-traffic';
      /**
       * The departure time, formatted as a timestamp in ISO-8601 format in the local time at the route origin. The travel time, returned in duration, is a prediction for travel time based on historical travel data and live traffic. Live traffic is gently mixed with historical data when depart_at is set close to current time. The route takes timed turn restrictions and conditional access restrictions into account based on the requested arrival time.
       */
      departAt?: string;
      /**
       * The max vehicle height, in meters. If this parameter is provided, the Directions API will compute a route that includes only roads with a height limit greater than or equal to the max vehicle height. max_height must be between 0 and 10 meters. The default value is 1.6 meters. Coverage for road height restriction may vary by region.
       */
      maxHeight?: number;
      /**
       * The max vehicle weight, in metric tons (1000 kg). If this parameter is provided, the Directions API will compute a route that includes only roads with a weight limit greater than or equal to the max vehicle weight. max_weight must be between 0 and 100 metric tons. The default value is 2.5 metric tons. Coverage for road weight restriction may vary by region.
       */
      maxWeight?: number;
      /**
       * The max vehicle width, in meters. If this parameter is provided, the Directions API will compute a route that includes only roads with a width limit greater than or equal to the max vehicle width. max_width must be between 0 and 10 meters. The default value is 1.9 meters. Coverage for road width restriction may vary by region.
       */
      maxWidth?: number;
    };

export type DirectionsProfileExclusion =
  | {
      profile: 'walking';
      exclude?: [] | undefined;
    }
  | {
      profile: 'cycling';
      exclude?: Array<'ferry'> | undefined;
    }
  | {
      profile: 'driving' | 'driving-traffic';
      exclude?: Array<'ferry' | 'toll' | 'motorway'> | undefined;
    };

export type DirectionsRequest<T extends DirectionsGeometry = 'polyline'> =
  CommonDirectionsRequest<T> &
    DirectionsProfileInclusion &
    DirectionsProfileExclusion;

export interface Waypoint {
  /**
   * Semicolon-separated list of  {longitude},{latitude} coordinate pairs to visit in order. There can be between 2 and 25 coordinates.
   */
  coordinates: Coordinates;
  /**
   * Used to filter the road segment the waypoint will be placed on by direction and dicates the anlge of approach.
   * This option should always be used in conjunction with a `radius`. The first values is angle clockwise from true
   * north between 0 and 360, and the second is the range of degrees the angle can deviate by.
   */
  bearing?: Coordinates | undefined;
  /**
   * Used to indicate how requested routes consider from which side of the road to approach a waypoint.
   * Accepts unrestricted (default) or  curb . If set to  unrestricted , the routes can approach waypoints from either side of the road.
   * If set to  curb , the route will be returned so that on arrival, the waypoint will be found on the side that corresponds with the
   * driving_side of the region in which the returned route is located. Note that the  approaches parameter influences how you arrive at a waypoint,
   * while  bearings influences how you start from a waypoint. If provided, the list of approaches must be the same length as the list of waypoints.
   * However, you can skip a coordinate and show its position in the list with the  ; separator.
   */
  approach?: DirectionsApproach | undefined;
  /**
   * Maximum distance in meters that each coordinate is allowed to move when snapped to a nearby road segment.
   * There must be as many radiuses as there are coordinates in the request, each separated by ';'.
   * Values can be any number greater than 0 or the string 'unlimited'.
   * A  NoSegment error is returned if no routable road is found within the radius.
   */
  radius?: number | 'unlimited' | undefined;
}

export type DirectionsWaypoint = Waypoint & {
  /**
   * Custom name for the waypoint used for the arrival instruction in banners and voice instructions.
   */
  waypointName?: string | undefined;
};

export interface DirectionsResponse<T extends RouteGeometry = Polyline> {
  /**
   * Array of Route objects ordered by descending recommendation rank. May contain at most two routes.
   */
  routes: Array<Route<T>>;
  /**
   * Array of Waypoint objects. Each waypoints is an input coordinate snapped to the road and path network.
   * The waypoints appear in the array in the order of the input coordinates.
   */
  waypoints: DirectionsWaypoint[];
  /**
   * String indicating the state of the response. This is a separate code than the HTTP status code.
   * On normal valid responses, the value will be Ok.
   */
  code: string;
  uuid: string;
}

export interface Route<T extends RouteGeometry> {
  /**
   * Depending on the geometries parameter this is a GeoJSON LineString or a Polyline string.
   * Depending on the overview parameter this is the complete route geometry (full), a simplified geometry
   * to the zoom level at which the route can be displayed in full (simplified), or is not included (false)
   */
  geometry: T;
  /**
   * Array of RouteLeg objects.
   */
  legs: Leg[];
  /**
   * String indicating which weight was used. The default is routability which is duration-based,
   * with additional penalties for less desirable maneuvers.
   */
  weight_name: string;
  /**
   * Float indicating the weight in units described by weight_name
   */
  weight: number;
  /**
   * Float indicating the estimated travel time in seconds.
   */
  duration: number;
  /**
   * Float indicating the distance traveled in meters.
   */
  distance: number;
  /**
   * String of the locale used for voice instructions. Defaults to en, and can be any accepted instruction language.
   */
  voiceLocale?: string | undefined;
}

export interface Leg {
  /**
   * Depending on the summary parameter, either a String summarizing the route (true, default) or an empty String (false)
   */
  summary: string;
  weight: number;
  /**
   * Number indicating the estimated travel time in seconds
   */
  duration: number;
  /**
   * Depending on the steps parameter, either an Array of RouteStep objects (true, default) or an empty array (false)
   */
  steps: Step[];
  /**
   * Number indicating the distance traveled in meters
   */
  distance: number;
  /**
   * An annotations object that contains additional details about each line segment along the route geometry.
   * Each entry in an annotations field corresponds to a coordinate along the route geometry.
   */
  annotation: DirectionsAnnotation[];
}

export interface Step {
  /**
   * Array of objects representing all intersections along the step.
   */
  intersections: Intersection[];
  /**
   * The legal driving side at the location for this step. Either left or right.
   */
  driving_side: DirectionsSide;
  /**
   * Depending on the geometries parameter this is a GeoJSON LineString or a
   * Polyline string representing the full route geometry from this RouteStep to the next RouteStep
   */
  geometry: GeoJSON.LineString; // TODO: fix hack to accept multiline string | GeoJSON.MultiLineString;
  /**
   * String indicating the mode of transportation. Possible values:
   */
  mode: DirectionsMode;
  /**
   * One StepManeuver object
   */
  maneuver: Maneuver;
  /**
   * Any road designations associated with the road or path leading from this step’s maneuver to the next step’s maneuver.
   * Optionally included, if data is available. If multiple road designations are associated with the road, they are separated by semicolons.
   * A road designation typically consists of an alphabetic network code (identifying the road type or numbering system), a space or hyphen,
   * and a route number. You should not assume that the network code is globally unique: for example, a network code of “NH” may appear on a
   * “National Highway” or “New Hampshire”. Moreover, a route number may not even uniquely identify a road within a given network.
   */
  ref?: string | undefined;
  weight: number;
  /**
   * Number indicating the estimated time traveled time in seconds from the maneuver to the next RouteStep.
   */
  duration: number;
  /**
   * String with the name of the way along which the travel proceeds
   */
  name: string;
  /**
   * Number indicating the distance traveled in meters from the maneuver to the next RouteStep.
   */
  distance: number;
  voiceInstructions: VoiceInstruction[];
  bannerInstructions: BannerInstruction[];
  /**
   * String with the destinations of the way along which the travel proceeds. Optionally included, if data is available.
   */
  destinations?: string | undefined;
  /**
   * String with the exit numbers or names of the way. Optionally included, if data is available.
   */
  exits?: string | undefined;
  /**
   * A string containing an IPA phonetic transcription indicating how to pronounce the name in the name property.
   * This property is omitted if pronunciation data is unavailable for the step.
   */
  pronunciation?: string | undefined;
}

export interface Instruction {
  /**
   * String that contains all the text that should be displayed.
   */
  text: string;
  /**
   * Objects that, together, make up what should be displayed in the banner.
   * Includes additional information intended to be used to aid in visual layout
   */
  components: Component[];
  /**
   * The type of maneuver. May be used in combination with the modifier (and, if it is a roundabout, the degrees) to for an icon to
   * display. Possible values: 'turn', 'merge', 'depart', 'arrive', 'fork', 'off ramp', 'roundabout'
   */
  type?: string | undefined;
  /**
   * The modifier for the maneuver. Can be used in combination with the type (and, if it is a roundabout, the degrees)
   * to for an icon to display. Possible values: 'left', 'right', 'slight left', 'slight right', 'sharp left', 'sharp right', 'straight', 'uturn'
   */
  modifier?: ManeuverModifier | undefined;
  /**
   * The degrees at which you will be exiting a roundabout, assuming 180 indicates going straight through the roundabout.
   */
  degrees?: number | undefined;
  /**
   * A string representing which side the of the street people drive on in that location. Can be 'left' or 'right'.
   */
  driving_side: DirectionsSide;
}

export interface BannerInstruction {
  /**
   * Float indicating in meters, how far from the upcoming maneuver
   * the banner instruction should begin being displayed. Only 1 banner should be displayed at a time.
   */
  distanceAlongGeometry: number;
  /**
   * Most important content to display to the user. Our SDK displays this text larger and at the top.
   */
  primary: Instruction;
  /**
   * Additional content useful for visual guidance. Our SDK displays this text slightly smaller and below the primary. Can be null.
   */
  secondary?: Instruction[] | undefined;
  then?: any;
  /**
   * Additional information that is included if we feel the driver needs a heads up about something.
   * Can include information about the next maneuver (the one after the upcoming one) if the step is short -
   * can be null, or can be lane information. If we have lane information, that trumps information about the next maneuver.
   */
  sub?: Sub | undefined;
}

export interface Sub {
  /**
   * String that contains all the text that should be displayed.
   */
  text: string;
  /**
   * Objects that, together, make up what should be displayed in the banner.
   * Includes additional information intended to be used to aid in visual layout
   */
  components: Component[];
}

export interface Component {
  /**
   * String giving you more context about the component which may help in visual markup/display choices.
   * If the type of the components is unknown it should be treated as text. Note: Introduction of new types
   * is not considered a breaking change. See the Types of Banner Components table below for more info on each type.
   */
  type: string;
  /**
   * The sub-string of the parent object's text that may have additional context associated with it.
   */
  text: string;
  /**
   * The abbreviated form of text. If this is present, there will also be an abbr_priority value.
   * See the Examples of Abbreviations table below for an example of using abbr and abbr_priority.
   */
  abbr?: string | undefined;
  /**
   * An integer indicating the order in which the abbreviation abbr should be used in place of text.
   * The highest priority is 0 and a higher integer value means it should have a lower priority. There are no gaps in
   * integer values. Multiple components can have the same abbr_priority and when this happens all components with the
   * same abbr_priority should be abbreviated at the same time. Finding no larger values of abbr_priority means that the
   * string is fully abbreviated.
   */
  abbr_priority?: number | undefined;
  /**
   * String pointing to a shield image to use instead of the text.
   */
  imageBaseURL?: string | undefined;
  /**
   * (present if component is lane): An array indicating which directions you can go from a lane (left, right, or straight).
   * If the value is ['left', 'straight'], the driver can go straight or left from that lane
   */
  directions?: string[] | undefined;
  /**
   * (present if component is lane): A boolean telling you if that lane can be used to complete the upcoming maneuver.
   * If multiple lanes are active, then they can all be used to complete the upcoming maneuver.
   */
  active: boolean;
}

export interface VoiceInstruction {
  /**
   * Float indicating in meters, how far from the upcoming maneuver the voice instruction should begin.
   */
  distanceAlongGeometry: number;
  /**
   * String containing the text of the verbal instruction.
   */
  announcement: string;
  /**
   * String with SSML markup for proper text and pronunciation. Note: this property is designed for use with Amazon Polly.
   * The SSML tags contained here may not work with other text-to-speech engines.
   */
  ssmlAnnouncement: string;
}

export interface Maneuver {
  /**
   * Number between 0 and 360 indicating the clockwise angle from true north to the direction of travel right after the maneuver
   */
  bearing_after: number;
  /**
   * Number between 0 and 360 indicating the clockwise angle from true north to the direction of travel right before the maneuver
   */
  bearing_before: number;
  /**
   * Array of [ longitude, latitude ] coordinates for the point of the maneuver
   */
  location: number[];
  /**
   * Optional String indicating the direction change of the maneuver
   */
  modifier?: ManeuverModifier | undefined;
  /**
   * String indicating the type of maneuver
   */
  type: ManeuverType;
  /**
   * A human-readable instruction of how to execute the returned maneuver
   */
  instruction: string;
}

export interface Intersection {
  /**
   * Index into the bearings/entry array. Used to extract the bearing after the turn. Namely, The clockwise angle from true north to
   * the direction of travel after the maneuver/passing the intersection.
   * The value is not supplied for arrive maneuvers.
   */
  out?: number | undefined;
  /**
   * A list of entry flags, corresponding in a 1:1 relationship to the bearings.
   * A value of true indicates that the respective road could be entered on a valid route.
   * false indicates that the turn onto the respective road would violate a restriction.
   */
  entry: boolean[];
  /**
   * A list of bearing values (for example [0,90,180,270]) that are available at the intersection.
   * The bearings describe all available roads at the intersection.
   */
  bearings: number[];
  /**
   * A [longitude, latitude] pair describing the location of the turn.
   */
  location: number[];
  /**
   * Index into bearings/entry array. Used to calculate the bearing before the turn. Namely, the clockwise angle from true
   * north to the direction of travel before the maneuver/passing the intersection. To get the bearing in the direction of driving,
   * the bearing has to be rotated by a value of 180. The value is not supplied for departure maneuvers.
   */
  in?: number | undefined;
  /**
   * An array of strings signifying the classes of the road exiting the intersection.
   */
  classes?: DirectionsClass[] | undefined;
  /**
   * Array of Lane objects that represent the available turn lanes at the intersection.
   * If no lane information is available for an intersection, the lanes property will not be present.
   */
  lanes: Lane[];
}

export interface Lane {
  /**
   * Boolean value for whether this lane can be taken to complete the maneuver. For instance, if the lane array has four objects and the
   * first two are marked as valid, then the driver can take either of the left lanes and stay on the route.
   */
  valid: boolean;
  /**
   * Array of signs for each turn lane. There can be multiple signs. For example, a turning lane can have a sign with an arrow pointing left and another sign with an arrow pointing straight.
   */
  indications: string[];
}
