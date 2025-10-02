/**
 * Logging utilities with colored output
 */

import chalk from 'chalk';

/**
 * Logger with colored output for better readability
 */
export class Logger {
	private verbose: boolean;

	constructor(verbose = false) {
		this.verbose = verbose;
	}

	/**
	 * Log an info message
	 */
	info(message: string): void {
		console.log(chalk.blue('ℹ'), message);
	}

	/**
	 * Log a success message
	 */
	success(message: string): void {
		console.log(chalk.green('✓'), message);
	}

	/**
	 * Log a warning message
	 */
	warn(message: string): void {
		console.log(chalk.yellow('⚠'), message);
	}

	/**
	 * Log an error message
	 */
	error(message: string): void {
		console.log(chalk.red('✗'), message);
	}

	/**
	 * Log a verbose message (only if verbose mode is enabled)
	 */
	debug(message: string): void {
		if (this.verbose) {
			console.log(chalk.gray('→'), chalk.gray(message));
		}
	}

	/**
	 * Log a progress update
	 */
	progress(current: number, total: number, item?: string): void {
		const percentage = Math.round((current / total) * 100);
		const bar = this.createProgressBar(percentage);
		const itemText = item ? ` ${chalk.gray(item)}` : '';
		process.stdout.write(`\r${bar} ${percentage}%${itemText}`);

		if (current === total) {
			process.stdout.write('\n');
		}
	}

	/**
	 * Create a progress bar
	 */
	private createProgressBar(percentage: number, width = 30): string {
		const filled = Math.round((percentage / 100) * width);
		const empty = width - filled;
		return chalk.green('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));
	}

	/**
	 * Log a section header
	 */
	section(title: string): void {
		console.log(`\n${chalk.bold.cyan(title)}`);
	}

	/**
	 * Log a step
	 */
	step(number: number, title: string): void {
		console.log(`\n${chalk.bold(`Step ${number}:`)} ${title}`);
	}

	/**
	 * Log statistics
	 */
	stats(stats: Record<string, string | number>): void {
		console.log(chalk.bold('\n📊 Statistics:'));
		for (const [key, value] of Object.entries(stats)) {
			console.log(`  ${chalk.cyan(key)}: ${chalk.white(value)}`);
		}
	}

	/**
	 * Log a divider
	 */
	divider(char = '─', length = 60): void {
		console.log(chalk.gray(char.repeat(length)));
	}

	/**
	 * Start a timer and return a function to log the elapsed time
	 */
	startTimer(label: string): () => void {
		const start = Date.now();
		this.debug(`Timer started: ${label}`);

		return () => {
			const duration = Date.now() - start;
			const seconds = (duration / 1000).toFixed(2);
			this.debug(`Timer stopped: ${label} (${seconds}s)`);
		};
	}

	/**
	 * Format bytes as human-readable string
	 */
	formatBytes(bytes: number): string {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
	}

	/**
	 * Format duration as human-readable string
	 */
	formatDuration(ms: number): string {
		const seconds = Math.floor(ms / 1000);
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = seconds % 60;

		if (minutes > 0) {
			return `${minutes}m ${remainingSeconds}s`;
		}
		return `${seconds}s`;
	}
}

/**
 * Create a logger instance
 */
export function createLogger(verbose = false): Logger {
	return new Logger(verbose);
}
