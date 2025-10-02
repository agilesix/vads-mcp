/**
 * Type definitions for the VA Docs Sync Utility
 */

/**
 * Configuration for the documentation sync process
 */
export interface SyncConfig {
	/** GitHub repository URL to clone */
	repoUrl: string;
	/** Local directory to clone repository into */
	localRepoPath: string;
	/** R2 bucket name */
	r2BucketName: string;
	/** Base path in R2 bucket (optional prefix) */
	r2BasePath?: string;
	/** Smart discovery configuration */
	smartDiscovery: SmartDiscoveryConfig;
}

/**
 * Configuration for smart markdown file discovery
 */
export interface SmartDiscoveryConfig {
	/** Base directory to start search from */
	baseDirectory: string;
	/** Glob patterns to exclude */
	excludePatterns: string[];
	/** Only include files matching these patterns (optional) */
	includePatterns?: string[];
}

/**
 * Information about a markdown file to be synced
 */
export interface MarkdownFile {
	/** Absolute path to the file on local filesystem */
	absolutePath: string;
	/** Relative path from repository root */
	relativePath: string;
	/** Path to use in R2 bucket */
	r2Key: string;
	/** File size in bytes */
	size: number;
	/** Last modified timestamp */
	lastModified: Date;
}

/**
 * Statistics from a sync operation
 */
export interface SyncStats {
	/** Total files found */
	totalFiles: number;
	/** Files successfully uploaded */
	uploaded: number;
	/** Files that failed to upload */
	failed: number;
	/** Files skipped (if any) */
	skipped: number;
	/** Total bytes uploaded */
	totalBytes: number;
	/** Sync duration in milliseconds */
	duration: number;
	/** List of failed file paths (if any) */
	errors: Array<{ file: string; error: string }>;
}

/**
 * Options for the sync operation
 */
export interface SyncOptions {
	/** If true, don't actually upload files */
	dryRun: boolean;
	/** If true, show verbose logging */
	verbose: boolean;
	/** Maximum concurrent uploads */
	concurrency: number;
}

/**
 * Result of a git clone/pull operation
 */
export interface GitOperationResult {
	/** Whether operation was successful */
	success: boolean;
	/** Whether repository was newly cloned or pulled */
	action: 'cloned' | 'pulled';
	/** Commit hash after operation */
	commitHash?: string;
	/** Error message if failed */
	error?: string;
}

/**
 * Result of uploading a single file to R2
 */
export interface UploadResult {
	/** The file that was uploaded */
	file: MarkdownFile;
	/** Whether upload was successful */
	success: boolean;
	/** Error message if failed */
	error?: string;
	/** Upload duration in milliseconds */
	duration: number;
}
