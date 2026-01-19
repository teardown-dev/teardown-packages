export enum DaytonaSandboxStatusEnum {
	CREATING = "CREATING",
	STARTED = "STARTED",
	STOPPED = "STOPPED",
	ARCHIVED = "ARCHIVED",
	ERROR = "ERROR",
	DELETED = "DELETED",
}

export enum DevServerInstanceStatusEnum {
	CREATING = "CREATING",
	DEPLOYING = "DEPLOYING",
	RUNNING = "RUNNING",
	STOPPING = "STOPPING",
	STOPPED = "STOPPED",
	ERROR = "ERROR",
	DESTROYED = "DESTROYED",
}

export enum DevicePlatformEnum {
	IOS = "IOS",
	ANDROID = "ANDROID",
	WEB = "WEB",
	WINDOWS = "WINDOWS",
	MACOS = "MACOS",
	LINUX = "LINUX",
	PHONE = "PHONE",
	TABLET = "TABLET",
	DESKTOP = "DESKTOP",
	CONSOLE = "CONSOLE",
	TV = "TV",
	WEARABLE = "WEARABLE",
	GAME_CONSOLE = "GAME_CONSOLE",
	VR = "VR",
	UNKNOWN = "UNKNOWN",
	OTHER = "OTHER",
}

export enum EnvironmentTypeEnum {
	DEVELOPMENT = "DEVELOPMENT",
	STAGING = "STAGING",
	PRODUCTION = "PRODUCTION",
}

export enum InvestorAccessStatusEnum {
	PENDING = "PENDING",
	APPROVED = "APPROVED",
	REJECTED = "REJECTED",
}

export enum MessageRoleEnum {
	USER = "USER",
	ASSISTANT = "ASSISTANT",
	SYSTEM = "SYSTEM",
	TOOL = "TOOL",
}

export enum OrgInvitationStatusEnum {
	PENDING = "PENDING",
	ACCEPTED = "ACCEPTED",
	CANCELLED = "CANCELLED",
	EXPIRED = "EXPIRED",
}

export enum OrgRoleTypeEnum {
	OWNER = "OWNER",
	ADMIN = "ADMIN",
	ENGINEER = "ENGINEER",
}

export enum OrgTypeEnum {
	PERSONAL = "PERSONAL",
	START_UP = "START_UP",
	SCALE_UP = "SCALE_UP",
	AGENCY = "AGENCY",
	ENTERPRISE = "ENTERPRISE",
}

export enum ProjectApiKeyKindEnum {
	publishable = "publishable",
	secret = "secret",
}

export enum ProjectStatusEnum {
	PENDING_SETUP = "PENDING_SETUP",
	ACTIVE = "ACTIVE",
	PAUSED = "PAUSED",
	ARCHIVED = "ARCHIVED",
}

export enum ProjectTypeEnum {
	REACT_NATIVE = "REACT_NATIVE",
	EXPO = "EXPO",
}

export enum ProjectVersionStatusEnum {
	SUPPORTED = "SUPPORTED",
	UPDATE_AVAILABLE = "UPDATE_AVAILABLE",
	UPDATE_RECOMMENDED = "UPDATE_RECOMMENDED",
	UPDATE_REQUIRED = "UPDATE_REQUIRED",
}

export enum SandboxScopeEnum {
	PROJECT = "PROJECT",
	ORG = "ORG",
	PERSONAL = "PERSONAL",
}

export enum SandboxStatusEnum {
	CREATING = "CREATING",
	RUNNING = "RUNNING",
	PAUSED = "PAUSED",
	TERMINATED = "TERMINATED",
	ERROR = "ERROR",
}

export enum SubscriptionStatusEnum {
	ACTIVE = "ACTIVE",
	PAST_DUE = "PAST_DUE",
	CANCELED = "CANCELED",
	TRIALING = "TRIALING",
	INCOMPLETE = "INCOMPLETE",
	INCOMPLETE_EXPIRED = "INCOMPLETE_EXPIRED",
	UNPAID = "UNPAID",
}

export enum SubscriptionTierEnum {
	FREE = "FREE",
	STARTER = "STARTER",
	GROWTH = "GROWTH",
	SCALE = "SCALE",
}

export enum VersionBuildStatusEnum {
	SUPPORTED = "SUPPORTED",
	UPDATE_AVAILABLE = "UPDATE_AVAILABLE",
	UPDATE_RECOMMENDED = "UPDATE_RECOMMENDED",
	UPDATE_REQUIRED = "UPDATE_REQUIRED",
}
