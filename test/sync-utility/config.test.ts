import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DEFAULT_CONFIG, DEFAULT_OPTIONS, parseCliOptions, getConfig, getOptions } from '../../sync-utility/src/config';

describe('config', () => {
	describe('DEFAULT_CONFIG', () => {
		it('should have required configuration fields', () => {
			expect(DEFAULT_CONFIG.repoUrl).toBe('https://github.com/department-of-veterans-affairs/vets-design-system-documentation.git');
			expect(DEFAULT_CONFIG.r2BucketName).toBe('vads-docs');
			expect(DEFAULT_CONFIG.localRepoPath).toContain('vets-design-system-documentation');
		});

		it('should have smart discovery enabled', () => {
			expect(DEFAULT_CONFIG.smartDiscovery).toBeDefined();
			expect(DEFAULT_CONFIG.smartDiscovery.baseDirectory).toBe('src');
			expect(DEFAULT_CONFIG.smartDiscovery.excludePatterns).toBeInstanceOf(Array);
			expect(DEFAULT_CONFIG.smartDiscovery.excludePatterns.length).toBeGreaterThan(0);
		});

		it('should exclude common non-documentation patterns', () => {
			const patterns = DEFAULT_CONFIG.smartDiscovery.excludePatterns;

			expect(patterns).toContain('node_modules/**');
			expect(patterns).toContain('_site/**');
			expect(patterns).toContain('dist/**');
			expect(patterns).toContain('**/*.test.md');
		});

		it('should have undefined r2BasePath by default', () => {
			expect(DEFAULT_CONFIG.r2BasePath).toBeUndefined();
		});
	});

	describe('DEFAULT_OPTIONS', () => {
		it('should have correct default values', () => {
			expect(DEFAULT_OPTIONS.dryRun).toBe(false);
			expect(DEFAULT_OPTIONS.verbose).toBe(false);
			expect(DEFAULT_OPTIONS.concurrency).toBe(5);
		});
	});

	describe('parseCliOptions', () => {
		it('should parse dry-run flag (long form)', () => {
			const args = ['--dry-run'];
			const options = parseCliOptions(args);

			expect(options.dryRun).toBe(true);
		});

		it('should parse dry-run flag (short form)', () => {
			const args = ['-d'];
			const options = parseCliOptions(args);

			expect(options.dryRun).toBe(true);
		});

		it('should parse verbose flag (long form)', () => {
			const args = ['--verbose'];
			const options = parseCliOptions(args);

			expect(options.verbose).toBe(true);
		});

		it('should parse verbose flag (short form)', () => {
			const args = ['-v'];
			const options = parseCliOptions(args);

			expect(options.verbose).toBe(true);
		});

		it('should parse concurrency option (long form)', () => {
			const args = ['--concurrency', '10'];
			const options = parseCliOptions(args);

			expect(options.concurrency).toBe(10);
		});

		it('should parse concurrency option (short form)', () => {
			const args = ['-c', '15'];
			const options = parseCliOptions(args);

			expect(options.concurrency).toBe(15);
		});

		it('should parse multiple flags together', () => {
			const args = ['--dry-run', '--verbose', '--concurrency', '20'];
			const options = parseCliOptions(args);

			expect(options.dryRun).toBe(true);
			expect(options.verbose).toBe(true);
			expect(options.concurrency).toBe(20);
		});

		it('should handle empty args array', () => {
			const options = parseCliOptions([]);

			expect(options).toEqual({});
		});

		it('should ignore invalid concurrency values', () => {
			const args = ['--concurrency', 'invalid'];
			const options = parseCliOptions(args);

			expect(options.concurrency).toBeUndefined();
		});

		it('should ignore negative concurrency values', () => {
			const args = ['--concurrency', '-5'];
			const options = parseCliOptions(args);

			expect(options.concurrency).toBeUndefined();
		});

		it('should ignore zero concurrency value', () => {
			const args = ['--concurrency', '0'];
			const options = parseCliOptions(args);

			expect(options.concurrency).toBeUndefined();
		});

		it('should handle concurrency flag without value', () => {
			const args = ['--concurrency'];
			const options = parseCliOptions(args);

			expect(options.concurrency).toBeUndefined();
		});
	});

	describe('getConfig', () => {
		it('should return default config when no env vars set', () => {
			const config = getConfig();

			expect(config.repoUrl).toBe(DEFAULT_CONFIG.repoUrl);
			expect(config.r2BucketName).toBe(DEFAULT_CONFIG.r2BucketName);
			expect(config.r2BasePath).toBe(DEFAULT_CONFIG.r2BasePath);
		});

		it('should preserve smartDiscovery config', () => {
			const config = getConfig();

			expect(config.smartDiscovery).toEqual(DEFAULT_CONFIG.smartDiscovery);
		});

		// Note: Environment variable override tests are skipped in Workers environment
		// These should be tested in Node.js integration tests
		it.skip('should override repoUrl with REPO_URL env var', () => {
			// Skipped: env vars don't work in Workers test pool
		});

		it.skip('should override r2BucketName with R2_BUCKET_NAME env var', () => {
			// Skipped: env vars don't work in Workers test pool
		});

		it.skip('should override r2BasePath with R2_BASE_PATH env var', () => {
			// Skipped: env vars don't work in Workers test pool
		});

		it.skip('should override multiple values with env vars', () => {
			// Skipped: env vars don't work in Workers test pool
		});
	});

	describe('getOptions', () => {
		let originalArgv: string[];

		beforeEach(() => {
			originalArgv = process.argv;
		});

		afterEach(() => {
			process.argv = originalArgv;
		});

		it('should return default options when no CLI args', () => {
			process.argv = ['node', 'script.js'];

			const options = getOptions();

			expect(options).toEqual(DEFAULT_OPTIONS);
		});

		it('should merge CLI args with defaults', () => {
			process.argv = ['node', 'script.js', '--dry-run', '--concurrency', '10'];

			const options = getOptions();

			expect(options.dryRun).toBe(true);
			expect(options.verbose).toBe(false); // default
			expect(options.concurrency).toBe(10);
		});

		it('should override defaults with CLI args', () => {
			process.argv = ['node', 'script.js', '--verbose', '-d'];

			const options = getOptions();

			expect(options.dryRun).toBe(true);
			expect(options.verbose).toBe(true);
			expect(options.concurrency).toBe(5); // default
		});
	});
});
